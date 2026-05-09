'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Clock,
    Briefcase,
    Gavel,
    Tag,
    Trash2
} from 'lucide-react';
import '@/styles/LawyerCalendar.css';
import '@/styles/Dashboard.css';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const EVENT_TYPES = {
    hearing: { label: 'Hearing', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    reminder: { label: 'Reminder', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    matter: { label: 'Matter', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    custom: { label: 'Custom', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
};

const toDateKey = (d) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const LawyerCalendarPage = () => {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [events, setEvents] = useState({}); // { 'YYYY-MM-DD': [...events] }
    const [selectedDay, setSelectedDay] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', type: 'custom', note: '', eventDate: '' });
    const [agendaEvents, setAgendaEvents] = useState([]);

    // Load cases and build events from hearings + reminders
    const loadCaseEvents = useCallback(async () => {
        try {
            const data = await authService.getCases();
            if (!data.success) return;

            const built = {};

            data.cases.forEach(c => {
                // Filing date → matter event
                if (c.filingDate) {
                    const key = toDateKey(c.filingDate);
                    if (!built[key]) built[key] = [];
                    built[key].push({
                        id: `matter-${c.id}`,
                        title: `Matter Opened: ${c.title}`,
                        type: 'matter',
                        note: `Client: ${c.client} | ${c.caseType}`,
                        source: 'case',
                    });
                }

                // Deadlines / reminders
                if (c.deadlines) {
                    c.deadlines.forEach((d, i) => {
                        if (!d.dueDate) return;
                        const key = toDateKey(d.dueDate);
                        if (!built[key]) built[key] = [];
                        built[key].push({
                            id: `reminder-${c.id}-${i}`,
                            title: d.title || 'Reminder',
                            type: d.title?.toLowerCase().includes('hear') ? 'hearing' : 'reminder',
                            note: `Case: ${c.title}`,
                            source: 'case',
                            done: d.isCompleted,
                        });
                    });
                }
            });

            // Merge with stored custom events
            const stored = JSON.parse(localStorage.getItem('calendarCustomEvents') || '{}');
            const merged = { ...built };
            Object.keys(stored).forEach(key => {
                merged[key] = [...(merged[key] || []), ...stored[key]];
            });

            setEvents(merged);
        } catch (err) {
            console.error('Failed to load calendar events', err);
        }
    }, []);

    useEffect(() => {
        loadCaseEvents();
    }, [loadCaseEvents]);

    // Build agenda for current month
    useEffect(() => {
        const list = [];
        Object.keys(events).forEach(key => {
            const [y, m] = key.split('-').map(Number);
            if (y === viewYear && m - 1 === viewMonth) {
                events[key].forEach(ev => list.push({ date: key, ...ev }));
            }
        });
        list.sort((a, b) => a.date.localeCompare(b.date));
        setAgendaEvents(list);
    }, [events, viewYear, viewMonth]);

    // Calendar grid
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();
    const cells = [];

    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
    while (cells.length % 7 !== 0) cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false });

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleAddEvent = (e) => {
        e.preventDefault();
        if (!newEvent.eventDate || !newEvent.title.trim()) return;

        const key = newEvent.eventDate; // already in YYYY-MM-DD format
        const { eventDate, ...rest } = newEvent;
        const ev = { ...rest, id: `custom-${Date.now()}`, source: 'custom' };

        const stored = JSON.parse(localStorage.getItem('calendarCustomEvents') || '{}');
        stored[key] = [...(stored[key] || []), ev];
        localStorage.setItem('calendarCustomEvents', JSON.stringify(stored));

        setEvents(prev => ({ ...prev, [key]: [...(prev[key] || []), ev] }));
        setNewEvent({ title: '', type: 'custom', note: '', eventDate: '' });
        setShowAddModal(false);
    };

    const handleDeleteCustom = (dateKey, evId) => {
        const stored = JSON.parse(localStorage.getItem('calendarCustomEvents') || '{}');
        if (stored[dateKey]) {
            stored[dateKey] = stored[dateKey].filter(e => e.id !== evId);
            localStorage.setItem('calendarCustomEvents', JSON.stringify(stored));
        }
        setEvents(prev => ({
            ...prev,
            [dateKey]: (prev[dateKey] || []).filter(e => e.id !== evId)
        }));
    };

    const isToday = (day) =>
        day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

    return (
        <div className="dashboard-body">
            <LawyerSidebar />

            <div className="dashboard-main cal-light-bg">
                {/* Calendar Light Header */}
                <header className="cal-page-header">
                    <div className="cal-header-left">
                        <CalendarDays size={26} className="cal-header-icon" />
                        <div>
                            <h1 className="cal-header-title">My Calendar</h1>
                            <p className="cal-header-sub">Manage hearings, deadlines &amp; meetings</p>
                        </div>
                    </div>
                    <div className="cal-header-right">
                        {/* Month Navigator — big and clear */}
                        <div className="cal-month-nav">
                            <button className="cal-nav-btn" onClick={prevMonth} title="Previous month">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="cal-month-label">{MONTHS[viewMonth]} {viewYear}</span>
                            <button className="cal-nav-btn" onClick={nextMonth} title="Next month">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <button
                            className="cal-add-btn"
                            onClick={() => {
                                const todayKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay || today.getDate()).padStart(2, '0')}`;
                                setNewEvent({ title: '', type: 'custom', note: '', eventDate: todayKey });
                                setShowAddModal(true);
                            }}
                        >
                            <Plus size={18} /> Add Event
                        </button>
                    </div>
                </header>


                {/* Main layout */}
                <div className="cal-layout">
                    {/* Calendar Grid */}
                    <div className="cal-grid-panel">
                        {/* Day headers */}
                        <div className="cal-day-headers">
                            {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
                        </div>

                        {/* Grid */}
                        <div className="cal-grid">
                            {cells.map((cell, idx) => {
                                const key = cell.cur
                                    ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
                                    : null;
                                const dayEvents = key ? (events[key] || []) : [];

                                return (
                                    <div
                                        key={idx}
                                        className={`cal-cell ${!cell.cur ? 'cal-cell--dim' : ''} ${isToday(cell.day) && cell.cur ? 'cal-cell--today' : ''} ${selectedDay === cell.day && cell.cur ? 'cal-cell--selected' : ''}`}
                                        onClick={() => {
                            if (cell.cur) {
                                setSelectedDay(cell.day);
                                setNewEvent(prev => ({ ...prev, eventDate: key }));
                            }
                        }}
                                    >
                                        <span className="cal-date-num">{cell.day}</span>
                                        <div className="cal-event-chips">
                                            {dayEvents.slice(0, 3).map(ev => (
                                                <div
                                                    key={ev.id}
                                                    className="cal-chip"
                                                    style={{ background: EVENT_TYPES[ev.type]?.bg, borderLeft: `3px solid ${EVENT_TYPES[ev.type]?.color}` }}
                                                >
                                                    {ev.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="cal-chip cal-chip--more">+{dayEvents.length - 3} more</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Agenda Sidebar */}
                    <div className="cal-agenda-panel">
                        <div className="cal-agenda-header">
                            <span className="cal-agenda-dot"></span>
                            AGENDA: {MONTHS[viewMonth].toUpperCase()}
                        </div>
                        <div className="cal-agenda-list">
                            {agendaEvents.length === 0 ? (
                                <div className="cal-agenda-empty">
                                    <CalendarDays size={32} />
                                    <p>No events this month</p>
                                </div>
                            ) : agendaEvents.map((ev) => {
                                const [, , d] = ev.date.split('-');
                                const mon = MONTHS[viewMonth].slice(0, 3).toUpperCase();
                                const type = EVENT_TYPES[ev.type] || EVENT_TYPES.custom;
                                return (
                                    <div key={ev.id + ev.date} className="cal-agenda-item">
                                        <div className="cal-agenda-date">
                                            <span className="cal-agenda-day">{parseInt(d)}</span>
                                            <span className="cal-agenda-mon">{mon}</span>
                                        </div>
                                        <div className="cal-agenda-body">
                                            <div className="cal-agenda-title">{ev.title}</div>
                                            <div className="cal-agenda-type" style={{ color: type.color }}>
                                                {type.label.toUpperCase()}
                                            </div>
                                            {ev.note && <div className="cal-agenda-note">{ev.note}</div>}
                                        </div>
                                        <div className="cal-agenda-indicator" style={{ background: type.color }}></div>
                                        {ev.source === 'custom' && (
                                            <button
                                                className="cal-agenda-del"
                                                onClick={() => handleDeleteCustom(ev.date, ev.id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-box cal-modal">
                        <div className="modal-header">
                            <h2>
                                <CalendarDays size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                Add Event
                            </h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleAddEvent} className="modal-form">
                            <div className="form-group">
                                <label>DATE</label>
                                <input
                                    type="date"
                                    value={newEvent.eventDate}
                                    onChange={e => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontFamily: 'Inter, sans-serif',
                                        fontSize: '0.9rem',
                                        color: '#0f172a',
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>EVENT TITLE *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Court Hearing — Plaintiff vs Defendant"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>EVENT TYPE</label>
                                <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                                    <option value="custom">Custom</option>
                                    <option value="hearing">Hearing</option>
                                    <option value="reminder">Reminder / Deadline</option>
                                    <option value="matter">Matter</option>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label>NOTE (OPTIONAL)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Any additional details..."
                                    value={newEvent.note}
                                    onChange={e => setNewEvent({ ...newEvent, note: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-save">
                                    <Plus size={16} /> Save Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerCalendarPage;

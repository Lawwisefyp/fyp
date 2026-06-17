'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import { CheckCircle2, Clock, Users, Bell, AlertTriangle, MessageCircle } from 'lucide-react';
import '@/styles/LawyerNotifications.css';
import '@/styles/Dashboard.css';

const LawyerNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const lawyerInfo = JSON.parse(localStorage.getItem('lawyerInfo') || '{}');
            setUserId(lawyerInfo._id || lawyerInfo.id || lawyerInfo.lawyerId);
        }
    }, []);

    useEffect(() => {
        const fetchNotifs = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                // Sync first to get latest reminders
                await authService.syncNotifications();
                const data = await authService.getNotifications();
                if (data.success) {
                    setNotifications(data.notifications);
                    // Mark as read after a short delay or immediately
                    await authService.markNotificationsAsRead();
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifs();
    }, [userId]);

    const handleRespond = async (id, response) => {
        try {
            const data = await authService.respondToConnection(id, response);
            if (data.success) {
                // Refresh
                const refreshed = await authService.getNotifications();
                setNotifications(refreshed.notifications);
            }
        } catch (error) {
            console.error('Failed to respond', error);
        }
    };

    const handleMarkDone = async (notif) => {
        try {
            if (!notif.caseId) return;

            // If it's a specific reminder in the deadlines array
            if (notif.reminderId) {
                // Fetch case to get deadlines
                const caseDataRes = await authService.getCases();
                const targetCase = caseDataRes.cases.find(c => c.id === notif.caseId);
                if (!targetCase) return;

                const updatedDeadlines = targetCase.deadlines.map(d =>
                    d._id === notif.reminderId ? { ...d, isCompleted: true } : d
                );

                const data = await authService.updateCase(notif.caseId, { deadlines: updatedDeadlines });
                if (data.success) {
                    alert('Reminder marked as completed!');
                }
            } else {
                // If it's a top-level field reminder (like nextHearingDate), we just acknowledge it
                alert('Hearing alert acknowledged.');
            }

            // Always remove notification from the feed once it's handled
            await authService.deleteNotification(notif._id);

            // Refresh the list
            const refreshed = await authService.getNotifications();
            setNotifications(refreshed.notifications);

        } catch (error) {
            console.error('Failed to mark as done', error);
        }
    };

    const filteredNotifs = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'connection') return ['connection', 'connection_request', 'accepted'].includes(n.type);
        if (filter === 'deadline') return n.type === 'deadline';
        if (filter === 'hearing') return n.type === 'hearing' || n.type === 'hearing_reminder';
        return true;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'connection_request': return <Users size={20} />;
            case 'deadline': return <Clock size={20} />;
            case 'hearing_reminder': return <AlertTriangle size={20} />;
            default: return <Bell size={20} />;
        }
    };

    return (
        <div className="dashboard-body">
            <LawyerSidebar />

            <main className="notifications-main-content" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="notifications-container-wrapper" style={{ padding: '30px' }}>

                    <div className="notifications-top-header">
                        <h1 className="notifications-hero-title">Notifications</h1>
                        <div className="notification-badge-count" style={{ background: '#1e40af', color: 'white', padding: '4px 12px' }}>
                            {notifications.length} Total
                        </div>
                    </div>

                    <div className="notification-filter-tabs">
                        <button 
                            className={`notification-tab-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Updates
                        </button>
                        <button 
                            className={`notification-tab-btn ${filter === 'connection' ? 'active' : ''}`}
                            onClick={() => setFilter('connection')}
                        >
                            <Users size={16} /> Connections
                        </button>
                        <button 
                            className={`notification-tab-btn ${filter === 'deadline' ? 'active' : ''}`}
                            onClick={() => setFilter('deadline')}
                        >
                            <Clock size={16} /> Deadlines
                        </button>
                        <button 
                            className={`notification-tab-btn ${filter === 'hearing' ? 'active' : ''}`}
                            onClick={() => setFilter('hearing')}
                        >
                            <AlertTriangle size={16} /> Hearings
                        </button>
                    </div>

                    <div className="notifications-feed">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                <p>Loading your secure updates...</p>
                            </div>
                        ) : filteredNotifs.length > 0 ? (
                            filteredNotifs.map(n => (
                                <div key={n._id} className="notification-item-card" style={{ opacity: n.isRead ? 0.8 : 1 }}>
                                    <div className="notification-card-header">
                                        <div className={`notification-card-icon ${n.type === 'accepted' ? 'accepted' : n.type === 'deadline' ? 'deadline' : n.type === 'connection_request' ? 'connection' : 'hearing_reminder'}`}>
                                            {n.type === 'accepted' ? '✅' : n.type === 'connection_request' ? '🤝' : n.type === 'deadline' ? '⏰' : '🔔'}
                                        </div>
                                        <div className="notification-card-meta">
                                            <div className={`notification-card-type ${n.type === 'accepted' ? 'accepted' : n.type === 'deadline' ? 'deadline' : n.type === 'connection_request' ? 'connection' : 'hearing_reminder'}`}>
                                                {n.type?.replace('_', ' ')}
                                            </div>
                                            <h3 className="notification-card-title">{n.title || 'System Alert'}</h3>
                                            <p className="notification-card-msg">{n.message}</p>
                                            <span className="notification-item-time">
                                                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions Section */}
                                    {(n.type === 'connection_request' && n.status === 'pending') || 
                                     ((n.type === 'deadline' || n.type === 'hearing_reminder') && n.caseId) ||
                                     (n.status === 'accepted' || n.type === 'accepted') ? (
                                        <div className="notification-card-footer" style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                                            {/* Connection Request Actions */}
                                            {n.type === 'connection_request' && n.status === 'pending' && (
                                                <>
                                                    <button className="btn-notif-action btn-notif-success" onClick={() => handleRespond(n.relatedId, 'accepted')}>✓ Accept</button>
                                                    <button className="btn-notif-action btn-notif-danger" onClick={() => handleRespond(n.relatedId, 'rejected')}>✕ Decline</button>
                                                </>
                                            )}

                                            {/* Deadline/Hearing Actions */}
                                            {(n.type === 'deadline' || n.type === 'hearing_reminder') && n.caseId && (
                                                <button className="btn-mark-done-inline" onClick={() => handleMarkDone(n)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                                    <CheckCircle2 size={16} /> Mark as Done
                                                </button>
                                            )}

                                            {/* Accepted Connection Messaging Action */}
                                            {(n.status === 'accepted' || n.type === 'accepted') && (
                                                <button 
                                                    onClick={() => window.location.href = '/communication'}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '12px 24px',
                                                        borderRadius: '10px',
                                                        fontWeight: '700',
                                                        fontSize: '0.9rem',
                                                        cursor: 'pointer',
                                                        letterSpacing: '0.03em',
                                                        boxShadow: '0 4px 14px rgba(30, 58, 138, 0.3)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <MessageCircle size={16} />
                                                    Start Messaging
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            ))
                        ) : (
                            <div className="empty-notifs" style={{ textAlign: 'center', padding: '100px 0' }}>
                                <Bell size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                <h3>No notifications yet</h3>
                                <p>We'll notify you when something important happens.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LawyerNotificationsPage;

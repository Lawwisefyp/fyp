'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LawyerSidebar from '@/components/LawyerSidebar';
import { 
    MessageSquare, 
    PenTool, 
    ClipboardList, 
    Library, 
    Mail, 
    Users, 
    Bell, 
    HelpCircle, 
    Activity, 
    Briefcase,
    X,
    CalendarDays,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    Video,
    AlertCircle
} from 'lucide-react';
import { authService } from '@/lib/services/api';
import '@/styles/Dashboard.css';
import '@/styles/LawyerNetworking.css';
import '@/styles/LawyerCalendar.css';

const LawyerDashboard = () => {
    const [lawyer, setLawyer] = useState(null);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const router = useRouter();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const info = localStorage.getItem('lawyerInfo');
        const token = localStorage.getItem('lawyerToken') || sessionStorage.getItem('lawyerToken');

        if (!token || !info) {
            router.push('/lawyer-portal');
            return;
        }

        const parsedLawyer = JSON.parse(info);
        setLawyer(parsedLawyer);

        const fetchDashboardData = async () => {
            try {
                const response = await authService.getAnalytics();
                if (response.success) {
                    setDashboardData(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Sync notifications for reminders
        const syncNotifs = async () => {
            try {
                await authService.syncNotifications();
            } catch (err) {
                console.error('Failed to sync notifications on dashboard:', err);
            }
        };
        syncNotifs();
    }, [router]);

    const logout = () => {
        localStorage.removeItem('lawyerToken');
        sessionStorage.removeItem('lawyerToken');
        localStorage.removeItem('lawyerInfo');
        router.push('/lawyer-portal');
    };

    if (!lawyer) return <div className="dashboard-body"><div className="dashboard-container">Loading...</div></div>;

    const features = [
        { title: 'AI Chatbot', icon: MessageSquare, desc: "A chatbot to provide instant assistance and offer legal advice.", path: '/chatbot', color1: '#3b82f6', color2: '#2563eb', bg: '#eff6ff' },
        { title: 'Legal Drafting', icon: PenTool, desc: 'Generate legal documents based on user input, saving time.', path: '/ai-drafting', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'Case History and Tracking', icon: ClipboardList, desc: "Track the history and progress of legal cases from start to finish.", path: '/case-history', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'My Clients', icon: Users, desc: "Manage your connected clients and incoming connection requests.", path: '/my-clients', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'Briefcase', icon: Briefcase, desc: "Store and manage legal documents", path: '/law-library', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'Communication', icon: Mail, desc: "Secure messaging and appointment scheduling between lawyers and clients.", path: '/communication', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'Professional Networking', icon: Users, desc: 'A platform for lawyers to connect and collaborate with others.', path: '/networking', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'Notifications', icon: Bell, desc: "Push notifications to keep users informed of important updates.", path: '/notifications', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'Digital Guidance', icon: HelpCircle, desc: "Tutorial videos to guide lawyers on using the app's features.", path: '/digital-guidance', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'Analytics', icon: Activity, desc: "Personalized dashboard for to view their case details and appointments.", path: '/analytics', color1: '#3b82f6', color2: '#1d4ed8', bg: '#f0f7ff' },
        { title: 'Manage Schedule', icon: CalendarDays, desc: 'Set your free slots and manage consultation availability.', path: '/lawyer-schedule', color1: '#10b981', color2: '#059669', bg: '#ecfdf5' },
        { title: 'Consultations', icon: CalendarCheck, desc: 'View and manage your upcoming client meetings.', path: '/lawyer-appointments', color1: '#3b82f6', color2: '#2563eb', bg: '#eff6ff' }
    ];

    const initials = lawyer?.fullName ? lawyer.fullName.split(' ').map(n => n[0]).join('') : 'L';
    const avatarUrl = lawyer?.personalInfo?.profilePicture 
        ? `http://localhost:5001/${lawyer.personalInfo.profilePicture.replace(/\\/g, '/')}`
        : null;

    const MINI_DAYS = ['S','M','T','W','T','F','S'];
    const MINI_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const EVENT_COLORS = { hearing: '#2563eb', reminder: '#3b82f6', matter: '#1d4ed8', custom: '#60a5fa' };

    const MiniCalendar = () => {
        const today = new Date();
        const [calMonth, setCalMonth] = useState(today.getMonth());
        const [calYear, setCalYear] = useState(today.getFullYear());
        const [calEvents, setCalEvents] = useState({});

        useEffect(() => {
            const stored = JSON.parse(localStorage.getItem('calendarCustomEvents') || '{}');
            setCalEvents(stored);
        }, []);

        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const prevDays = new Date(calYear, calMonth, 0).getDate();
        const cells = [];
        for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
        for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
        while (cells.length % 7 !== 0) cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false });

        const getKey = (d) => `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday = (d) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
        const hasEvent = (d) => !!(calEvents[getKey(d)]?.length);

        const upcoming = [];
        for (let d = today.getDate(); d <= daysInMonth && upcoming.length < 3; d++) {
            const key = getKey(d);
            if (calEvents[key]) calEvents[key].forEach(ev => upcoming.length < 3 && upcoming.push({ day: d, ...ev }));
        }

        const prevM = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); };
        const nextM = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); };

        return (
            <div className="mini-cal-widget">
                <div className="mini-cal-widget-header">
                    <div>
                        <div className="mini-cal-widget-title">
                            <CalendarDays size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: '#2563eb' }} />
                            My Calendar
                        </div>
                        <div className="mini-cal-widget-sub">Hearings & events</div>
                    </div>
                    <div className="mini-cal-nav">
                        <button onClick={prevM}><ChevronLeft size={14} /></button>
                        <span className="mini-cal-month-name">{MINI_MONTHS[calMonth].slice(0,3)} {calYear}</span>
                        <button onClick={nextM}><ChevronRight size={14} /></button>
                    </div>
                </div>
                <div className="mini-cal-days-row">
                    {MINI_DAYS.map((d,i) => <div key={i} className="mini-cal-day-name">{d}</div>)}
                </div>
                <div className="mini-cal-grid">
                    {cells.map((cell, idx) => (
                        <div key={idx} className={`mini-cal-cell ${!cell.cur ? 'dim' : ''} ${cell.cur && isToday(cell.day) ? 'today' : ''} ${cell.cur && hasEvent(cell.day) ? 'has-event' : ''}`}>
                            {cell.day}
                        </div>
                    ))}
                </div>
                <div className="mini-cal-upcoming">
                    <div className="mini-cal-upcoming-title">UPCOMING</div>
                    {upcoming.length === 0 ? (
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>No events — check full calendar</p>
                    ) : upcoming.map((ev, i) => (
                        <div key={i} className="mini-cal-event-row">
                            <div className="mini-cal-event-dot" style={{ background: EVENT_COLORS[ev.type] || '#2563eb' }}></div>
                            <div className="mini-cal-event-info">
                                <div className="mini-cal-event-name">{ev.title}</div>
                                <div className="mini-cal-event-date">{MINI_MONTHS[calMonth].slice(0,3)} {ev.day}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <Link href="/my-calendar" className="mini-cal-view-all">View Full Calendar →</Link>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Full-length Scrollable Greeting Header */}
            <header style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: 'white',
                padding: '24px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div>
                    <h2 style={{ 
                        margin: 0, 
                        fontSize: '1.7rem', 
                        fontWeight: 700, 
                        fontFamily: "'Inter', sans-serif", 
                        letterSpacing: '0.5px' 
                    }}>
                        {(() => {
                            const hour = new Date().getHours();
                            if (hour < 12) return 'Good Morning,';
                            if (hour < 17) return 'Good Afternoon,';
                            return 'Good Evening,';
                        })()} <span style={{ color: '#3b82f6' }}>{lawyer?.fullName ? lawyer.fullName.split(' ')[0] : 'Lawyer'}</span>!
                    </h2>
                    <p style={{ 
                        margin: '4px 0 0', 
                        fontSize: '0.85rem', 
                        color: 'rgba(255,255,255,0.5)', 
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400
                    }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => router.push('/lawyer-profile')}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            transition: 'all 0.2s'
                        }}
                    >
                        Edit Profile
                    </button>
                    <button
                        onClick={logout}
                        style={{
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-body" style={{ minHeight: '100vh' }}>
                <LawyerSidebar />

                {/* ── Main Content ── */}
                <div className="dashboard-main">
                    {/* Content Container */}
                    <div className="dashboard-container" style={{ padding: '32px' }}>

                        {/* Profile Banner */}
                        <div className="profile-card">
                            <div className="profile-header">
                                <div className="profile-header-content">
                                    <div 
                                        className="profile-avatar" 
                                        style={{ cursor: avatarUrl ? 'pointer' : 'default' }}
                                        onClick={() => avatarUrl && setFullscreenImage({ url: avatarUrl, name: lawyer.fullName })}
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="DP" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : initials}
                                    </div>
                                    <div className="profile-main-info">
                                        <h2 className="profile-name">{lawyer.fullName}</h2>
                                        <div className="profile-title">{lawyer.specialization} Advocate</div>
                                        <div className="profile-stats">
                                            <div className="stat-item">
                                                <span className="stat-value">{dashboardData?.overview?.totalCases || 0}</span>
                                                <span className="stat-label">Active Cases</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-value">{dashboardData?.overview?.totalClients || 0}</span>
                                                <span className="stat-label">Clients</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-value">{dashboardData?.aiUsage?.videosWatched || 0}</span>
                                                <span className="stat-label">Videos Watched</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Row — Calendar Widget */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '32px' }}>
                            {/* Quick Summary */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                                    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>Quick Overview</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                        {[
                                            { label: 'Active Cases', value: dashboardData?.overview?.totalCases || 0, color: '#1d4ed8', bg: '#eff6ff' },
                                            { label: 'Total Clients', value: dashboardData?.overview?.totalClients || 0, color: '#1d4ed8', bg: '#eff6ff' },
                                            { label: 'AI Drafts', value: dashboardData?.aiUsage?.totalDrafts || 0, color: '#1d4ed8', bg: '#eff6ff' },
                                            { label: 'Videos', value: dashboardData?.aiUsage?.videosWatched || 0, color: '#1d4ed8', bg: '#eff6ff' },
                                        ].map((stat, i) => (
                                            <div key={i} style={{ background: stat.bg, borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #dbeafe' }}>
                                                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: stat.color }}>{stat.value}</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1e40af', marginTop: '4px', textTransform: 'uppercase' }}>{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* NEW: Recent Case Activity */}
                                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                        <Activity size={18} color="#2563eb" /> Recent Case Activity
                                    </h3>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dashboardData?.recentActivity?.cases?.length > 0 ? (
                                            dashboardData.recentActivity.cases.map((c, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>{c.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Client: {c.client}</div>
                                                    </div>
                                                    <span style={{ 
                                                        padding: '4px 10px', 
                                                        borderRadius: '99px', 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: '700', 
                                                        background: '#eff6ff', 
                                                        color: '#1d4ed8',
                                                        textTransform: 'uppercase',
                                                        border: '1px solid #dbeafe'
                                                    }}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '20px' }}>
                                                <ClipboardList size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                                <p style={{ fontSize: '0.85rem', margin: 0 }}>No recent case activity found</p>
                                                <Link href="/case-history" style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '8px', textDecoration: 'none', fontWeight: 600 }}>Create Your First Case →</Link>
                                            </div>
                                        )}
                                    </div>
                                    {dashboardData?.recentActivity?.cases?.length > 0 && (
                                        <Link href="/case-history" style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: '600', textDecoration: 'none', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>View All Cases →</Link>
                                    )}
                                </div>

                                {/* NEW: Upcoming Deadlines */}
                                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', minHeight: '180px' }}>
                                    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={18} color="#ef4444" /> Upcoming Deadlines
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dashboardData?.upcomingDeadlines?.length > 0 ? (
                                            dashboardData.upcomingDeadlines.map((d, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#991b1b' }}>{d.deadlineTitle}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#b91c1c', opacity: 0.8 }}>Case: {d.caseTitle}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: '700', color: '#991b1b' }}>
                                                        {new Date(d.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.8rem' }}>No upcoming deadlines found</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Mini Calendar + Recent Learning */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <MiniCalendar />
                                
                                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', minHeight: '180px' }}>
                                    <h3 style={{ margin: '0 0 16px', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Recent Learning</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {dashboardData?.recentActivity?.learning?.length > 0 ? (
                                            dashboardData.recentActivity.learning.map((h, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                                                        <Video size={16} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(h.watchedAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                <HelpCircle size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                                <p style={{ fontSize: '0.75rem', margin: 0 }}>No history yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modules Grid */}
                        <div className="dashboard-section-title">All Modules</div>
                        <div className="dashboard-features">
                            {features.map((f, i) => {
                                const Icon = f.icon;
                                return (
                                    <Link key={i} href={f.path} className="feature-card" style={{ '--card-color-1': f.color1, '--card-color-2': f.color2, textDecoration: 'none' }}>
                                        <div className="feature-header">
                                            <div className="feature-icon" style={{ background: f.bg, color: f.color1 }}>
                                                <Icon size={22} />
                                            </div>
                                            <h3 className="feature-title">{f.title}</h3>
                                        </div>
                                        <p className="feature-desc">{f.desc}</p>
                                    </Link>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>

            {/* Fullscreen Image Lightbox */}
            {fullscreenImage && (
                <div className="image-lightbox-overlay" onClick={() => setFullscreenImage(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="close-lightbox" onClick={() => setFullscreenImage(null)}>
                            <X size={24} />
                        </button>
                        <img src={fullscreenImage.url} alt="Fullscreen DP" />
                        <div className="lightbox-caption">
                            <h3>{fullscreenImage.name}</h3>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerDashboard;

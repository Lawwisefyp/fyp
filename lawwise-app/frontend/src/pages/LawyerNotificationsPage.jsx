import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/LawyerNotifications.css';

const LawyerNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const lawyerInfo = JSON.parse(localStorage.getItem('lawyerInfo') || '{}');
    const lawyerId = lawyerInfo._id || lawyerInfo.id;

    useEffect(() => {
        const fetchNotifs = async () => {
            if (!lawyerId) return;
            try {
                // Sync first
                await authService.syncNotifications();
                const data = await authService.getNotifications(lawyerId);
                if (data.success) {
                    setNotifications(data.notifications);
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
                // Fallback demo data if needed
            } finally {
                setLoading(false);
            }
        };
        fetchNotifs();
    }, [lawyerId]);

    const filteredNotifs = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'connection') return n.type === 'connection' || n.type === 'connection_request' || n.type === 'accepted';
        return n.type === filter;
    });

    const handleRespond = async (id, response) => {
        try {
            const data = await authService.respondToConnection(id, response);
            if (data.success) {
                // Refresh
                const refreshed = await authService.getNotifications(lawyerId);
                setNotifications(refreshed.notifications);
            }
        } catch (error) {
            console.error('Failed to respond', error);
        }
    };

    const countAll = notifications.length;
    const countConnection = notifications.filter(n => ['connection', 'connection_request', 'accepted'].includes(n.type)).length;
    const countDeadline = notifications.filter(n => n.type === 'deadline').length;
    const countHearing = notifications.filter(n => n.type === 'hearing').length;

    return (
        <div className="notifications-page-body">
            <div className="notifications-main-container">
                <header className="notifications-top-header">
                    <div className="header-text-group">
                        <h1 className="notifications-hero-title">Notifications</h1>
                        <p className="notifications-subtitle">Stay updated with your latest connection requests, deadlines, and hearing reminders.</p>
                    </div>
                    <Link to="/lawyer-dashboard" className="btn-back-dashboard">← Back to Dashboard</Link>
                </header>

                <div className="notifications-layout">
                    <aside className="notifications-sidebar">
                        <div className="sidebar-section">
                            <h3>Navigation</h3>
                            <ul className="sidebar-nav-list">
                                <li className="sidebar-nav-item active">
                                    <span className="nav-icon">🏠</span> Home
                                </li>
                                <li className="sidebar-nav-item">
                                    <Link to="/lawyer-dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
                                        <span className="nav-icon">📊</span> Dashboard
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="sidebar-section">
                            <h3>Categories</h3>
                            <div className="sidebar-filter-list">
                                <button className={`sidebar-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                                    <span className="filter-icon">📋</span> All <span className="filter-count">{countAll}</span>
                                </button>
                                <button className={`sidebar-filter-btn ${filter === 'connection' ? 'active' : ''}`} onClick={() => setFilter('connection')}>
                                    <span className="filter-icon">🤝</span> Connections <span className="filter-count">{countConnection}</span>
                                </button>
                                <button className={`sidebar-filter-btn ${filter === 'deadline' ? 'active' : ''}`} onClick={() => setFilter('deadline')}>
                                    <span className="filter-icon">⏰</span> Deadlines <span className="filter-count">{countDeadline}</span>
                                </button>
                                <button className={`sidebar-filter-btn ${filter === 'hearing' ? 'active' : ''}`} onClick={() => setFilter('hearing')}>
                                    <span className="filter-icon">⚖️</span> Hearings <span className="filter-count">{countHearing}</span>
                                </button>
                            </div>
                        </div>
                    </aside>

                    <main className="notifications-feed-container">
                        <div className="notifications-feed">
                            {loading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading your notifications...</p>
                                </div>
                            ) : filteredNotifs.length > 0 ? (
                                filteredNotifs.map(n => (
                                    <div key={n._id} className={`notification-item-card ${n.type}`}>
                                        <div className="notification-item-time">{n.time || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '')}</div>
                                        <div className="notification-card-header">
                                            <div className={`notification-card-icon ${n.type}`}>
                                                {n.type === 'connection' || n.type === 'connection_request' ? '🤝' : n.type === 'accepted' ? '✓' : n.type === 'deadline' ? '⏰' : '⚖️'}
                                            </div>
                                            <div className="notification-card-meta">
                                                <div className={`notification-card-type ${n.type}`}>{n.type.replace('_', ' ')}</div>
                                                <h3 className="notification-card-title">{n.title || n.fromLawyerName || 'System Alert'}</h3>
                                                <p className="notification-card-msg">{n.message}</p>

                                                {n.type === 'connection_request' && n.status === 'pending' && (
                                                    <div className="notification-card-footer">
                                                        <button className="btn-notif-action btn-notif-success" onClick={() => handleRespond(n._id, 'accepted')}>✓ Accept</button>
                                                        <button className="btn-notif-action btn-notif-danger" onClick={() => handleRespond(n._id, 'rejected')}>✕ Decline</button>
                                                    </div>
                                                )}

                                                {n.status === 'accepted' && (
                                                    <div className="notif-status-pill accepted">✓ Connected</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">🔔</div>
                                    <h3>All caught up!</h3>
                                    <p>You don't have any notifications in this category.</p>
                                    <button className="btn-reset-filter" onClick={() => setFilter('all')}>View All Notifications</button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default LawyerNotificationsPage;

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
                <div className="notifications-top-header">
                    <h1 className="notifications-hero-title">Notifications</h1>
                    <Link to="/lawyer-dashboard" className="btn-back-dashboard">Back to Dashboard</Link>
                </div>

                <div className="notification-filter-tabs">
                    <button className={`notification-tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        All <span className="notification-badge-count">{countAll}</span>
                    </button>
                    <button className={`notification-tab-btn ${filter === 'connection' ? 'active' : ''}`} onClick={() => setFilter('connection')}>
                        Connections <span className="notification-badge-count">{countConnection}</span>
                    </button>
                    <button className={`notification-tab-btn ${filter === 'deadline' ? 'active' : ''}`} onClick={() => setFilter('deadline')}>
                        Deadlines <span className="notification-badge-count">{countDeadline}</span>
                    </button>
                    <button className={`notification-tab-btn ${filter === 'hearing' ? 'active' : ''}`} onClick={() => setFilter('hearing')}>
                        Hearings <span className="notification-badge-count">{countHearing}</span>
                    </button>
                </div>

                <div className="notifications-feed">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading notifications...</div>
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
                        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔔</div>
                            <h3>No notifications yet</h3>
                            <p>We'll notify you when something important happens.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LawyerNotificationsPage;

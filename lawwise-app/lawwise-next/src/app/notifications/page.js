'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import { CheckCircle2, Clock, Users, Bell, AlertTriangle } from 'lucide-react';
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

            <div className="notifications-main-content">
                <div className="notifications-container-wrapper" style={{ padding: '30px' }}>

                    <div className="notifications-top-header">
                        <div className="header-text">
                            <h1 className="notifications-hero-title">Notifications</h1>
                            <p>Stay updated with your case deadlines and connection requests.</p>
                        </div>
                    </div>

                    <div className="notification-filter-tabs">
                        <button className={`notification-tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                            All
                        </button>
                        <button className={`notification-tab-btn ${filter === 'connection' ? 'active' : ''}`} onClick={() => setFilter('connection')}>
                            Connections
                        </button>
                        <button className={`notification-tab-btn ${filter === 'deadline' ? 'active' : ''}`} onClick={() => setFilter('deadline')}>
                            Deadlines
                        </button>
                        <button className={`notification-tab-btn ${filter === 'hearing' ? 'active' : ''}`} onClick={() => setFilter('hearing')}>
                            Hearings
                        </button>
                    </div>

                    <div className="notifications-feed">
                        {loading ? (
                            <div className="loader-block">Loading your notifications...</div>
                        ) : filteredNotifs.length > 0 ? (
                            filteredNotifs.map(n => (
                                <div key={n._id} className={`notification-item-card ${n.type}`}>
                                    <div className="notification-item-time">
                                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                                    </div>
                                    <div className="notification-card-header">
                                        <div className={`notification-card-icon ${n.type}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="notification-card-meta">
                                            <div className={`notification-card-type ${n.type}`}>{n.type?.replace('_', ' ')}</div>
                                            <h3 className="notification-card-title">{n.title || 'System Alert'}</h3>
                                            <p className="notification-card-msg">{n.message}</p>

                                            {/* Actions for Connection Requests */}
                                            {n.type === 'connection_request' && n.status === 'pending' && (
                                                <div className="notification-card-footer">
                                                    <button className="btn-notif-action btn-notif-success" onClick={() => handleRespond(n.relatedId, 'accepted')}>✓ Accept</button>
                                                    <button className="btn-notif-action btn-notif-danger" onClick={() => handleRespond(n.relatedId, 'rejected')}>✕ Decline</button>
                                                </div>
                                            )}

                                            {/* Action for Deadlines/Reminders/Hearings */}
                                            {(n.type === 'deadline' || n.type === 'hearing_reminder') && n.caseId && (
                                                <div className="notification-card-footer">
                                                    <button className="btn-mark-done-inline" onClick={() => handleMarkDone(n)}>
                                                        <CheckCircle2 size={16} /> Mark as Done
                                                    </button>
                                                </div>
                                            )}

                                            {n.status === 'accepted' && n.type === 'connection_request' && (
                                                <div className="notif-status-pill accepted">✓ Connected</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-notifs">
                                <Bell size={48} />
                                <h3>No notifications yet</h3>
                                <p>We'll notify you when something important happens.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LawyerNotificationsPage;

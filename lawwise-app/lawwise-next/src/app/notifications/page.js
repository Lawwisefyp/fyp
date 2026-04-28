'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services/api';
import '@/styles/LawyerNotifications.css';

const LawyerNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState('lawyer');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const lawyerInfo = JSON.parse(localStorage.getItem('lawyerInfo') || '{}');
            const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || '{}');
            
            if (clientInfo._id || clientInfo.id) {
                setUserId(clientInfo._id || clientInfo.id);
                setUserRole('client');
            } else {
                setUserId(lawyerInfo._id || lawyerInfo.id || lawyerInfo.lawyerId);
                setUserRole('lawyer');
            }
        }
    }, []);

    useEffect(() => {
        const fetchNotifs = async () => {
            if (!userId) return;
            try {
                // Sync first
                if (userRole === 'lawyer') {
                    await authService.syncNotifications();
                }
                const data = await authService.getNotifications();
                if (data.success) {
                    setNotifications(data.notifications);
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifs();
    }, [userId, userRole]);

    const filteredNotifs = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'connection') return n.type === 'connection' || n.type === 'connection_request' || n.type === 'accepted';
        if (filter === 'hearing') return n.type === 'hearing' || n.type === 'hearing_reminder';
        return n.type === filter;
    });

    const handleRespond = async (id, response) => {
        try {
            const data = await authService.respondToConnection(id, response);
            if (data.success) {
                alert(`Request ${response === 'accepted' ? 'accepted' : 'declined'} successfully!`);
                // Refresh
                const refreshed = await authService.getNotifications();
                setNotifications(refreshed.notifications);
            } else {
                alert(`Failed to respond: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to respond', error);
            alert('An error occurred while processing your response.');
        }
    };

    const countAll = notifications.length;
    const countConnection = notifications.filter(n => ['connection', 'connection_request', 'accepted'].includes(n.type)).length;
    const countDeadline = notifications.filter(n => n.type === 'deadline').length;
    const countHearing = notifications.filter(n => n.type === 'hearing' || n.type === 'hearing_reminder').length;

    return (
        <div className="notifications-page-body">
            <div className="notifications-main-container">
                <div className="notifications-top-header">
                    <h1 className="notifications-hero-title">Notifications</h1>
                    <Link href={userRole === 'client' ? "/client-dashboard" : "/lawyer-dashboard"} className="btn-back-dashboard">Back to Dashboard</Link>
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
                                        {n.type === 'connection' || n.type === 'connection_request' ? '🤝' : 
                                         n.type === 'accepted' ? '✓' : 
                                         n.type === 'deadline' ? '⏰' : 
                                         (n.type === 'hearing' || n.type === 'hearing_reminder') ? '⚖️' : '🔔'}
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

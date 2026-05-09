'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '@/lib/services/api';
import ClientSidebar from '@/components/ClientSidebar';
import { CheckCircle2, Clock, Bell, Info, XCircle, Search, Users, MessageCircle } from 'lucide-react';
import '@/styles/LawyerNotifications.css';
import '@/styles/Dashboard.css';

const ClientNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const info = JSON.parse(localStorage.getItem('clientInfo') || '{}');
            setClient(info);
        }
    }, []);

    useEffect(() => {
        const fetchNotifs = async () => {
            if (!client) return;
            try {
                setLoading(true);
                const data = await authService.getNotifications();
                if (data.success) {
                    setNotifications(data.notifications);
                    await authService.markNotificationsAsRead();
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifs();
    }, [client]);

    const filteredNotifs = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'connection') return ['connection', 'connection_request', 'accepted', 'rejected'].includes(n.type);
        return true;
    });

    const getIconClass = (type) => {
        if (type === 'accepted') return 'accepted';
        if (type === 'rejected') return 'deadline'; // use red for rejection
        if (type === 'connection_request' || type === 'connection') return 'connection';
        return '';
    };

    const getIconEmoji = (type) => {
        if (type === 'accepted') return '✅';
        if (type === 'rejected') return '❌';
        if (type === 'connection_request' || type === 'connection') return '🤝';
        return '🔔';
    };

    return (
        <div className="dashboard-body">
            <ClientSidebar />
            
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
                    </div>

                    <div className="notifications-feed">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                <p>Loading your secure updates...</p>
                            </div>
                        ) : filteredNotifs.length > 0 ? (
                            filteredNotifs.map((n) => (
                                <div key={n._id} className="notification-item-card" style={{ opacity: n.isRead ? 0.8 : 1 }}>
                                    <div className="notification-card-header">
                                        <div className={`notification-card-icon ${getIconClass(n.type)}`}>
                                            {getIconEmoji(n.type)}
                                        </div>
                                        <div className="notification-card-meta">
                                            <div className={`notification-card-type ${getIconClass(n.type)}`}>
                                                {n.type?.replace('_', ' ')}
                                            </div>
                                            <h3 className="notification-card-title">{n.title}</h3>
                                            <p className="notification-card-msg">{n.message}</p>
                                            <span className="notification-item-time">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {n.type === 'accepted' && (
                                        <div className="notification-card-footer" style={{ marginTop: '16px' }}>
                                            <button 
                                                onClick={() => window.location.href = '/client-communication'}
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
                                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                <MessageCircle size={16} />
                                                Start Messaging
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-clean" style={{ textAlign: 'center', padding: '100px 0' }}>
                                <Bell size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                <h3>No Notifications</h3>
                                <p>You're all caught up! New updates will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientNotificationsPage;

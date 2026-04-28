'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/Dashboard.css';

const ClientDashboard = () => {
    const [client, setClient] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('clientInfo');
        const token = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');

        if (!token || !info) {
            router.push('/client-portal');
            return;
        }

        setClient(JSON.parse(info));
    }, [router]);

    const logout = () => {
        localStorage.removeItem('clientToken');
        sessionStorage.removeItem('clientToken');
        localStorage.removeItem('clientInfo');
        router.push('/client-portal');
    };

    if (!client) return <div className="dashboard-body"><div className="dashboard-container">Loading...</div></div>;

    const modules = [
        { title: 'Notifications', icon: '🔔', desc: "View important messages", path: '/notifications', bg: '#e3f2fd', color: '#1976d2' },
        { title: 'Communication', icon: '💬', desc: "Secure messaging with your lawyer", path: '/communication', bg: '#e0f2f1', color: '#00796b' },
        { title: 'E-Filing Case', icon: '📤', desc: "Upload your case files", path: '/client-efiling', bg: '#fff3e0', color: '#f57c00' },
        { title: 'Lawyer Filtering', icon: '🧑‍⚖️', desc: "Search and filter lawyers", path: '/search-lawyers', bg: '#e8f5e9', color: '#388e3c' },
        { title: 'Lawyer Reviews', icon: '⭐', desc: "Read and write reviews", path: '/lawyer-reviews', bg: '#fce4ec', color: '#c2185b' }
    ];

    const initials = client.fullName ? client.fullName.split(' ').map(n => n[0]).join('') : 'C';

    return (
        <div className="dashboard-body">

            {/* ── Left Sidebar ── */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <h1>LAW<span>WISE</span></h1>
                    <p>Client Portal</p>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main</div>
                    <div className="sidebar-nav-item active">
                        <span className="sidebar-nav-icon">🏠</span> Dashboard
                    </div>

                    <div className="sidebar-section-label">Modules</div>
                    {modules.map((m, i) => (
                        <div key={i} className="sidebar-nav-item" onClick={() => router.push(m.path)}>
                            <span className="sidebar-nav-icon">{m.icon}</span> {m.title}
                        </div>
                    ))}

                    <div className="sidebar-section-label">Account</div>
                    <div className="sidebar-nav-item" onClick={logout}>
                        <span className="sidebar-nav-icon">🚪</span> Logout
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <h4>{client.fullName}</h4>
                            <p>Client</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="dashboard-main">

                {/* Top Header */}
                <header className="top-header">
                    <div className="top-header-left">
                        <h2>Client Dashboard</h2>
                        <p>Welcome back, {client.fullName}. Access your case details and legal tools.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-logout" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="dashboard-container">

                    {/* Profile Banner */}
                    <div className="profile-card">
                        <div className="profile-header">
                            <div className="profile-header-content">
                                <div className="profile-avatar">{initials}</div>
                                <div className="profile-main-info">
                                    <h2 className="profile-name">{client.fullName}</h2>
                                    <div className="profile-title">Client Account</div>
                                    <div className="profile-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">5</span>
                                            <span className="stat-label">Modules</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modules Grid */}
                    <div className="dashboard-section-title">All Modules</div>
                    <div className="dashboard-features">
                        {modules.map((m, i) => (
                            <div key={i} className="feature-card" onClick={() => router.push(m.path)}>
                                <div className="feature-header">
                                    <div className="feature-icon" style={{ background: m.bg, color: m.color }}>{m.icon}</div>
                                    <h3 className="feature-title">{m.title}</h3>
                                </div>
                                <p className="feature-desc">{m.desc}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;


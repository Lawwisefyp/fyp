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

    return (
        <div className="dashboard-body">
            <div className="top-header" style={{ background: 'linear-gradient(135deg, #d4a574, #b5894b)' }}>
                <div className="top-header-content">
                    <div className="logo-section">
                        <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #c19651, #d4a574)' }}>⚖️</div>
                        <div className="logo-text">
                            <h1>Lawwise</h1>
                            <p>Client Portal Dashboard</p>
                        </div>
                    </div>
                    <div className="header-user-info">
                        <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #d4a574, #c19651)' }}>👤</div>
                        <div className="user-details">
                            <h3>{client.fullName}</h3>
                            <p>Client</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-left">
                        <div className="dashboard-title" style={{ color: '#c19651' }}>Client Dashboard</div>
                        <div className="dashboard-welcome">Welcome back! Access your case details and legal tools.</div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-logout" style={{ background: 'linear-gradient(135deg, #d4a574, #c19651)' }} onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="dashboard-features" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {modules.map((m, i) => (
                        <div key={i} className="feature-card" onClick={() => router.push(m.path)} style={{ borderTop: `4px solid ${m.color}` }}>
                            <div className="feature-header">
                                <div className="feature-icon" style={{ background: m.bg, color: m.color }}>{m.icon}</div>
                                <h3 className="feature-title" style={{ color: m.color }}>{m.title}</h3>
                            </div>
                            <p className="feature-desc">{m.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;

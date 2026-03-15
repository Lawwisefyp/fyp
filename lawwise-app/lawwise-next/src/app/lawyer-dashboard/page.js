'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/Dashboard.css';

const LawyerDashboard = () => {
    const [lawyer, setLawyer] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('lawyerInfo');
        const token = localStorage.getItem('lawyerToken') || sessionStorage.getItem('lawyerToken');

        if (!token || !info) {
            router.push('/lawyer-portal');
            return;
        }

        setLawyer(JSON.parse(info));
    }, [router]);

    const logout = () => {
        localStorage.removeItem('lawyerToken');
        sessionStorage.removeItem('lawyerToken');
        localStorage.removeItem('lawyerInfo');
        router.push('/lawyer-portal');
    };

    if (!lawyer) return <div className="dashboard-body"><div className="dashboard-container">Loading...</div></div>;

    const features = [
        { title: 'Digital Guidance', icon: '🎥', desc: "Tutorial videos to guide lawyers on using the app's features.", path: '/digital-guidance', color1: '#0288d1', color2: '#039be5', bg: '#e1f5fe' },
        { title: 'Mini-Law Library', icon: '📚', desc: "A library with statutes, rules, and cases, and an AI-powered chatbot.", path: '/law-library', color1: '#7b1fa2', color2: '#9c27b0', bg: '#f3e5f5' },
        { title: 'AI Chatbot', icon: '🤖', desc: "A chatbot to provide instant assistance and offer legal advice.", path: '/chatbot', color1: '#388e3c', color2: '#43a047', bg: '#e8f5e9' },
        { title: 'Case History', icon: '📋', desc: "Track the history and progress of legal cases from start to finish.", path: '/case-history', color1: '#f57c00', color2: '#fb8c00', bg: '#fff3e0' },
        { title: 'Analytics', icon: '📊', desc: "Personalized dashboard for to view their case details and appointments.", path: '/analytics', color1: '#c2185b', color2: '#d81b60', bg: '#fce4ec' },
        { title: 'Notifications', icon: '🔔', desc: "Push notifications to keep users informed of important updates.", path: '/notifications', color1: '#ffa000', color2: '#ffb300', bg: '#fff8e1' },
        { title: 'Communication', icon: '💬', desc: "Secure messaging and appointment scheduling between lawyers and clients.", path: '/communication', color1: '#00796b', color2: '#00897b', bg: '#e0f2f1' },
        { title: 'AI Drafting', icon: '📝', desc: 'Generate legal documents based on user input, saving time.', path: '/ai-drafting', color1: '#f57c00', color2: '#ff9800', bg: '#fff3e0' },
        { title: 'Case Marketplace', icon: '🌐', desc: 'Browse and claim new cases filed by clients.', path: '/lawyer-marketplace', color1: '#3949ab', color2: '#5c6bc0', bg: '#e8eaf6' },
        { title: 'Networking', icon: '🤝', desc: 'A platform for lawyers to connect and collaborate with others.', path: '/networking', color1: '#689f38', color2: '#7cb342', bg: '#f1f8e9' }
    ];

    return (
        <div className="dashboard-body">
            <div className="top-header">
                <div className="top-header-content">
                    <div className="logo-section">
                        <div className="logo-icon">⚖️</div>
                        <div className="logo-text">
                            <h1>Lawwise</h1>
                            <p>Your Legal Practice Management System</p>
                        </div>
                    </div>
                    <div className="header-user-info">
                        <div className="user-avatar">👨‍⚖️</div>
                        <div className="user-details">
                            <h3>{lawyer.fullName}</h3>
                            <p>{lawyer.specialization || 'Lawyer'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-left">
                        <div className="dashboard-title">Dashboard</div>
                        <div className="dashboard-welcome">Welcome back, counselor! Manage your practice efficiently.</div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-secondary" onClick={() => router.push('/lawyer-profile')}>
                            Edit Profile
                        </button>
                        <button className="btn-logout" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-header-content">
                            <div className="profile-avatar">
                                {lawyer.fullName ? lawyer.fullName.split(' ').map(n => n[0]).join('') : 'L'}
                            </div>
                            <div className="profile-main-info">
                                <h2 className="profile-name">{lawyer.fullName}</h2>
                                <div className="profile-title">{lawyer.specialization} Advocate</div>
                                <div className="profile-stats">
                                    <div className="stat-item">
                                        <span className="stat-value">12</span>
                                        <span className="stat-label">Active Cases</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">48</span>
                                        <span className="stat-label">Clients</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-features">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card" onClick={() => router.push(f.path)} style={{ '--card-color-1': f.color1, '--card-color-2': f.color2 }}>
                            <div className="feature-header">
                                <div className="feature-icon" style={{ background: f.bg, color: f.color1 }}>{f.icon}</div>
                                <h3 className="feature-title" style={{ color: f.color1 }}>{f.title}</h3>
                            </div>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LawyerDashboard;

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/Dashboard.css';

const StudentDashboard = () => {
    const [student, setStudent] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('studentInfo');
        const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');

        if (!token || !info) {
            router.push('/student-portal');
            return;
        }

        setStudent(JSON.parse(info));
    }, [router]);

    const logout = () => {
        localStorage.removeItem('studentToken');
        sessionStorage.removeItem('studentToken');
        localStorage.removeItem('studentInfo');
        localStorage.removeItem('userType');
        router.push('/student-portal');
    };

    if (!student) return <div className="dashboard-body"><div className="dashboard-container">Loading...</div></div>;

    const features = [
        {
            title: 'Personalized Learning',
            icon: '🎯',
            desc: "Tailored study materials and recommendations based on your law subjects.",
            path: '/student-learning',
            color1: '#0288d1',
            color2: '#039be5',
            bg: '#e1f5fe'
        },
        {
            title: 'Quizzes & Tests',
            icon: '✍️',
            desc: "Practice with automatically generated quizzes to assess your knowledge.",
            path: '/student-quizzes',
            color1: '#388e3c',
            color2: '#43a047',
            bg: '#e8f5e9'
        },
        {
            title: 'Mini-Library',
            icon: '📚',
            desc: "Digital collection of notes, past papers, and case summaries in one place.",
            path: '/student-library',
            color1: '#7b1fa2',
            color2: '#9c27b0',
            bg: '#f3e5f5'
        },
        {
            title: 'Notes Sharing',
            icon: '📝',
            desc: "Upload your notes and access useful study material shared by others.",
            path: '/student-notes',
            color1: '#f57c00',
            color2: '#fb8c00',
            bg: '#fff3e0'
        }
    ];

    const initials = student.fullName ? student.fullName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() : 'S';

    return (
        <div className="dashboard-body">
            {/* ── Left Sidebar ── */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <h1>LAW<span>WISE</span></h1>
                    <p>Student Academy</p>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main</div>
                    <div className="sidebar-nav-item active">
                        <span className="sidebar-nav-icon">🏠</span> Dashboard
                    </div>

                    <div className="sidebar-section-label">Learning Modules</div>
                    {features.map((f, i) => (
                        <div key={i} className="sidebar-nav-item" onClick={() => router.push(f.path)}>
                            <span className="sidebar-nav-icon">{f.icon}</span> {f.title}
                        </div>
                    ))}

                    <div className="sidebar-section-label">Account</div>
                    <div className="sidebar-nav-item" onClick={() => router.push('/student-profile')}>
                        <span className="sidebar-nav-icon">👤</span> My Profile
                    </div>
                    <div className="sidebar-nav-item" onClick={logout}>
                        <span className="sidebar-nav-icon">🚪</span> Logout
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <h4>{student.fullName}</h4>
                            <p>{student.university || 'Law Student'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="dashboard-main">
                {/* Top Header */}
                <header className="top-header">
                    <div className="top-header-left">
                        <h2>Student Dashboard</h2>
                        <p>Welcome back, {student.fullName}. Continue your legal education.</p>
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
                                    <h2 className="profile-name">{student.fullName}</h2>
                                    <div className="profile-title">{student.yearOfStudy} Law Student | {student.university}</div>
                                    <div className="profile-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">5</span>
                                            <span className="stat-label">Active Courses</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">12</span>
                                            <span className="stat-label">Quizzes Passed</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">8</span>
                                            <span className="stat-label">Shared Notes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modules Grid */}
                    <div className="dashboard-section-title">Academic Modules</div>
                    <div className="dashboard-features">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card" onClick={() => router.push(f.path)} style={{ '--card-color-1': f.color1, '--card-color-2': f.color2 }}>
                                <div className="feature-header">
                                    <div className="feature-icon" style={{ background: f.bg, color: f.color1 }}>{f.icon}</div>
                                    <h3 className="feature-title">{f.title}</h3>
                                </div>
                                <p className="feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;

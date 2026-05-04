'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/Dashboard.css';

const StudentDashboard = () => {
    const [student, setStudent] = useState(null);
    const [plannerStats, setPlannerStats] = useState({ streak: 0, todaysTasks: [] });
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('studentInfo');
        const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');

        if (!token || !info) {
            router.push('/student-portal');
            return;
        }

        setStudent(JSON.parse(info));
        fetchPlannerStats(token);
    }, [router]);

    const fetchPlannerStats = async (token) => {
        try {
            const res = await fetch('http://localhost:5001/api/students/planner/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setPlannerStats(data.stats);
        } catch (error) {
            console.error('Fetch planner stats error:', error);
        }
    };

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
            title: 'Past Papers',
            icon: '📜',
            desc: "Access and upload past examination papers and model answers.",
            path: '/student-past-papers',
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
        },
        {
            title: 'GPA Calculator',
            icon: '📊',
            desc: "Calculate your semester GPA instantly based on marks and credits.",
            path: '/student-gpa',
            color1: '#d32f2f',
            color2: '#f44336',
            bg: '#ffebee'
        },
        {
            title: 'Insights & Guides',
            icon: '💡',
            desc: "Expert-curated articles on LAT prep, university rankings, and research.",
            path: '/student-insights',
            color1: '#f9a825',
            color2: '#fbc02d',
            bg: '#fff9c4'
        },
        {
            title: 'Study Planner',
            icon: '📅',
            desc: "Plan your daily study schedule, track topics, and mark tasks as completed.",
            path: '/student-planner',
            color1: '#00796b',
            color2: '#00897b',
            bg: '#e0f2f1'
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
                    
                    {/* Reminder Notification */}
                    {plannerStats.tomorrowsTasksCount > 0 && (
                        <div style={{ 
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
                            border: '1px solid #fecaca', 
                            padding: '15px 25px', 
                            borderRadius: '16px', 
                            marginBottom: '25px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.08)'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                            <div>
                                <h4 style={{ color: '#991b1b', margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Upcoming Study Goal</h4>
                                <p style={{ color: '#b91c1c', margin: 0, fontSize: '0.85rem' }}>You have {plannerStats.tomorrowsTasksCount} task(s) due tomorrow. Get ready!</p>
                            </div>
                            <button 
                                onClick={() => router.push('/student-planner')}
                                style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
                            >
                                Open Planner
                            </button>
                        </div>
                    )}

                    {/* Profile Banner */}
                    <div className="profile-card">
                        <div className="profile-header">
                            <div className="profile-header-content">
                                <div className="profile-avatar">{initials}</div>
                                <div className="profile-main-info">
                                    <h2 className="profile-name">{student.fullName}</h2>
                                    <div className="profile-title">{student.yearOfStudy} Law Student | {student.university}</div>
                                    <div className="profile-stats">
                                        <div className="stat-item" style={{ background: '#fff7ed', border: '1px solid #ffedd5' }}>
                                            <span className="stat-value" style={{ color: '#ea580c' }}>🔥 {plannerStats.streak}</span>
                                            <span className="stat-label">Study Streak</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">5</span>
                                            <span className="stat-label">Active Courses</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">12</span>
                                            <span className="stat-label">Quizzes Passed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        <div>
                            <div className="dashboard-section-title">Academic Modules</div>
                            <div className="dashboard-features" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                                {features.map((f, i) => (
                                    <div key={i} className="feature-card" onClick={() => router.push(f.path)} style={{ '--card-color-1': f.color1, '--card-color-2': f.color2 }}>
                                        <div className="feature-header">
                                            <div className="feature-icon" style={{ background: f.bg, color: f.color1 }}>{f.icon}</div>
                                            <h3 className="feature-title">{f.title}</h3>
                                        </div>
                                        <p className="feature-desc" style={{ fontSize: '0.8rem' }}>{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="dashboard-section-title">Today's Study Plan</div>
                            <div className="planner-card" style={{ background: 'white', borderRadius: '24px', padding: '25px', border: '1.5px solid #e2e8f0' }}>
                                {plannerStats.todaysTasks.length > 0 ? (
                                    <div style={{ display: 'flex', flex_direction: 'column', gap: '15px' }}>
                                        {plannerStats.todaysTasks.map(task => (
                                            <div key={task._id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #2563eb' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' }}>{task.subject}</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>{task.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>⏱️ {task.duration || 'N/A'}</div>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => router.push('/student-planner')}
                                            style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '10px', color: '#475569', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}
                                        >
                                            View All Plans →
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>☕</div>
                                        <p style={{ fontSize: '0.9rem' }}>No tasks for today.</p>
                                        <button 
                                            onClick={() => router.push('/student-planner')}
                                            style={{ marginTop: '15px', color: '#2563eb', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            + Create a Plan
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;

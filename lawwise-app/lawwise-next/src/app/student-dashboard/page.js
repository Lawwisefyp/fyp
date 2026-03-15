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

    return (
        <div className="dashboard-body">
            <div className="top-header" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                <div className="top-header-content">
                    <div className="logo-section">
                        <div className="logo-icon">🎓</div>
                        <div className="logo-text">
                            <h1>Lawwise Academy</h1>
                            <p>Student Learning & Resource Portal</p>
                        </div>
                    </div>
                    <div className="header-user-info">
                        <div className="user-avatar" style={{ background: '#334155', color: 'white' }}>👨‍🎓</div>
                        <div className="user-details">
                            <h3 style={{ color: 'white' }}>{student.fullName}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{student.university || 'Law Student'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-left">
                        <div className="dashboard-title">Student Dashboard</div>
                        <div className="dashboard-welcome">Welcome back! Ready to advance your legal studies?</div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-logout" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="profile-card" style={{ borderLeft: '5px solid #334155' }}>
                    <div className="profile-header">
                        <div className="profile-header-content">
                            <div className="profile-avatar" style={{ background: '#334155' }}>
                                {student.fullName ? student.fullName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() : 'S'}
                            </div>
                            <div className="profile-main-info">
                                <h2 className="profile-name">{student.fullName}</h2>
                                <div className="profile-title">{student.yearOfStudy} Law Student</div>
                                <div className="profile-stats">
                                    <div className="stat-item">
                                        <span className="stat-value">5</span>
                                        <span className="stat-label">Courses</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">12</span>
                                        <span className="stat-label">Quizzes Taken</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">8</span>
                                        <span className="stat-label">Notes Shared</span>
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

export default StudentDashboard;

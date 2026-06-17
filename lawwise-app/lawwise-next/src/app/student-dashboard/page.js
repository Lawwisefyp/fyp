'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Target, 
    FileText, 
    Library, 
    Share2, 
    Calculator, 
    Lightbulb, 
    Calendar,
    LogOut,
    User,
    Home,
    AlertCircle,
    Flame
} from 'lucide-react';
import StudentSidebar from '@/components/StudentSidebar';
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
            icon: Target,
            desc: "Tailored study materials and recommendations based on your law subjects.",
            path: '/student-learning',
            color1: '#0f172a',
            color2: '#1e293b',
            bg: '#f1f5f9'
        },
        {
            title: 'Past Papers',
            icon: FileText,
            desc: "Access and upload past examination papers and model answers.",
            path: '/student-past-papers',
            color1: '#0f172a',
            color2: '#1e293b',
            bg: '#f1f5f9'
        },
        {
            title: 'Mini-Library',
            icon: Library,
            desc: "Digital collection of notes, past papers, and case summaries in one place.",
            path: '/student-library',
            color1: '#0f172a',
            color2: '#1e293b',
            bg: '#f1f5f9'
        },
        {
            title: 'Notes Sharing',
            icon: Share2,
            desc: "Upload your notes and access useful study material shared by others.",
            path: '/student-notes',
            color1: '#0f172a',
            color2: '#1e293b',
            bg: '#f1f5f9'
        },
        {
            title: 'GPA Calculator',
            icon: Calculator,
            desc: "Calculate your semester GPA instantly based on marks and credits.",
            path: '/student-gpa',
            color1: '#0f172a',
            color2: '#1e293b',
            bg: '#f1f5f9'
        },
        {
            title: 'Insights & Guides',
            icon: Lightbulb,
            desc: "Expert-curated articles on LAT prep, university rankings, and research.",
            path: '/student-insights',
            color1: '#0f172a',
            color2: '#1e293b',
            bg: '#f1f5f9'
        },
        {
            title: 'Study Planner',
            icon: Calendar,
            desc: "Plan your daily study schedule, track topics, and mark tasks as completed.",
            path: '/student-planner',
            color1: '#0f172a',
            color2: '#1e293b',
            bg: '#f1f5f9'
        }
    ];

    const initials = student.fullName ? student.fullName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() : 'S';

    return (
        <div className="dashboard-body">
            <StudentSidebar />

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
                            background: '#f8fafc', 
                            borderLeft: '4px solid #c19651', 
                            padding: '20px 25px', 
                            borderRadius: '12px', 
                            marginBottom: '25px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                        }}>
                            <AlertCircle size={32} color="#c19651" />
                            <div>
                                <h4 style={{ color: '#0f172a', margin: 0, fontSize: '1rem', fontWeight: '800' }}>Upcoming Study Goal</h4>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>You have {plannerStats.tomorrowsTasksCount} task(s) due tomorrow. Get ready!</p>
                            </div>
                            <button 
                                onClick={() => router.push('/student-planner')}
                                style={{ marginLeft: 'auto', background: '#0f172a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
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
                                        <div className="stat-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <span className="stat-value" style={{ color: '#c19651', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}><Flame size={18} fill="#c19651" /> {plannerStats.streak}</span>
                                            <span className="stat-label">Study Streak</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">5</span>
                                            <span className="stat-label">Active Courses</span>
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
                                {features.map((f, i) => {
                                    const Icon = f.icon;
                                    return (
                                        <div key={i} className="feature-card" onClick={() => router.push(f.path)} style={{ '--card-color-1': f.color1, '--card-color-2': f.color2, background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                            <div className="feature-header">
                                                <div className="feature-icon" style={{ background: f.bg, color: f.color1, padding: '10px', borderRadius: '8px' }}>
                                                    <Icon size={24} color="#0f172a" />
                                                </div>
                                                <h3 className="feature-title" style={{ color: '#0f172a' }}>{f.title}</h3>
                                            </div>
                                            <p className="feature-desc" style={{ fontSize: '0.85rem', color: '#64748b' }}>{f.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="dashboard-section-title">Today's Study Plan</div>
                            <div className="planner-card" style={{ background: 'white', borderRadius: '24px', padding: '25px', border: '1.5px solid #e2e8f0' }}>
                                {plannerStats.todaysTasks.length > 0 ? (
                                    <div style={{ display: 'flex', flex_direction: 'column', gap: '15px' }}>
                                        {plannerStats.todaysTasks.map(task => (
                                            <div key={task._id} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #c19651' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#c19651', textTransform: 'uppercase', marginBottom: '4px' }}>{task.subject}</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{task.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={14} /> {task.duration || 'N/A'}
                                                </div>
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
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>
                                        <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
                                        <p style={{ fontSize: '0.95rem', margin: 0 }}>No tasks for today.</p>
                                        <button 
                                            onClick={() => router.push('/student-planner')}
                                            style={{ marginTop: '15px', color: '#c19651', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
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

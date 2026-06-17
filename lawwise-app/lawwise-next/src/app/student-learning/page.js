'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentSidebar from '@/components/StudentSidebar';
import { authService } from '@/lib/services/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import '@/styles/StudentLearning.css';

const StudentLearningPage = () => {
    const [student, setStudent] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('studentInfo');
        const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');

        if (!token || !info) {
            router.push('/student-portal');
            return;
        }

        setStudent(JSON.parse(info));

        const fetchData = async () => {
            try {
                const result = await authService.getStudentAnalytics();
                if (result.success) {
                    setAnalytics(result.analytics);
                    setRecommendations(result.recommendations || []);
                }
            } catch (e) {
                console.error('Failed to fetch analytics:', e);
                // Fallback to demo data if API fails
                setRecommendations([
                    { id: 1, title: 'Constitutional Law Framework', type: 'Guide', subject: 'Constitutional Law', difficulty: 'Beginner', match: '98%', icon: '📜' },
                    { id: 2, title: 'Landmark Property Disputes 2024', type: 'Case Law', subject: 'Property Law', difficulty: 'Intermediate', match: '92%', icon: '⚖️' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (!student && !loading) return null;

    return (
        <div className="learning-body" style={{ display: 'flex' }}>
            <StudentSidebar />
            <div className="learning-container" style={{ flex: 1 }}>
                <div className="learning-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <h1 style={{ fontSize: '2.5rem', color: '#1e293b', fontWeight: '800', margin: '0 0 10px 0' }}>Smart Study Assistant</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>Your personalized hub for tracking progress and improving weak areas.</p>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner">⚙️</div>
                        <p>Analyzing your study patterns...</p>
                    </div>
                ) : (
                    <div className="learning-grid">
                        {/* LEFT COLUMN */}
                        <div className="sidebar-section">
                            {/* Profile Card */}
                            <div className="sidebar-card">
                                <div className="profile-avatar-large">
                                    {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 5px 0' }}>{student.fullName}</h2>
                                <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '0.95rem' }}>
                                    {student.university || 'Law University'} • {student.yearOfStudy || 'Undergrad'}
                                </p>

                                <div className="readiness-bar-container">
                                    <div className="readiness-info">
                                        <span>Overall Readiness</span>
                                        <span style={{ color: '#1e293b' }}>{analytics?.readinessScore || 0}%</span>
                                    </div>
                                    <div className="readiness-bar">
                                        <div className="readiness-progress" style={{ width: `${analytics?.readinessScore || 0}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Trackers */}
                            <div className="sidebar-card">
                                <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 20px 0' }}>Your Activity</h3>
                                <div className="activity-list">
                                    <div className="activity-item">
                                        <div className="activity-icon" style={{ background: '#fff7ed', color: '#f57c00' }}>📁</div>
                                        <div className="activity-detail">
                                            <div>{analytics?.notesCount || 0} Notes</div>
                                            <div>Uploaded & Shared</div>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>📜</div>
                                        <div className="activity-detail">
                                            <div>{analytics?.papersCount || 0} Papers</div>
                                            <div>Uploaded & Shared</div>
                                        </div>
                                    </div>

                                    <div className="activity-item">
                                        <div className="activity-icon" style={{ background: '#f0f9ff', color: '#0288d1' }}>⏱️</div>
                                        <div className="activity-detail">
                                            <div>{Math.floor((analytics?.notesCount || 0) * 15 + (analytics?.papersCount || 0) * 20)} Mins</div>
                                            <div>Est. Study Time</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Graph */}
                            <div className="sidebar-card" style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', margin: '0 0 15px 0' }}>Study Intensity</h3>
                                <div style={{ height: '150px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics?.activityGraph || []}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="count" stroke="#1e3a8a" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginTop: '10px' }}>Last 7 Days Activity</p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="main-section">
                            {/* AI Assistant Banner */}
                            <div className="ai-banner">
                                <div className="ai-icon">🤖</div>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0' }}>Hi, {student.fullName?.split(' ')[0]}! Here's your strategy.</h2>
                                    <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: 0, lineHeight: '1.5' }}>
                                        {analytics?.weaknesses?.length > 0
                                            ? `Based on your recent performance, you're strong in ${analytics.strengths.join(', ') || 'basic concepts'}, but you might need to focus on ${analytics.weaknesses.join(', ')}. I've curated a study path to help you.`
                                            : `Welcome! Start by taking some quizzes or uploading notes. I'll analyze your progress to provide personalized study strategies and recommendations.`}
                                    </p>
                                </div>
                            </div>

                            <div className="strategy-row">
                                {/* Area of Improvement */}
                                <div className="info-box">
                                    <h3><span style={{ color: '#ef4444' }}>📈</span> Areas to Improve</h3>
                                    <ul className="info-list">
                                        {analytics?.weaknesses?.length > 0
                                            ? analytics.weaknesses.map((w, i) => <li key={i}>{w} <span className="badge-low">Needs Focus</span></li>)
                                            : <li>No weak areas identified yet. Keep it up!</li>}
                                    </ul>
                                </div>

                                {/* Strengths */}
                                <div className="info-box">
                                    <h3><span style={{ color: '#22c55e' }}>🌟</span> Your Strengths</h3>
                                    <ul className="info-list">
                                        {analytics?.strengths?.length > 0
                                            ? analytics.strengths.map((s, i) => <li key={i}>{s} <span className="badge-high">Mastered</span></li>)
                                            : <li>Complete more quizzes to identify your strengths.</li>}
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="recommendations-container">
                                <h3 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 20px 0' }}>What to Study Next</h3>
                                <div className="recommendations-grid">
                                    {recommendations?.length > 0 ? recommendations.map(rec => (
                                        <div key={rec.id} className="rec-card" onClick={() => router.push(`/student-library`)}>
                                            <div className="rec-header">
                                                <div className="rec-icon">{rec.icon}</div>
                                                <div className="match-badge">{rec.match} Match</div>
                                            </div>
                                            <h4 className="rec-title">{rec.title}</h4>
                                            <div className="rec-tags">
                                                <span className="tag text-xs">{rec.type}</span>
                                                <span className="tag text-xs">{rec.subject}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p style={{ color: '#64748b' }}>No recommendations available yet. Try searching the library.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentLearningPage;

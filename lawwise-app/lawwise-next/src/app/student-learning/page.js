'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/StudentLearning.css';

const StudentLearningPage = () => {
    const [student, setStudent] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('studentInfo');
        const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');

        if (!token || !info) {
            // Demo mode for easy preview
            setStudent({
                fullName: 'Law Student',
                university: 'National Law School',
                yearOfStudy: '3rd Year'
            });
        } else {
            setStudent(JSON.parse(info));
        }

        // Simulate personalized logic based on interests
        const timer = setTimeout(() => {
            setRecommendations([
                { id: 1, title: 'Constitutional Law Framework', type: 'Guide', difficulty: 'Beginner', match: '98%', icon: '📜' },
                { id: 2, title: 'Landmark Property Disputes 2024', type: 'Case Law', difficulty: 'Intermediate', match: '92%', icon: '⚖️' },
                { id: 3, title: 'Contract Drafting Masterclass', type: 'Course', difficulty: 'Advanced', match: '85%', icon: '✍️' },
                { id: 4, title: 'Evidence Law Simplified', type: 'Notes', difficulty: 'Beginner', match: '88%', icon: '📂' }
            ]);
            setLoading(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, [router]);

    if (!student && !loading) return null;

    return (
        <div className="learning-body">
            <div className="learning-container">
                {/* Header */}
                <div className="learning-header">
                    <Link href="/student-dashboard" className="back-link">← Back to Dashboard</Link>
                    <h1>Smart Study Assistant</h1>
                    <p>Your personalized hub for tracking progress and improving weak areas.</p>
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
                                        <span style={{ color: '#1e293b' }}>78%</span>
                                    </div>
                                    <div className="readiness-bar">
                                        <div className="readiness-progress" style={{ width: '78%' }}></div>
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
                                            <div>12 Notes</div>
                                            <div>Uploaded & Shared</div>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>🧠</div>
                                        <div className="activity-detail">
                                            <div>5 Quizzes</div>
                                            <div>Completed this week</div>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon" style={{ background: '#f0f9ff', color: '#0288d1' }}>⏱️</div>
                                        <div className="activity-detail">
                                            <div>24 Hours</div>
                                            <div>Active study time</div>
                                        </div>
                                    </div>
                                </div>
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
                                        Based on your recent quizzes, you're doing great in Constitutional Law, but you might need to brush up on Contract Drafting. I've curated a personalized study path below to help you improve.
                                    </p>
                                </div>
                            </div>

                            <div className="strategy-row">
                                {/* Area of Improvement */}
                                <div className="info-box">
                                    <h3><span style={{ color: '#ef4444' }}>📈</span> Areas to Improve</h3>
                                    <ul className="info-list">
                                        <li>Contract Boilerplate Clauses <span className="badge-low">Low Score</span></li>
                                        <li>Corporate Tax Regulations</li>
                                        <li>Criminal Procedure Code (CrPC)</li>
                                    </ul>
                                </div>

                                {/* Strengths */}
                                <div className="info-box">
                                    <h3><span style={{ color: '#22c55e' }}>🌟</span> Your Strengths</h3>
                                    <ul className="info-list">
                                        <li>Fundamental Rights <span className="badge-high">Mastered</span></li>
                                        <li>Family Law Frameworks</li>
                                        <li>Basic Torts</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="recommendations-container">
                                <h3 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 20px 0' }}>What to Study Next</h3>
                                <div className="recommendations-grid">
                                    {recommendations.map(rec => (
                                        <div key={rec.id} className="rec-card">
                                            <div className="rec-header">
                                                <div className="rec-icon">{rec.icon}</div>
                                                <div className="match-badge">{rec.match} Match</div>
                                            </div>
                                            <h4 className="rec-title">{rec.title}</h4>
                                            <div className="rec-tags">
                                                <span className="tag text-xs">{rec.type}</span>
                                                <span className="tag text-xs">{rec.difficulty}</span>
                                            </div>
                                        </div>
                                    ))}
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

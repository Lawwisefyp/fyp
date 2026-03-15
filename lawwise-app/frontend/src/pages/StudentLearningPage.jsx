import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentLearningPage = () => {
    const [student, setStudent] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const info = localStorage.getItem('studentInfo');
        const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');

        if (!token || !info) {
            navigate('/student-portal');
            return;
        }

        const parsedStudent = JSON.parse(info);
        setStudent(parsedStudent);

        // Simulate personalized logic based on interests
        setTimeout(() => {
            setRecommendations([
                { id: 1, title: 'Constitutional Law Framework', type: 'Guide', difficulty: 'Beginner', match: '98%', icon: '📜' },
                { id: 2, title: 'Landmark Property Disputes 2024', type: 'Case Law', difficulty: 'Intermediate', match: '92%', icon: '⚖️' },
                { id: 3, title: 'Contract Drafting Masterclass', type: 'Course', difficulty: 'Advanced', match: '85%', icon: '✍️' },
                { id: 4, title: 'Evidence Law Simplified', type: 'Notes', difficulty: 'Beginner', match: '88%', icon: '📂' }
            ]);
            setLoading(false);
        }, 1200);
    }, [navigate]);

    if (!student) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px', fontFamily: '"Inter", sans-serif' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* ── Page Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div>
                        <button onClick={() => navigate('/student-dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '15px', padding: 0 }}>← Back to Dashboard</button>
                        <h1 style={{ color: '#1e293b', fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px 0' }}>Smart Study Assistant</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>Your personalized hub for tracking progress and improving weak areas.</p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px', animation: 'spin 1.5s linear infinite' }}>⚙️</div>
                        <p>Analyzing your study patterns...</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '30px' }}>

                        {/* ── LEFT COLUMN: Profile & Activity Trackers ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                            {/* Student Profile Card */}
                            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #0288d1 0%, #039be5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', marginBottom: '20px' }}>
                                    {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 5px 0' }}>{student.fullName}</h2>
                                <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '0.95rem' }}>
                                    {student.university || 'Law University'} • {student.yearOfStudy || 'Undergrad'}
                                </p>

                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>
                                        <span>Overall Readiness</span>
                                        <span style={{ color: '#0288d1' }}>78%</span>
                                    </div>
                                    <div style={{ height: '6px', background: '#cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: '78%', background: '#0288d1', borderRadius: '3px' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Trackers */}
                            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 20px 0' }}>Your Activity</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', color: '#f57c00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📁</div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>12 Notes</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Uploaded & Shared</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🧠</div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>5 Quizzes</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Completed this week</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0f9ff', color: '#0288d1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⏱️</div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>24 Hours</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Active study time</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN: Assistant, Weak Areas, Recommendations ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                            {/* AI Assistant Banner */}
                            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '24px', padding: '40px', color: 'white', display: 'flex', alignItems: 'center', gap: '30px', boxShadow: '0 10px 25px rgba(30, 41, 59, 0.2)' }}>
                                <div style={{ fontSize: '4rem' }}>🤖</div>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0' }}>Hi, {student.fullName?.split(' ')[0]}! Here's your strategy.</h2>
                                    <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: 0, lineHeight: '1.5' }}>Based on your recent quizzes, you're doing great in Constitutional Law, but you might need to brush up on Contract Drafting. I've curated a personalized study path below to help you improve.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                {/* Area of Improvement (Weak Areas) */}
                                <div style={{ background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: '1.3rem', color: '#1e293b', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#ef4444' }}>📈</span> Areas to Improve
                                    </h3>
                                    <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', lineHeight: '1.8' }}>
                                        <li>Contract Boilerplate Clauses <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold', marginLeft: '5px' }}>Low Score</span></li>
                                        <li>Corporate Tax Regulations</li>
                                        <li>Criminal Procedure Code (CrPC)</li>
                                    </ul>
                                </div>

                                {/* Strengths */}
                                <div style={{ background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: '1.3rem', color: '#1e293b', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#22c55e' }}>🌟</span> Your Strengths
                                    </h3>
                                    <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', lineHeight: '1.8' }}>
                                        <li>Fundamental Rights <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 'bold', marginLeft: '5px' }}>Mastered</span></li>
                                        <li>Family Law Frameworks</li>
                                        <li>Basic Torts</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations / What to study next */}
                            <div>
                                <h3 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 20px 0' }}>What to Study Next</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                    {recommendations.map(rec => (
                                        <div key={rec.id} style={{ background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.borderColor = '#0288d1'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                                <div style={{ fontSize: '2rem' }}>{rec.icon}</div>
                                                <div style={{ background: '#f0f9ff', color: '#0288d1', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>{rec.match} Match</div>
                                            </div>
                                            <h4 style={{ fontSize: '1.15rem', color: '#1e293b', margin: '0 0 10px 0', lineHeight: '1.4' }}>{rec.title}</h4>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{rec.type}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{rec.difficulty}</span>
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

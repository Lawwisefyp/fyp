'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import '@/styles/StudentQuiz.css';

const StudentQuizPage = () => {
    const router = useRouter();
    const [view, setView] = useState('home'); // 'home' | 'pick-note' | 'generating' | 'quiz'
    const [myNotes, setMyNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [mcqScore, setMcqScore] = useState(0);

    const fetchMyNotes = async () => {
        setLoadingNotes(true);
        try {
            const result = await authService.getMyNotes();
            if (result.success) setMyNotes(result.notes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!selectedNote) return;
        setView('generating');
        try {
            const genResult = await authService.generateNoteQuiz(selectedNote._id);
            if (genResult.success) {
                const quizResult = await authService.getQuizById(genResult.quizId);
                if (quizResult.success) {
                    setQuiz(quizResult.quiz);
                    setAnswers({});
                    setSubmitted(false);
                    setView('quiz');
                    return;
                }
            }
            alert(genResult.error || 'Failed to generate quiz. Make sure the Gemini API key is valid.');
            setView('pick-note');
        } catch (e) {
            const errorMsg = e.response?.data?.error || e.response?.data?.details || e.message;
            alert(`Error generating quiz: ${errorMsg}`);
            setView('pick-note');
        }
    };

    const handleSubmit = async () => {
        let correct = 0;
        quiz.questions.forEach((q, i) => {
            if (q.type === 'mcq' && answers[i] === q.correctAnswer) correct++;
        });
        setMcqScore(correct);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Save result to DB
        try {
            await authService.saveQuizResult({
                quizId: quiz._id,
                score: correct,
                totalQuestions: quiz.questions.filter(q => q.type === 'mcq').length,
                subject: quiz.subject
            });
        } catch (e) {
            console.error('Failed to save quiz result:', e);
        }
    };

    const mcqCount = quiz?.questions?.filter(q => q.type === 'mcq').length || 0;

    const initials = 'S'; // Fallback

    // ── SIDEBAR ───────────────────────────────────────────────
    const UnifiedSidebar = () => (
        <aside className="dashboard-sidebar">
            <div className="sidebar-logo">
                <h1>LAW<span>WISE</span></h1>
                <p>Student Academy</p>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Main</div>
                <div className="sidebar-nav-item" onClick={() => router.push('/student-dashboard')}>
                    <span className="sidebar-nav-icon">🏠</span> Dashboard
                </div>

                <div className="sidebar-section-label">Academic Tools</div>
                <div className="sidebar-nav-item" onClick={() => router.push('/student-notes')}>
                    <span className="sidebar-nav-icon">📁</span> My Notes
                </div>
                <div className="sidebar-nav-item" onClick={() => router.push('/student-past-papers')}>
                    <span className="sidebar-nav-icon">📜</span> Past Papers
                </div>
                <div className="sidebar-nav-item" onClick={() => router.push('/student-library')}>
                    <span className="sidebar-nav-icon">📖</span> Resource Hub
                </div>
                <div className="sidebar-nav-item" onClick={() => router.push('/student-learning')}>
                    <span className="sidebar-nav-icon">🎓</span> Personalized Learning
                </div>

                <div className="sidebar-section-label">Quiz Status</div>
                <div className={`sidebar-nav-item ${view === 'home' ? 'active' : ''}`} style={{ opacity: view === 'home' ? 1 : 0.6 }}>
                    <span className="sidebar-nav-icon">1️⃣</span> Get Started
                </div>
                <div className={`sidebar-nav-item ${view === 'pick-note' ? 'active' : ''}`} style={{ opacity: view === 'pick-note' ? 1 : 0.6 }}>
                    <span className="sidebar-nav-icon">2️⃣</span> Select Note
                </div>
                <div className={`sidebar-nav-item ${view === 'quiz' ? 'active' : ''}`} style={{ opacity: view === 'quiz' ? 1 : 0.6 }}>
                    <span className="sidebar-nav-icon">3️⃣</span> Take Quiz
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <h4>Law Student</h4>
                        <p>Academic Portal</p>
                    </div>
                </div>
            </div>
        </aside>
    );

    // ── LAYOUT WRAPPER ─────────────────────────────────────────
    const Layout = ({ children }) => (
        <div className="dashboard-body">
            <UnifiedSidebar />
            <div className="dashboard-main">
                <header className="top-header">
                    <div className="top-header-left">
                        <h2>AI Quiz Generator</h2>
                        <p>Test your knowledge using your own study materials.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-logout" onClick={() => router.push('/student-dashboard')}>
                            Back to Dashboard
                        </button>
                    </div>
                </header>
                <div className="dashboard-container">
                    {children}
                </div>
            </div>
        </div>
    );

    // ── HOME ──────────────────────────────────────────────────
    if (view === 'home') {
        return (
            <Layout>
                <div className="quiz-cta-card" style={{ background: 'linear-gradient(135deg, #111827 0%, #1e3a8a 100%)', borderRadius: '24px', padding: '40px' }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '15px' }}>Ready to test yourself?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6', marginBottom: '30px' }}>
                            Our AI analyzes your uploaded notes and creates personalized MCQs, short answer and long answer questions to ensure you've mastered the content.
                        </p>
                        <button className="quiz-cta-btn" onClick={() => { setView('pick-note'); fetchMyNotes(); }} style={{ background: '#f57c00', padding: '15px 35px', fontSize: '1.1rem' }}>
                            Generate Quiz from My Notes
                        </button>
                    </div>
                    <div className="quiz-cta-icon" style={{ fontSize: '5rem' }}>🧠</div>
                </div>

                <div className="dashboard-section-title" style={{ marginTop: '40px' }}>How it works</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    {[
                        { icon: '📝', title: 'MCQ Questions', desc: '3 multiple choice questions with 4 options each' },
                        { icon: '✍️', title: 'Short Answers', desc: '2 short answer questions for quick recall' },
                        { icon: '📋', title: 'Long Answer', desc: '1 essay-style question for deep understanding' },
                    ].map(f => (
                        <div key={f.title} className="feature-card" style={{ padding: '30px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{f.icon}</div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '1.2rem' }}>{f.title}</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', lineHeight: '1.5' }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </Layout>
        );
    }

    // ── PICK NOTE ─────────────────────────────────────────────
    if (view === 'pick-note') {
        return (
            <Layout>
                <div className="dashboard-section-title">Select a Note to Analyze</div>
                
                {loadingNotes ? (
                    <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
                        <div className="spinner">⚙️</div>
                        <p>Loading your academic library...</p>
                    </div>
                ) : myNotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '1.5rem' }}>No notes uploaded yet</h3>
                        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.1rem' }}>Upload your study notes first so the AI can generate a quiz for you.</p>
                        <button onClick={() => router.push('/student-notes')} className="quiz-cta-btn">Go to My Notes</button>
                    </div>
                ) : (
                    <>
                        <div className="notes-pick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {myNotes.map(note => (
                                <div
                                    key={note._id}
                                    className={`feature-card ${selectedNote?._id === note._id ? 'selected' : ''}`}
                                    onClick={() => setSelectedNote(note)}
                                    style={{ 
                                        cursor: 'pointer', 
                                        position: 'relative',
                                        border: selectedNote?._id === note._id ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
                                        background: selectedNote?._id === note._id ? '#f0f9ff' : 'white'
                                    }}
                                >
                                    {selectedNote?._id === note._id && (
                                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#1e3a8a', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</div>
                                    )}
                                    <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', display: 'inline-block', marginBottom: '15px', fontWeight: '600' }}>#{note.subject}</div>
                                    <h3 style={{ color: '#111827', margin: '0 0 10px 0' }}>{note.title}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>{note.description || 'No description provided'}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '40px', textAlign: 'center' }}>
                            <button
                                className="quiz-cta-btn"
                                onClick={handleGenerateQuiz}
                                disabled={!selectedNote}
                                style={{ 
                                    backgroundColor: selectedNote ? '#1e3a8a' : '#cbd5e1',
                                    minWidth: '300px',
                                    opacity: selectedNote ? 1 : 0.6
                                }}
                            >
                                {selectedNote ? `Start AI Generation for "${selectedNote.title}"` : 'Select a note to continue'}
                            </button>
                        </div>
                    </>
                )}
            </Layout>
        );
    }

    // ── GENERATING ────────────────────────────────────────────
    if (view === 'generating') {
        return (
            <Layout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                    <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🤖</div>
                        <h2 style={{ color: '#111827', fontSize: '1.8rem', marginBottom: '10px' }}>AI is crafting your quiz...</h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '30px' }}>Analyzing <strong>{selectedNote?.title}</strong> and building academic questions.</p>
                        <div className="quiz-progress-bar" style={{ background: '#e2e8f0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                            <div className="quiz-progress-fill" style={{ background: '#1e3a8a', height: '100%', width: '100%', animation: 'progress 20s linear infinite' }}></div>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '15px' }}>This may take 10–20 seconds. Please don't refresh.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // ── QUIZ ──────────────────────────────────────────────────
    if (view === 'quiz' && quiz) {
        return (
            <Layout>
                {submitted && (
                    <div className="quiz-score-banner" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', padding: '30px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '3rem' }}>🎉</div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>Quiz Completed!</h3>
                                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '5px 0 0 0' }}>Your score has been saved to your learning profile.</p>
                            </div>
                        </div>
                        <div style={{ background: 'white', color: '#15803d', padding: '15px 30px', borderRadius: '15px', fontSize: '2rem', fontWeight: '800' }}>
                            {mcqScore}/{mcqCount}
                        </div>
                    </div>
                )}

                <div className="profile-card" style={{ marginBottom: '30px' }}>
                    <div className="profile-header">
                        <div className="profile-main-info">
                            <h1 style={{ margin: 0, color: '#111827' }}>{quiz.title}</h1>
                            <div className="profile-title" style={{ marginTop: '5px' }}>{quiz.questions.length} questions — MCQs, Short & Long Answers</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {quiz.questions.map((q, idx) => {
                        const isSelected = (opt) => answers[idx] === opt;
                        const isCorrect = (opt) => submitted && opt === q.correctAnswer;
                        const isWrong = (opt) => submitted && answers[idx] === opt && opt !== q.correctAnswer;

                        return (
                            <div key={idx} className="feature-card" style={{ padding: '35px' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ background: '#111827', color: 'white', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '700' }}>{idx + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ color: '#1e3a8a', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'short' ? 'Short Answer' : 'Long Answer'}
                                        </span>
                                        <h3 style={{ color: '#111827', margin: '10px 0 25px 0', fontSize: '1.3rem', lineHeight: '1.4' }}>{q.question}</h3>
                                        
                                        {q.type === 'mcq' && (
                                            <div className="mcq-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                                {q.options.map(opt => (
                                                    <button
                                                        key={opt}
                                                        disabled={submitted}
                                                        onClick={() => setAnswers(p => ({ ...p, [idx]: opt }))}
                                                        className={`mcq-option ${isSelected(opt) && !submitted ? 'selected' : ''} ${isCorrect(opt) ? 'correct' : ''} ${isWrong(opt) ? 'wrong' : ''}`}
                                                        style={{ 
                                                            textAlign: 'left',
                                                            padding: '15px 20px',
                                                            borderRadius: '12px',
                                                            border: '1px solid #e2e8f0',
                                                            background: isCorrect(opt) ? '#dcfce7' : isWrong(opt) ? '#fee2e2' : isSelected(opt) ? '#1e3a8a' : 'white',
                                                            color: isSelected(opt) && !submitted ? 'white' : '#111827',
                                                            cursor: submitted ? 'default' : 'pointer',
                                                            fontWeight: '500',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {opt}
                                                        {isCorrect(opt) && <span style={{ float: 'right' }}> ✅</span>}
                                                        {isWrong(opt) && <span style={{ float: 'right' }}> ❌</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {(q.type === 'short' || q.type === 'long') && (
                                            <textarea
                                                className="answer-textarea"
                                                disabled={submitted}
                                                placeholder="Write your answer here..."
                                                value={answers[idx] || ''}
                                                onChange={e => setAnswers(p => ({ ...p, [idx]: e.target.value }))}
                                                style={{ 
                                                    width: '100%',
                                                    padding: '20px',
                                                    borderRadius: '15px',
                                                    border: '1px solid #e2e8f0',
                                                    minHeight: q.type === 'long' ? '200px' : '100px',
                                                    fontSize: '1rem',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        )}

                                        {submitted && q.explanation && (
                                            <div className="professor-insight" style={{ marginTop: '25px', background: '#f8fafc', padding: '20px', borderRadius: '15px', borderLeft: '4px solid #1e3a8a' }}>
                                                <strong style={{ color: '#1e3a8a', display: 'block', marginBottom: '8px' }}>Professor's Insight:</strong>
                                                <p style={{ color: '#475569', margin: 0, lineHeight: '1.6' }}>{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginTop: '40px', paddingBottom: '60px', textAlign: 'center' }}>
                    {!submitted ? (
                        <button className="quiz-cta-btn" onClick={handleSubmit} style={{ minWidth: '300px' }}>
                            Submit Quiz & See Results
                        </button>
                    ) : (
                        <button className="quiz-cta-btn" onClick={() => { setView('home'); setQuiz(null); setSelectedNote(null); }} style={{ background: '#111827', minWidth: '300px' }}>
                            Generate Another Quiz
                        </button>
                    )}
                </div>
            </Layout>
        );
    }

    return null;
};

export default StudentQuizPage;

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
            alert('Error generating quiz. Please try again.');
            setView('pick-note');
        }
    };

    const handleSubmit = () => {
        let correct = 0;
        quiz.questions.forEach((q, i) => {
            if (q.type === 'mcq' && answers[i] === q.correctAnswer) correct++;
        });
        setMcqScore(correct);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const mcqCount = quiz?.questions?.filter(q => q.type === 'mcq').length || 0;

    // ── SIDEBAR ───────────────────────────────────────────────
    const Sidebar = () => (
        <div className="quiz-sidebar">
            <div className="quiz-sidebar-logo">Lex<span>Academy</span></div>
            <div className="quiz-sidebar-section">
                <h4>Navigation</h4>
                <div className="quiz-nav-item" onClick={() => router.push('/student-dashboard')}>🏠 Dashboard</div>
                <div className="quiz-nav-item" onClick={() => router.push('/student-notes')}>📁 My Notes</div>
                <div className="quiz-nav-item active">🧠 Quiz</div>
                <div className="quiz-nav-item" onClick={() => router.push('/student-library')}>📖 Resource Hub</div>
                <div className="quiz-nav-item" onClick={() => router.push('/student-learning')}>🎓 Learning</div>
            </div>
            <div className="quiz-sidebar-section">
                <h4>Quiz Steps</h4>
                <div className={`quiz-nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>1. Start</div>
                <div className={`quiz-nav-item ${view === 'pick-note' ? 'active' : ''}`}>2. Pick Note</div>
                <div className={`quiz-nav-item ${view === 'generating' ? 'active' : ''}`}>3. AI Generates</div>
                <div className={`quiz-nav-item ${view === 'quiz' ? 'active' : ''}`}>4. Take Quiz</div>
            </div>
        </div>
    );

    // ── HOME ──────────────────────────────────────────────────
    if (view === 'home') {
        return (
            <div className="quiz-page">
                <Sidebar />
                <div className="quiz-main">
                    <div className="quiz-page-header">
                        <h1 style={{ color: '#1e293b' }}>Quiz Generator</h1>
                        <p style={{ color: '#64748b' }}>Generate AI-powered quizzes from your own uploaded study notes.</p>
                    </div>

                    <div className="quiz-cta-card">
                        <div>
                            <h2 style={{ color: '#fff' }}>Ready to test yourself?</h2>
                            <p style={{ color: 'rgba(255,255,255,0.9)' }}>Our AI analyzes your uploaded notes and creates personalized MCQs, short answer and long answer questions.</p>
                            <button className="quiz-cta-btn" onClick={() => { setView('pick-note'); fetchMyNotes(); }}>
                                Generate Quiz from My Notes
                            </button>
                        </div>
                        <div className="quiz-cta-icon">🧠</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
                        {[
                            { icon: '📝', title: 'MCQ Questions', desc: '3 multiple choice questions with 4 options each' },
                            { icon: '✍️', title: 'Short Answers', desc: '2 short answer questions for quick recall' },
                            { icon: '📋', title: 'Long Answer', desc: '1 essay-style question for deep understanding' },
                        ].map(f => (
                            <div key={f.title} style={{ background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{f.icon}</div>
                                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1rem' }}>{f.title}</h3>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── PICK NOTE ─────────────────────────────────────────────
    if (view === 'pick-note') {
        return (
            <div className="quiz-page">
                <Sidebar />
                <div className="quiz-main">
                    <div className="quiz-page-header">
                        <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', marginBottom: '12px', padding: 0, fontSize: '0.95rem' }}>← Back</button>
                        <h1 style={{ color: '#1e293b' }}>Select a Note</h1>
                        <p style={{ color: '#64748b' }}>Choose from your uploaded notes. The AI will generate a tailored quiz.</p>
                    </div>

                    {loadingNotes ? (
                        <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>Loading your notes...</div>
                    ) : myNotes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>No notes uploaded yet</h3>
                            <p style={{ color: '#64748b', marginBottom: '20px' }}>Upload notes first before generating a quiz.</p>
                            <button onClick={() => router.push('/student-notes')} style={{ padding: '12px 28px', background: '#f57c00', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>Go to My Notes</button>
                        </div>
                    ) : (
                        <>
                            <div className="notes-pick-grid">
                                {myNotes.map(note => (
                                    <div
                                        key={note._id}
                                        className={`note-pick-card ${selectedNote?._id === note._id ? 'selected' : ''}`}
                                        onClick={() => setSelectedNote(note)}
                                    >
                                        {selectedNote?._id === note._id && (
                                            <div className="note-pick-check">✓</div>
                                        )}
                                        <div className="note-tag">#{note.subject}</div>
                                        <h3 style={{ color: '#1e293b' }}>{note.title}</h3>
                                        <p style={{ color: '#64748b' }}>{note.description || 'No description provided'}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                className="generate-btn"
                                onClick={handleGenerateQuiz}
                                disabled={!selectedNote}
                                style={{ backgroundColor: selectedNote ? '#f57c00' : '#cbd5e1' }}
                            >
                                {selectedNote ? `Generate Quiz for "${selectedNote.title}"` : 'Select a note to continue'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ── GENERATING ────────────────────────────────────────────
    if (view === 'generating') {
        return (
            <div className="quiz-page">
                <Sidebar />
                <div className="quiz-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="quiz-generating">
                        <div className="quiz-generating-icon">🤖</div>
                        <h2 style={{ color: '#1e293b' }}>AI is crafting your quiz...</h2>
                        <p style={{ color: '#64748b' }}>Analyzing <strong>{selectedNote?.title}</strong> and building questions.</p>
                        <div className="quiz-progress-bar">
                            <div className="quiz-progress-fill"></div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '10px' }}>This may take 10–20 seconds</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── QUIZ ──────────────────────────────────────────────────
    if (view === 'quiz' && quiz) {
        return (
            <div className="quiz-page">
                <Sidebar />
                <div className="quiz-main">
                    {submitted && (
                        <div className="quiz-score-banner">
                            <div className="quiz-score-banner-icon">🎉</div>
                            <div>
                                <h3 style={{ color: '#fff' }}>Quiz Completed!</h3>
                                <p style={{ color: 'rgba(255,255,255,0.9)' }}>Review the Professor's Insights below for descriptive questions.</p>
                            </div>
                            <div className="quiz-score-number">{mcqScore}/{mcqCount}</div>
                        </div>
                    )}

                    <div className="quiz-header-card">
                        <h1 style={{ color: '#1e293b' }}>{quiz.title}</h1>
                        <p style={{ color: '#64748b' }}>{quiz.questions.length} questions — MCQs, Short & Long Answers</p>
                    </div>

                    {quiz.questions.map((q, idx) => {
                        const isSelected = (opt) => answers[idx] === opt;
                        const isCorrect = (opt) => submitted && opt === q.correctAnswer;
                        const isWrong = (opt) => submitted && answers[idx] === opt && opt !== q.correctAnswer;

                        return (
                            <div key={idx} className="question-card">
                                <div className="question-meta">
                                    <span className="question-num">{idx + 1}</span>
                                    <div>
                                        <span className="question-type-label">
                                            {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'short' ? 'Short Answer' : 'Long Answer'}
                                        </span>
                                        <h3 style={{ color: '#1e293b', marginTop: '5px' }}>{q.question}</h3>
                                    </div>
                                </div>

                                {q.type === 'mcq' && (
                                    <div className="mcq-grid">
                                        {q.options.map(opt => (
                                            <button
                                                key={opt}
                                                disabled={submitted}
                                                onClick={() => setAnswers(p => ({ ...p, [idx]: opt }))}
                                                className={`mcq-option ${isSelected(opt) && !submitted ? 'selected' : ''} ${isCorrect(opt) ? 'correct' : ''} ${isWrong(opt) ? 'wrong' : ''}`}
                                                style={{ color: '#333' }}
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
                                        style={{ minHeight: q.type === 'long' ? '180px' : '95px', color: '#333' }}
                                    />
                                )}

                                {submitted && q.explanation && (
                                    <div className="professor-insight">
                                        <strong style={{ color: '#1e293b' }}>Professor's Insight:</strong>
                                        <p style={{ color: '#64748b' }}>{q.explanation}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {!submitted ? (
                        <button className="submit-quiz-btn" onClick={handleSubmit}>
                            Submit Quiz & See Results
                        </button>
                    ) : (
                        <button className="retry-quiz-btn" onClick={() => { setView('home'); setQuiz(null); setSelectedNote(null); }}>
                            Take Another Quiz
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default StudentQuizPage;

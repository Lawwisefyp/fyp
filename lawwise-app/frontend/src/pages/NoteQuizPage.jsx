import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../services/api";

export default function NoteQuizPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState({ mcq: 0, total: 3 });

    useEffect(() => {
        fetchQuiz();
    }, [quizId]);

    const fetchQuiz = async () => {
        try {
            const result = await authService.getQuizById(quizId);
            if (result.success) {
                setQuiz(result.quiz);
            }
        } catch (error) {
            console.error("Fetch quiz error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (qIndex, value) => {
        setAnswers(prev => ({ ...prev, [qIndex]: value }));
    };

    const handleSubmit = () => {
        let mcqCorrect = 0;
        quiz.questions.forEach((q, idx) => {
            if (q.type === 'mcq' && answers[idx] === q.correctAnswer) {
                mcqCorrect++;
            }
        });
        setScore({ mcq: mcqCorrect, total: quiz.questions.filter(q => q.type === 'mcq').length });
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Quiz...</div>;
    if (!quiz) return <div style={{ padding: '100px', textAlign: 'center' }}>Quiz not found.</div>;

    return (
        <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <button onClick={() => navigate('/student-notes')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>← Back to Notes</button>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ backgroundColor: '#f57c00', color: 'white', padding: '5px 15px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 'bold' }}>{quiz.subject}</span>
                </div>
            </div>

            <div style={{ background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '10px' }}>{quiz.title}</h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Test your knowledge with these {quiz.questions.length} AI-generated questions.</p>

                {submitted && (
                    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '20px', border: '1px solid #bae6fd' }}>
                        <h3 style={{ color: '#0369a1', margin: '0 0 10px 0' }}>Quiz Completed! 🎉</h3>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>MCQ Score: {score.mcq} / {score.total}</p>
                        <p style={{ fontSize: '0.9rem', color: '#0c4a6e', marginTop: '10px' }}>Short and Long answers require manual self-reflection. Review the correct explanations below.</p>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {quiz.questions.map((q, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <span style={{ height: '30px', width: '30px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>{idx + 1}</span>
                            <div>
                                <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold', color: '#f57c00', letterSpacing: '0.05em' }}>{q.type}</span>
                                <h3 style={{ margin: '5px 0 0 0', color: '#1e293b', lineHeight: '1.4' }}>{q.question}</h3>
                            </div>
                        </div>

                        {q.type === 'mcq' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {q.options.map(opt => (
                                    <button
                                        key={opt}
                                        disabled={submitted}
                                        onClick={() => handleAnswerChange(idx, opt)}
                                        style={{
                                            padding: '15px',
                                            borderRadius: '15px',
                                            border: answers[idx] === opt ? '2px solid #f57c00' : '1px solid #e2e8f0',
                                            background: answers[idx] === opt ? '#fff7ed' : 'white',
                                            boxShadow: answers[idx] === opt ? '0 4px 6px rgba(245, 124, 0, 0.1)' : 'none',
                                            cursor: submitted ? 'default' : 'pointer',
                                            textAlign: 'left',
                                            fontWeight: '500',
                                            color: answers[idx] === opt ? '#f57c00' : '#475569',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {opt}
                                        {submitted && opt === q.correctAnswer && <span style={{ float: 'right' }}>✅</span>}
                                        {submitted && answers[idx] === opt && opt !== q.correctAnswer && <span style={{ float: 'right' }}>❌</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        {(q.type === 'short' || q.type === 'long') && (
                            <textarea
                                disabled={submitted}
                                placeholder="Type your answer here..."
                                value={answers[idx] || ''}
                                onChange={(e) => handleAnswerChange(idx, e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: q.type === 'long' ? '200px' : '100px',
                                    padding: '20px',
                                    borderRadius: '15px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '1rem',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        )}

                        {submitted && q.explanation && (
                            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '15px', borderLeft: '4px solid #10b981' }}>
                                <h4 style={{ margin: '0 0 8px 0', color: '#065f46' }}>Professor's Insight:</h4>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>{q.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!submitted && (
                <button
                    onClick={handleSubmit}
                    style={{
                        marginTop: '40px',
                        width: '100%',
                        padding: '20px',
                        borderRadius: '20px',
                        backgroundColor: '#1e293b',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                    Submit Quiz & See Results
                </button>
            )}
        </div>
    );
}

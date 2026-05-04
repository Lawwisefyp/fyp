'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/StudentNotes.css';
import '@/styles/StudentGPA.css';

const StudentGPAPage = () => {
    const router = useRouter();
    const [subjects, setSubjects] = useState([
        { id: 1, name: '', marks: '', creditHours: 3 }
    ]);
    const [gpa, setGpa] = useState(0);
    const [activeTab, setActiveTab] = useState('calculate'); // 'calculate' or 'history'
    const [history, setHistory] = useState([]);
    const [saveTitle, setSaveTitle] = useState('');

    const addSubject = () => {
        setSubjects([...subjects, { id: Date.now(), name: '', marks: '', creditHours: 3 }]);
    };

    const removeSubject = (id) => {
        if (subjects.length > 1) {
            setSubjects(subjects.filter(s => s.id !== id));
        }
    };

    const updateSubject = (id, field, value) => {
        setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const calculateGradePoint = (marks) => {
        const m = parseFloat(marks);
        if (isNaN(m)) return 0;
        if (m >= 85) return 4.0;
        if (m >= 70) return 3.0;
        if (m >= 60) return 2.0;
        if (m >= 50) return 1.0;
        return 0.0;
    };

    const calculateGpa = () => {
        let totalPoints = 0;
        let totalCredits = 0;

        subjects.forEach(s => {
            const gradePoint = calculateGradePoint(s.marks);
            const credits = parseFloat(s.creditHours) || 0;
            totalPoints += gradePoint * credits;
            totalCredits += credits;
        });

        const result = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
        setGpa(result);
    };

    useEffect(() => {
        calculateGpa();
    }, [subjects]);

    useEffect(() => {
        const savedHistory = localStorage.getItem('gpaHistory');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
    }, []);

    const saveToHistory = () => {
        if (!saveTitle) {
            alert('Please enter a title (e.g. Semester 1)');
            return;
        }
        const newEntry = {
            id: Date.now(),
            title: saveTitle,
            gpa: gpa,
            date: new Date().toLocaleDateString(),
            subjects: subjects.filter(s => s.name && s.marks)
        };
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('gpaHistory', JSON.stringify(updatedHistory));
        setSaveTitle('');
        alert('Saved to History!');
    };

    const getGpaColor = (val) => {
        if (val >= 3.5) return 'grade-A';
        if (val >= 3.0) return 'grade-B';
        if (val >= 2.0) return 'grade-C';
        if (val >= 1.0) return 'grade-D';
        return 'grade-F';
    };

    return (
        <div className="notes-page-container">
            <div className="notes-sidebar">
                <div className="sidebar-section">
                    <button 
                        onClick={() => router.push('/student-dashboard')}
                        style={{ 
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', 
                            border: 'none', 
                            color: 'white', 
                            padding: '12px 20px', 
                            borderRadius: '12px', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '25px',
                            width: '100%',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        ← Dashboard
                    </button>
                    <h3>GPA Tools</h3>
                    <div className="folder-list">
                        <div 
                            className={`folder-item ${activeTab === 'calculate' ? 'active' : ''}`}
                            onClick={() => setActiveTab('calculate')}
                        >
                            📈 Calculator
                        </div>
                        <div 
                            className={`folder-item ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            📋 Grade History
                        </div>
                    </div>
                </div>

                <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                        💡 <strong>Tip:</strong> Keep your GPA above 3.0 for better academic standing.
                    </div>
                </div>
            </div>

            <div className="notes-main-content">
                <div className="notes-header">
                    <div className="notes-title-sec">
                        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', fontWeight: '800', margin: '0 0 10px 0' }}>
                            {activeTab === 'calculate' ? 'GPA Calculator' : 'Grade History'}
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                            {activeTab === 'calculate' 
                                ? 'Enter your subject marks and credit hours to calculate your GPA instantly.' 
                                : 'View your saved semester results and academic progress.'}
                        </p>
                    </div>
                </div>

                {activeTab === 'calculate' ? (
                    <div className="gpa-calculator-container">
                        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '15px', padding: '0 15px', fontWeight: '700', color: '#64748b', fontSize: '0.9rem' }}>
                            <div>Subject Name</div>
                            <div>Marks (0-100)</div>
                            <div>Credits</div>
                            <div style={{ width: '40px' }}></div>
                        </div>

                        {subjects.map((subject) => (
                            <div key={subject.id} className="gpa-input-row">
                                <input 
                                    type="text" 
                                    placeholder="e.g. Constitutional Law" 
                                    className="gpa-input"
                                    value={subject.name}
                                    onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                />
                                <input 
                                    type="number" 
                                    placeholder="Marks" 
                                    className="gpa-input"
                                    value={subject.marks}
                                    onChange={(e) => updateSubject(subject.id, 'marks', e.target.value)}
                                />
                                <input 
                                    type="number" 
                                    placeholder="CH" 
                                    className="gpa-input"
                                    value={subject.creditHours}
                                    onChange={(e) => updateSubject(subject.id, 'creditHours', e.target.value)}
                                />
                                <button className="remove-subject-btn" onClick={() => removeSubject(subject.id)}>×</button>
                            </div>
                        ))}

                        <button className="add-subject-btn" onClick={addSubject}>+ Add Another Subject</button>

                        <div className="gpa-result-card">
                            <div className="gpa-label">Your Estimated GPA</div>
                            <div className="gpa-value">{gpa}</div>
                            <div className={`grade-badge ${getGpaColor(parseFloat(gpa))}`}>
                                {parseFloat(gpa) >= 3.5 ? 'Excellent (A)' : 
                                 parseFloat(gpa) >= 3.0 ? 'Very Good (B)' :
                                 parseFloat(gpa) >= 2.0 ? 'Good (C)' :
                                 parseFloat(gpa) >= 1.0 ? 'Pass (D)' : 'Needs Improvement'}
                            </div>
                        </div>

                        <div className="sidebar-card" style={{ marginTop: '30px', padding: '30px', background: '#f0f7ff', border: '1.5px solid #dbeafe' }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#1e3a8a', fontSize: '1.1rem' }}>💾 Save this Result to History</h3>
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Semester / Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Semester 1 Final" 
                                        className="gpa-input"
                                        value={saveTitle}
                                        onChange={(e) => setSaveTitle(e.target.value)}
                                        style={{ width: '100%', background: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button 
                                        onClick={saveToHistory}
                                        style={{ 
                                            background: '#2563eb', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '12px 25px', 
                                            borderRadius: '12px', 
                                            fontWeight: '700', 
                                            cursor: 'pointer',
                                            height: '48px',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        Save to History
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="gpa-history-container">
                        {history.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                                {history.map(item => (
                                    <div key={item.id} className="sidebar-card" style={{ 
                                        padding: '0', 
                                        position: 'relative', 
                                        overflow: 'hidden',
                                        border: '1.5px solid #e2e8f0',
                                        transition: 'transform 0.2s ease'
                                    }}>
                                        {/* Color strip based on GPA */}
                                        <div style={{ 
                                            height: '6px', 
                                            background: parseFloat(item.gpa) >= 3.5 ? '#22c55e' : 
                                                        parseFloat(item.gpa) >= 3.0 ? '#3b82f6' : 
                                                        parseFloat(item.gpa) >= 2.0 ? '#eab308' : '#ef4444' 
                                        }}></div>
                                        
                                        <div style={{ padding: '25px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <div style={{ background: '#f1f5f9', padding: '10px 15px', borderRadius: '12px' }}>
                                                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e3a8a' }}>{item.gpa}</div>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>GRADE POINT</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.25rem', color: '#1e293b' }}>{item.title}</h3>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.date}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <div className={`grade-badge ${getGpaColor(parseFloat(item.gpa))}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                                                    {parseFloat(item.gpa) >= 3.5 ? 'Excellent' : 
                                                     parseFloat(item.gpa) >= 3.0 ? 'Good' :
                                                     parseFloat(item.gpa) >= 2.0 ? 'Average' : 'Fail'}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                                                    {item.subjects?.length || 0} Subjects
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                const updated = history.filter(h => h.id !== item.id);
                                                setHistory(updated);
                                                localStorage.setItem('gpaHistory', JSON.stringify(updated));
                                            }}
                                            style={{ 
                                                position: 'absolute', 
                                                top: '10px', 
                                                right: '10px', 
                                                background: '#fee2e2', 
                                                border: 'none', 
                                                color: '#ef4444', 
                                                cursor: 'pointer',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
                                <h3>No History Found</h3>
                                <p>Calculate your GPA and save it to see it here.</p>
                                <button 
                                    className="add-subject-btn" 
                                    style={{ width: 'auto', padding: '10px 30px', marginTop: '20px' }}
                                    onClick={() => setActiveTab('calculate')}
                                >
                                    Go to Calculator
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentGPAPage;

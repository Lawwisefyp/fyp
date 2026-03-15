'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import '@/styles/LawyerCaseHistory.css';

const STAGES = [
    { id: 1, name: 'Case Filed', duration: 0, desc: 'Initial petition filed' },
    { id: 2, name: 'Case Admitted', duration: 30, desc: 'Court admits the case' },
    { id: 3, name: 'Notice Issued', duration: 15, desc: 'Notice served to opposing party' },
    { id: 4, name: 'Written Statement Filed', duration: 30, desc: 'Defendant submits response' },
    { id: 5, name: 'Issues Framed', duration: 45, desc: 'Court frames issues for trial' },
    { id: 6, name: 'Evidence Stage', duration: 90, desc: 'Parties present evidence' },
    { id: 7, name: 'Arguments Stage', duration: 60, desc: 'Final arguments presented' },
    { id: 8, name: 'Judgment Reserved', duration: 30, desc: 'Court reserves judgment' },
    { id: 9, name: 'Judgment Pronounced', duration: 0, desc: 'Final verdict delivered' }
];

const LawyerCaseHistoryPage = () => {
    const [cases, setCases] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);
    const [newDeadline, setNewDeadline] = useState({ title: '', dueDate: '', description: '' });
    const [newCase, setNewCase] = useState({
        title: '', filingDate: new Date().toISOString().split('T')[0], clientName: '', opposingParty: '', lawyerName: '', court: '', judge: '', jurisdiction: 'Civil', nextHearingDate: '', description: ''
    });
    const router = useRouter();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const data = await authService.getCases();
            if (data.success) {
                setCases(data.cases);
            }
        } catch (error) {
            console.error('Failed to fetch cases', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCase = async (e) => {
        e.preventDefault();
        try {
            const data = await authService.createCase({
                ...newCase,
                currentStage: 1,
                lastUpdateDate: new Date().toISOString()
            });
            if (data.success) {
                setShowModal(false);
                fetchCases();
                setNewCase({
                    title: '', filingDate: new Date().toISOString().split('T')[0], clientName: '', opposingParty: '', lawyerName: '', court: '', judge: '', jurisdiction: 'Civil', nextHearingDate: '', description: ''
                });
            }
        } catch (error) {
            console.error('Failed to create case', error);
        }
    };

    const handleMarkComplete = async (caseId, stageId) => {
        try {
            const data = await authService.updateCaseProgress(caseId, stageId);
            if (data.success) {
                fetchCases();
                if (selectedCase && (selectedCase.id === caseId || selectedCase._id === caseId)) {
                    setSelectedCase(data.case);
                }
            }
        } catch (error) {
            console.error('Failed to update stage', error);
        }
    };

    const handleAddDeadline = async (e) => {
        e.preventDefault();
        if (!selectedCase) return;
        try {
            const caseId = selectedCase.id || selectedCase._id;
            const updatedDeadlines = [...(selectedCase.deadlines || []), newDeadline];
            const data = await authService.updateCase(caseId, { deadlines: updatedDeadlines });
            if (data.success) {
                setSelectedCase(data.case);
                setNewDeadline({ title: '', dueDate: '', description: '' });
                fetchCases();
            }
        } catch (error) {
            console.error('Failed to add deadline', error);
        }
    };

    const filteredCases = (cases || []).filter(c =>
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.client || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.court || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getProgress = (currentStage) => {
        return Math.round((currentStage / STAGES.length) * 100);
    };

    return (
        <div className="case-history-body">
            <div className="case-history-container">
                <Link href="/lawyer-dashboard" style={{ color: '#fff', fontWeight: '700', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>← Back to Dashboard</Link>

                <header className="case-history-header">
                    <div className="case-header-top">
                        <div className="case-header-title">
                            <h1>⚖️ Case History</h1>
                            <p>Track your legal cases and their progress in real-time.</p>
                        </div>
                        <button className="btn-case-action btn-case-success" onClick={() => setShowModal(true)}>+ New Case</button>
                    </div>

                    <div className="case-search-box">
                        <span className="case-search-icon">🔍</span>
                        <input
                            type="text"
                            className="case-search-input"
                            placeholder="Search cases by title, client, or court..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </header>

                <div className="cases-list-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>Loading cases...</div>
                    ) : filteredCases.length > 0 ? (
                        filteredCases.map(c => (
                            <div key={c._id} className="case-card">
                                <div className="case-card-top">
                                    <h3 className="case-card-title">{c.title}</h3>
                                    <div className="case-card-badge">
                                        {STAGES.find(s => s.id === (c.currentStage || 1))?.name || 'In Progress'}
                                    </div>
                                </div>

                                <div className="case-stats-grid">
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Client</span>
                                        <span className="case-stat-value">{c.clientName || c.client}</span>
                                    </div>
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Court</span>
                                        <span className="case-stat-value">{c.court}</span>
                                    </div>
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Judge</span>
                                        <span className="case-stat-value">{c.judge || 'N/A'}</span>
                                    </div>
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Filing Date</span>
                                        <span className="case-stat-value">{new Date(c.filingDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Next Hearing</span>
                                        <span className="case-stat-value" style={{ color: '#e65100' }}>{c.nextHearingDate ? new Date(c.nextHearingDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="case-progress-wrapper">
                                    <div className="case-progress-bar">
                                        <div className="case-progress-fill" style={{ width: `${getProgress(c.currentStage || 1)}%` }}></div>
                                    </div>
                                    <div className="case-progress-text">Case Progress: {getProgress(c.currentStage || 1)}%</div>
                                </div>

                                <div className="case-card-footer" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '10px' }}>
                                    <button className="btn-case-action btn-case-info" style={{ flex: 1, background: '#c19651', color: '#fff' }} onClick={() => setSelectedCase(c)}>View Full Details</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.9)', borderRadius: '20px' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚖️</div>
                            <h3>No Cases Found</h3>
                            <p>Start tracking a new case today.</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-title">
                            <span>📝 Create New Case</span>
                            <button onClick={() => setShowModal(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleCreateCase}>
                            <div className="form-input-grid" style={{ marginBottom: '20px' }}>
                                <div className="profile-form-group">
                                    <label>Case Title *</label>
                                    <input className="profile-input" value={newCase.title} onChange={(e) => setNewCase({ ...newCase, title: e.target.value })} required />
                                </div>
                                <div className="profile-form-group">
                                    <label>Client Name *</label>
                                    <input className="profile-input" value={newCase.clientName} onChange={(e) => setNewCase({ ...newCase, clientName: e.target.value })} required />
                                </div>
                                <div className="profile-form-group">
                                    <label>Court *</label>
                                    <input className="profile-input" value={newCase.court} onChange={(e) => setNewCase({ ...newCase, court: e.target.value })} required />
                                </div>
                                <div className="profile-form-group">
                                    <label>Judge Name</label>
                                    <input className="profile-input" value={newCase.judge} onChange={(e) => setNewCase({ ...newCase, judge: e.target.value })} />
                                </div>
                                <div className="profile-form-group">
                                    <label>Filing Date</label>
                                    <input type="date" className="profile-input" value={newCase.filingDate} onChange={(e) => setNewCase({ ...newCase, filingDate: e.target.value })} />
                                </div>
                                <div className="profile-form-group">
                                    <label>Next Hearing</label>
                                    <input type="date" className="profile-input" value={newCase.nextHearingDate} onChange={(e) => setNewCase({ ...newCase, nextHearingDate: e.target.value })} />
                                </div>
                                <div className="profile-form-group">
                                    <label>Jurisdiction</label>
                                    <select className="profile-select" value={newCase.jurisdiction} onChange={(e) => setNewCase({ ...newCase, jurisdiction: e.target.value })}>
                                        <option value="Civil">Civil</option>
                                        <option value="Criminal">Criminal</option>
                                        <option value="Family">Family</option>
                                    </select>
                                </div>
                                <div className="profile-form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Case Description</label>
                                    <textarea className="profile-input" style={{ minHeight: '100px', resize: 'vertical' }} value={newCase.description} onChange={(e) => setNewCase({ ...newCase, description: e.target.value })} placeholder="Enter case details, summary, or background..." />
                                </div>
                            </div>
                            <button type="submit" className="btn-profile-save">Create Case Tracking</button>
                        </form>
                    </div>
                </div>
            )}

            {selectedCase && (
                <div className="modal-overlay">
                    <div className="modal-box detail-modal" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-title" style={{ background: '#c19651', color: 'white', padding: '20px' }}>
                            <span>⚖️ Case Details: {selectedCase.title}</span>
                            <button onClick={() => setSelectedCase(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'white' }}>✕</button>
                        </div>
                        <div className="detail-modal-content" style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto', background: 'white' }}>
                            <div className="detail-section" style={{ marginBottom: '30px' }}>
                                <h4 style={{ color: '#c19651', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px' }}>General Information</h4>
                                <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div className="detail-item"><strong style={{ color: '#4b5563' }}>Client:</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.clientName || selectedCase.client}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#4b5563' }}>Opposing Party:</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.opposingParty}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#4b5563' }}>Court:</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.court}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#4b5563' }}>Judge:</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.judge || 'N/A'}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#4b5563' }}>Jurisdiction:</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.jurisdiction}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#4b5563' }}>Filing Date:</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{new Date(selectedCase.filingDate).toLocaleDateString()}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#4b5563' }}>Next Hearing:</strong> <span style={{ color: '#e65100', fontWeight: '700' }}>{selectedCase.nextHearingDate ? new Date(selectedCase.nextHearingDate).toLocaleDateString() : 'N/A'}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#4b5563' }}>Status:</strong> <span style={{ color: '#c19651', fontWeight: '700' }}>{STAGES.find(s => s.id === (selectedCase.currentStage || 1))?.name}</span></div>
                                </div>
                            </div>

                            {(selectedCase.description) && (
                                <div className="detail-section" style={{ marginBottom: '30px' }}>
                                    <h4 style={{ color: '#c19651', marginBottom: '10px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px' }}>Description</h4>
                                    <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{selectedCase.description}</p>
                                </div>
                            )}

                            <div className="detail-section">
                                <h4 style={{ color: '#c19651', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px', fontWeight: '800' }}>Case Timeline & Progress</h4>
                                <div className="timeline-container" style={{ position: 'relative', paddingLeft: '30px', borderLeft: '2px solid #e2e8f0', marginLeft: '10px' }}>
                                    {STAGES.map((stage) => {
                                        const isCompleted = selectedCase.completedStages?.includes(stage.id) || (selectedCase.currentStage >= stage.id);
                                        const isCurrent = (selectedCase.currentStage || 1) === stage.id;
                                        const completionData = selectedCase.stageHistory?.find(s => s.stageId === stage.id);

                                        return (
                                            <div key={stage.id} className="timeline-item" style={{ position: 'relative', marginBottom: '25px' }}>
                                                {/* Bullet */}
                                                <div className="timeline-bullet" style={{
                                                    position: 'absolute', left: '-41px', top: '0', width: '20px', height: '20px',
                                                    borderRadius: '50%', background: isCompleted ? '#c19651' : '#e2e8f0',
                                                    border: isCurrent ? '4px solid #fff' : 'none',
                                                    boxShadow: isCurrent ? '0 0 0 2px #c19651' : 'none',
                                                    zIndex: 2
                                                }}></div>

                                                <div className="timeline-content" style={{ opacity: isCompleted ? 1 : 0.6 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                        <h5 style={{ margin: 0, fontWeight: '800', color: isCurrent ? '#c19651' : '#1e293b' }}>
                                                            {stage.name} {isCompleted && !isCurrent && '✓'}
                                                        </h5>
                                                        {completionData && (
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                                                                Completed on {new Date(completionData.completedDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{stage.desc}</p>

                                                    {isCurrent && stage.id < 9 && (
                                                        <button
                                                            className="btn-mark-done"
                                                            onClick={() => handleMarkComplete(selectedCase.id || selectedCase._id, stage.id + 1)}
                                                            style={{ marginTop: '10px', background: '#c19651', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                                        >
                                                            Mark "{stage.name}" as Completed
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="detail-section" style={{ marginBottom: '30px' }}>
                                <h4 style={{ color: '#c19651', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px', fontWeight: '800' }}>Manage Deadlines</h4>
                                <div className="deadline-list" style={{ marginBottom: '20px' }}>
                                    {selectedCase.deadlines && selectedCase.deadlines.length > 0 ? (
                                        selectedCase.deadlines.map((d, idx) => (
                                            <div key={idx} style={{ background: '#fff9f0', padding: '12px', borderRadius: '10px', marginBottom: '10px', border: '1px solid #fce8cc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: '#854d0e' }}>⏰ {d.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#a16207' }}>Due: {new Date(d.dueDate).toLocaleDateString()}</div>
                                                </div>
                                                {d.isCompleted ? <span style={{ color: 'green', fontWeight: '800' }}>✓ Done</span> : <span style={{ color: '#c19651', fontWeight: '600' }}>Pending</span>}
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>No specific deadlines set for this case.</p>
                                    )}
                                </div>
                                <form onSubmit={handleAddDeadline} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Add New Deadline</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
                                        <input className="profile-input" placeholder="Deadline Title" value={newDeadline.title} onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })} required />
                                        <input type="date" className="profile-input" value={newDeadline.dueDate} onChange={(e) => setNewDeadline({ ...newDeadline, dueDate: e.target.value })} required />
                                        <button type="submit" style={{ background: '#c19651', color: 'white', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Add</button>
                                    </div>
                                </form>
                            </div>

                            {selectedCase.documents && selectedCase.documents.length > 0 && (
                                <div className="detail-section">
                                    <h4 style={{ color: '#c19651', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px' }}>Attached Documents</h4>
                                    <div className="doc-list" style={{ display: 'grid', gap: '10px' }}>
                                        {selectedCase.documents.map((doc, idx) => (
                                            <div key={idx} className="doc-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontWeight: '600', color: '#1e293b' }}>📄 {doc.originalName}</span>
                                                <a href={`/api/cases/${selectedCase.id || selectedCase._id}/documents/${doc.filename}`} target="_blank" rel="noopener noreferrer" style={{ background: '#c19651', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700' }}>Download</a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerCaseHistoryPage;

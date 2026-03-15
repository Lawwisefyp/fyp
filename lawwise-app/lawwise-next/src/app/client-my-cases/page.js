'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services/api';
import '@/styles/ClientMyCases.css';

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

const ClientMyCasesPage = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedCase, setSelectedCase] = useState(null);

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const data = await authService.getClientCases();
                setCases(data.cases || []);
            } catch (error) {
                console.error('Failed to load cases:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCases();
    }, []);

    const filteredCases = cases.filter(c => {
        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesType = !typeFilter || c.caseType === typeFilter;
        return matchesStatus && matchesType;
    });

    const activeCount = cases.filter(c => ['filed', 'assigned', 'in-progress'].includes(c.status)).length;
    const completedCount = cases.filter(c => c.status === 'completed').length;

    const formatDate = (date) => new Date(date).toLocaleDateString();

    return (
        <div className="mycases-body">
            <div className="mycases-container">
                <Link href="/client-dashboard" className="back-link" style={{ textDecoration: 'none', color: '#666', fontWeight: '600', marginBottom: '20px', display: 'inline-block' }}>← Back to Portal</Link>

                <header className="mycases-header">
                    <h1>📋 My Cases</h1>
                    <p>Track and manage your filed cases</p>
                    <div className="mycases-header-actions">
                        <Link href="/client-efiling" className="btn-mycases btn-mycases-primary" style={{ textDecoration: 'none' }}>+ File New Case</Link>
                        <Link href="/client-dashboard" className="btn-mycases btn-mycases-secondary" style={{ textDecoration: 'none' }}>Dashboard</Link>
                    </div>
                </header>

                <div className="mycases-stats">
                    <div className="mycase-stat-card">
                        <div className="stat-val">{cases.length}</div>
                        <div className="stat-lbl">Total Cases</div>
                    </div>
                    <div className="mycase-stat-card">
                        <div className="stat-val">{activeCount}</div>
                        <div className="stat-lbl">Active</div>
                    </div>
                    <div className="mycase-stat-card">
                        <div className="stat-val">{completedCount}</div>
                        <div className="stat-lbl">Completed</div>
                    </div>
                </div>

                <div className="mycases-filter-bar">
                    <div className="filter-item">
                        <label>Status:</label>
                        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ color: '#333' }}>
                            <option value="">All Status</option>
                            <option value="filed">Filed</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Type:</label>
                        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ color: '#333' }}>
                            <option value="">All Types</option>
                            <option value="civil">Civil</option>
                            <option value="criminal">Criminal</option>
                            <option value="family">Family</option>
                            <option value="corporate">Corporate</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#c19651' }}>Loading cases...</div>
                ) : filteredCases.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', background: 'white', padding: '60px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📂</div>
                        <h3 style={{ color: '#333' }}>No Cases Found</h3>
                        <p style={{ color: '#666' }}>You haven't filed any cases yet matching these criteria.</p>
                        <Link href="/client-efiling" className="btn-mycases btn-mycases-primary" style={{ marginTop: '20px', display: 'inline-block', background: '#c19651', color: 'white', textDecoration: 'none' }}>File Your First Case</Link>
                    </div>
                ) : (
                    <div className="mycases-grid">
                        {filteredCases.map(c => (
                            <div key={c._id || c.id} className="mycase-card">
                                <div className="mycase-card-header">
                                    <div className="mycase-title-box">
                                        <h3 style={{ color: '#1e293b' }}>{c.title}</h3>
                                        <span className="mycase-id">ID: {c.id || c._id?.slice(-8).toUpperCase()}</span>
                                    </div>
                                    <span className={`mycase-status-badge status-${c.status === 'in-progress' ? 'progress' : c.status}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <div className="mycase-card-body">
                                    <div className="mycase-details-grid">
                                        <div className="mycase-detail-item">
                                            <label>Opposing Party</label>
                                            <p style={{ color: '#333' }}>{c.opposingParty}</p>
                                        </div>
                                        <div className="mycase-detail-item">
                                            <label>Court</label>
                                            <p style={{ color: '#333' }}>{c.court || c.courtName}</p>
                                        </div>
                                        <div className="mycase-detail-item">
                                            <label>Jurisdiction</label>
                                            <p style={{ color: '#333' }}>{c.jurisdiction}</p>
                                        </div>
                                        <div className="mycase-detail-item">
                                            <label>Filing Date</label>
                                            <p style={{ color: '#333' }}>{formatDate(c.filingDate)}</p>
                                        </div>
                                    </div>
                                    <div className="mycase-progress-section">
                                        <div className="progress-header">
                                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Case Progress</span>
                                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Stage {c.currentStage || 1} of 9</span>
                                        </div>
                                        <div className="mycase-progress-bar">
                                            <div className="mycase-progress-fill" style={{ width: `${((c.currentStage || 1) / 9) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mycase-card-footer">
                                    <button className="btn-card-action btn-card-details" onClick={() => setSelectedCase(c)}>View Details</button>
                                    <button className="btn-card-action btn-card-download" onClick={() => window.print()}>Print Summary</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedCase && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-box" style={{ background: 'white', maxWidth: '800px', width: '90%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <div className="modal-title" style={{ background: '#c19651', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>⚖️ Case Details: {selectedCase.title}</span>
                            <button onClick={() => setSelectedCase(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'white' }}>✕</button>
                        </div>
                        <div className="detail-modal-content" style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="detail-section" style={{ marginBottom: '30px' }}>
                                <h4 style={{ color: '#c19651', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px', fontWeight: '800' }}>Case Overview</h4>
                                <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div className="detail-item"><strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Client Name</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.client || selectedCase.clientName}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Opposing Party</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.opposingParty}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Court</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.court}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Judge</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.judge || 'N/A'}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Jurisdiction</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{selectedCase.jurisdiction}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Filing Date</strong> <span style={{ color: '#1e293b', fontWeight: '600' }}>{new Date(selectedCase.filingDate).toLocaleDateString()}</span></div>
                                    <div className="detail-item"><strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Status</strong> <span style={{ color: '#c19651', fontWeight: '800' }}>{selectedCase.status.toUpperCase()}</span></div>
                                </div>
                            </div>

                            {selectedCase.description && (
                                <div className="detail-section" style={{ marginBottom: '30px' }}>
                                    <h4 style={{ color: '#c19651', marginBottom: '10px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px', fontWeight: '800' }}>Description</h4>
                                    <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{selectedCase.description}</p>
                                </div>
                            )}

                            <div className="detail-section">
                                <h4 style={{ color: '#c19651', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px', fontWeight: '800' }}>Case Timeline</h4>
                                <div className="timeline-container" style={{ position: 'relative', paddingLeft: '30px', borderLeft: '2px solid #e2e8f0', marginLeft: '10px' }}>
                                    {STAGES.map((stage, index) => {
                                        const isCompleted = selectedCase.completedStages?.includes(stage.id) || (selectedCase.currentStage >= stage.id);
                                        const isCurrent = (selectedCase.currentStage || 1) === stage.id;
                                        const completionData = selectedCase.stageHistory?.find(s => s.stageId === stage.id);

                                        return (
                                            <div key={stage.id} className="timeline-item" style={{ position: 'relative', marginBottom: '25px' }}>
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
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedCase.documents && selectedCase.documents.length > 0 && (
                                <div className="detail-section">
                                    <h4 style={{ color: '#c19651', marginBottom: '15px', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px', fontWeight: '800' }}>Case Documents</h4>
                                    <div className="doc-list" style={{ display: 'grid', gap: '10px' }}>
                                        {selectedCase.documents.map((doc, idx) => (
                                            <div key={idx} className="doc-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontWeight: '600', color: '#1e293b' }}>📄 {doc.originalName}</span>
                                                <a href={`/api/cases/${selectedCase._id}/documents/${doc.filename}`} target="_blank" rel="noopener noreferrer" style={{ background: '#c19651', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700' }}>Download</a>
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

export default ClientMyCasesPage;

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import { Briefcase, Filter, Search, Clock, Shield, ChevronRight, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import '@/styles/Dashboard.css';

const LawyerCaseMarketplacePage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [respondingId, setRespondingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterUrgency, setFilterUrgency] = useState('All');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('lawyerInfo');
        if (info) setCurrentUser(JSON.parse(info));
    }, []);

    const fetchMarketplace = async () => {
        setLoading(true);
        try {
            // Updated to call the new case-requests marketplace endpoint
            const res = await authService.getCaseRequestsMarketplace();
            if (res.success) {
                setRequests(res.requests);
            }
        } catch (err) {
            console.error('Error fetching marketplace:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketplace();
    }, []);

    const handleRespond = async (requestId, status) => {
        setRespondingId(requestId);
        try {
            const note = prompt(`Enter a brief note for the client (optional):`);
            const res = await authService.respondToCaseRequest(requestId, { status, lawyerNote: note });
            if (res.success) {
                alert(`Request ${status} successfully!`);
                fetchMarketplace();
                setSelectedRequest(null);
            } else {
                alert(res.message || 'Failed to update request');
            }
        } catch (err) {
            console.error('Response error:', err);
            alert('An error occurred while responding to the request');
        } finally {
            setRespondingId(null);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             req.caseId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory === 'All' || req.aiAnalysis?.predictedCategory === filterCategory;
        const matchesUrg = filterUrgency === 'All' || req.urgency?.toLowerCase() === filterUrgency.toLowerCase();
        return matchesSearch && matchesCat && matchesUrg;
    });

    const categories = ['All', ...new Set(requests.map(r => r.aiAnalysis?.predictedCategory).filter(Boolean))];

    return (
        <div className="dashboard-body">
            <LawyerSidebar />
            <div className="dashboard-main" style={{ background: '#f4f7fa', minHeight: '100vh' }}>
                <header className="premium-page-header" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '30px 40px' }}>
                    <div className="premium-header-left">
                        <div className="premium-header-icon" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <BrainCircuit size={24} color="#3b82f6" />
                        </div>
                        <div className="premium-header-text">
                            <h1 style={{ color: '#fff', fontSize: '1.8rem' }}>AI-Powered Request Queue</h1>
                            <p style={{ color: '#94a3b8' }}>Review, analyze, and accept incoming legal requests from verified clients</p>
                        </div>
                    </div>
                    <div className="premium-header-right">
                        <div className="stats-mini-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>New Requests</span>
                            <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800' }}>{requests.length}</span>
                        </div>
                    </div>
                </header>

                <div className="marketplace-content" style={{ padding: '30px 40px' }}>
                    {/* Filters & Search Toolbar */}
                    <div className="toolbar-section" style={{ 
                        background: '#fff', 
                        padding: '20px', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        gap: '20px', 
                        alignItems: 'center',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        marginBottom: '30px'
                    }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input 
                                type="text" 
                                placeholder="Search by Case ID or Title..." 
                                className="search-input-premium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 12px 12px 45px', 
                                    borderRadius: '10px', 
                                    border: '1px solid #e2e8f0',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Filter size={16} color="#64748b" />
                                <select 
                                    className="filter-select" 
                                    value={filterCategory} 
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem' }}
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <select 
                                className="filter-select" 
                                value={filterUrgency} 
                                onChange={(e) => setFilterUrgency(e.target.value)}
                                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem' }}
                            >
                                <option value="All">All Urgency</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="queue-container" style={{ display: 'grid', gridTemplateColumns: selectedRequest ? '1fr 400px' : '1fr', gap: '30px', transition: 'all 0.3s ease' }}>
                        {/* Table View */}
                        <div className="table-card" style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700' }}>Case ID</th>
                                        <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700' }}>Client</th>
                                        <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700' }}>Category</th>
                                        <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700' }}>Urgency</th>
                                        <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700' }}>Status</th>
                                        <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" style={{ padding: '100px', textAlign: 'center' }}><div className="loader" style={{ margin: '0 auto' }}></div></td></tr>
                                    ) : filteredRequests.length === 0 ? (
                                        <tr><td colSpan="6" style={{ padding: '100px', textAlign: 'center', color: '#64748b' }}>No requests found matching your filters.</td></tr>
                                    ) : (
                                        filteredRequests.map(req => (
                                            <tr key={req.id} 
                                                onClick={() => setSelectedRequest(req)}
                                                style={{ 
                                                    borderBottom: '1px solid #f1f5f9', 
                                                    cursor: 'pointer', 
                                                    background: selectedRequest?.id === req.id ? '#f1f5f9' : 'transparent',
                                                    transition: 'background 0.2s'
                                                }}
                                                className="queue-row"
                                            >
                                                <td style={{ padding: '20px 25px' }}>
                                                    <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '0.9rem' }}>{req.caseId}</span>
                                                    {req.assignedLawyerId && (req.assignedLawyerId === currentUser?._id || req.assignedLawyerId === currentUser?.id) && (
                                                        <div style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', fontWeight: '800' }}>DIRECT REQUEST</div>
                                                    )}
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Filed {new Date(req.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td style={{ padding: '20px 25px' }}>
                                                    <div style={{ color: '#1e293b', fontWeight: '#600' }}>{req.clientInfo?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.location}</div>
                                                </td>
                                                <td style={{ padding: '20px 25px' }}>
                                                    <span style={{ 
                                                        background: '#eff6ff', 
                                                        color: '#3b82f6', 
                                                        padding: '4px 12px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: '600' 
                                                    }}>
                                                        {req.aiAnalysis?.predictedCategory || req.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px 25px' }}>
                                                    <span style={{ 
                                                        color: req.urgency?.toLowerCase() === 'high' ? '#ef4444' : '#64748b', 
                                                        fontWeight: '700', 
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        {req.urgency?.toLowerCase() === 'high' && <Clock size={14} />}
                                                        {req.urgency?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px 25px' }}>
                                                    <span style={{ 
                                                        color: '#f59e0b', 
                                                        fontSize: '0.85rem', 
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                                        Pending Review
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px 25px', textAlign: 'right' }}>
                                                    <ChevronRight size={18} color="#cbd5e1" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Detail Side Panel */}
                        {selectedRequest && (
                            <div className="detail-panel fade-in" style={{ background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', position: 'sticky', top: '30px', alignSelf: 'start' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Request Details</h3>
                                    <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                                </div>

                                <div className="client-profile-box" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <div style={{ background: '#1e293b', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                            {selectedRequest.clientInfo?.name?.[0] || 'C'}
                                        </div>
                                        <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase' }}>Client Profile</span>
                                    </div>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <div style={{ fontSize: '0.85rem' }}><span style={{ color: '#64748b' }}>Name:</span> <span style={{ color: '#0f172a', fontWeight: '600' }}>{selectedRequest.clientInfo?.name}</span></div>
                                        <div style={{ fontSize: '0.85rem' }}><span style={{ color: '#64748b' }}>Email:</span> <span style={{ color: '#0f172a' }}>{selectedRequest.clientInfo?.email}</span></div>
                                        <div style={{ fontSize: '0.85rem' }}><span style={{ color: '#64748b' }}>Phone:</span> <span style={{ color: '#0f172a' }}>{selectedRequest.clientInfo?.phone || 'Not provided'}</span></div>
                                    </div>
                                </div>

                                <div className="ai-insight-box" style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                        <BrainCircuit size={18} color="#0369a1" />
                                        <span style={{ color: '#0369a1', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase' }}>AI Insight Summary</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e', fontStyle: 'italic', lineHeight: '1.6' }}>
                                        "{selectedRequest.aiAnalysis?.summary || selectedRequest.description}"
                                    </p>
                                </div>

                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Original Description</label>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', maxHeight: '150px', overflowY: 'auto', lineHeight: '1.5' }}>
                                        {selectedRequest.description}
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Location</label>
                                        <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>{selectedRequest.location}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Budget</label>
                                        <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#10b981', fontWeight: '800' }}>PKR {selectedRequest.budget || 'Not set'}</p>
                                    </div>
                                </div>

                                {selectedRequest.evidence && selectedRequest.evidence.length > 0 && (
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Submitted Evidence ({selectedRequest.evidence.length})</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedRequest.evidence.map((file, idx) => (
                                                <a 
                                                    key={idx}
                                                    href={`http://localhost:5001/${file.filepath?.replace(/\\/g, '/')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '10px', 
                                                        padding: '10px 15px', 
                                                        background: '#f8fafc', 
                                                        border: '1px solid #e2e8f0', 
                                                        borderRadius: '8px',
                                                        textDecoration: 'none',
                                                        color: '#1e293b',
                                                        fontSize: '0.8rem',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                                >
                                                    <div style={{ background: '#fff', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                    </div>
                                                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.originalName || file.filename}</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button 
                                        onClick={() => handleRespond(selectedRequest.id, 'accepted')}
                                        disabled={respondingId === selectedRequest.id}
                                        style={{ 
                                            flex: 1, 
                                            padding: '12px', 
                                            borderRadius: '10px', 
                                            background: '#10b981', 
                                            color: '#fff', 
                                            border: 'none', 
                                            fontWeight: '700', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '8px',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                                        }}
                                    >
                                        <CheckCircle size={18} />
                                        {respondingId === selectedRequest.id ? '...' : 'ACCEPT'}
                                    </button>
                                    <button 
                                        onClick={() => handleRespond(selectedRequest.id, 'rejected')}
                                        disabled={respondingId === selectedRequest.id}
                                        style={{ 
                                            flex: 1, 
                                            padding: '12px', 
                                            borderRadius: '10px', 
                                            background: '#fee2e2', 
                                            color: '#ef4444', 
                                            border: '1px solid #fecaca', 
                                            fontWeight: '700', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <XCircle size={18} />
                                        {respondingId === selectedRequest.id ? '...' : 'REJECT'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .queue-row:hover {
                    background: #f8fafc !important;
                }
                .search-input-premium:focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                .fade-in {
                    animation: fadeIn 0.3s ease-in;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default LawyerCaseMarketplacePage;


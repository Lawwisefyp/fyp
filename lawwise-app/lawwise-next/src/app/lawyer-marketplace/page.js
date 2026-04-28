'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import '@/styles/LawyerCaseHistory.css'; // Reusing styles for consistency

const LawyerCaseMarketplacePage = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchMarketplace();
    }, []);

    const fetchMarketplace = async () => {
        setLoading(true);
        try {
            const data = await authService.getUnassignedCases();
            if (data.success) {
                setCases(data.cases);
            }
        } catch (error) {
            console.error('Failed to fetch marketplace', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimCase = async (caseId) => {
        if (!window.confirm('Are you sure you want to claim this case? It will be added to your active cases.')) return;

        setClaimingId(caseId);
        try {
            const data = await authService.claimCase(caseId);
            if (data.success) {
                alert('Case claimed successfully! Redirecting to your case history...');
                router.push('/case-history');
            } else {
                alert(data.message || 'Failed to claim case.');
                fetchMarketplace();
            }
        } catch (error) {
            console.error('Claim error:', error);
            alert('An error occurred while claiming the case.');
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <div className="case-history-body">
            <div className="case-history-container">
                <Link href="/lawyer-dashboard" className="btn-back-dashboard">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    Back to Dashboard
                </Link>

                <header className="case-history-header">
                    <div className="case-header-top">
                        <div className="case-header-title">
                            <h1>Case Marketplace</h1>
                            <p>Browse and claim unassigned cases filed by clients in the platform.</p>
                        </div>
                    </div>
                </header>

                <div className="cases-list-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
                            <div className="loader" style={{ margin: '0 auto 20px' }}></div>
                            <p>Fetching available cases...</p>
                        </div>
                    ) : cases.length > 0 ? (
                        cases.map(c => (
                            <div key={c._id || c.id} className="case-card">
                                <div className="case-card-top">
                                    <h3 className="case-card-title">{c.title}</h3>
                                    <div className="case-card-badge" style={{ background: '#e1f5fe', color: '#0288d1' }}>
                                        {c.caseType?.toUpperCase() || 'NEW FILE'}
                                    </div>
                                    <div className="case-card-badge" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>
                                        EXPERTISE MATCH
                                    </div>
                                </div>

                                <div className="case-stats-grid">
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Client Name</span>
                                        <span className="case-stat-value">{c.client || c.clientName}</span>
                                    </div>
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Court</span>
                                        <span className="case-stat-value">{c.court}</span>
                                    </div>
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Jurisdiction</span>
                                        <span className="case-stat-value">{c.jurisdiction}</span>
                                    </div>
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Opposing Party</span>
                                        <span className="case-stat-value">{c.opposingParty}</span>
                                    </div>
                                    <div className="case-stat-item">
                                        <span className="case-stat-label">Filing Date</span>
                                        <span className="case-stat-value">{new Date(c.filingDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="case-description" style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', color: '#475569', borderLeft: '4px solid #111827' }}>
                                    <div style={{ fontWeight: '700', marginBottom: '5px', color: '#1e293b' }}>Description:</div>
                                    {c.description || "No description provided."}
                                </div>

                                <div className="case-card-footer" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '10px' }}>
                                    <button
                                        className="btn-case-action btn-case-success"
                                        style={{ flex: 1, padding: '12px', fontWeight: '800' }}
                                        onClick={() => handleClaimCase(c.id)}
                                        disabled={claimingId === c.id}
                                    >
                                        {claimingId === c.id ? 'Claiming...' : 'Claim This Case'}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            </div>
                            <h3>Marketplace is Clear</h3>
                            <p>There are no unassigned cases at the moment. Check back later!</p>
                            <button className="btn-case-action btn-case-success" style={{ marginTop: '20px' }} onClick={fetchMarketplace}>
                                Refresh Marketplace
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LawyerCaseMarketplacePage;

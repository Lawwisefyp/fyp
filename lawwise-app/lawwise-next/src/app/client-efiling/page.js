'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/api';
import '@/styles/ClientEFiling.css';

const ClientEFilingPage = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [caseRef, setCaseRef] = useState(null);
    const [formData, setFormData] = useState({
        caseType: '',
        title: '',
        client: '',
        clientEmail: '',
        clientPhone: '',
        filingDate: new Date().toISOString().split('T')[0],
        opposingParty: '',
        court: '',
        jurisdiction: '',
        description: ''
    });

    const [files, setFiles] = useState([]);
    const [recommendedLawyers, setRecommendedLawyers] = useState([]);
    const [perfectMatch, setPerfectMatch] = useState(null);
    const [fetchingLawyers, setFetchingLawyers] = useState(false);
    const [connectLoading, setConnectLoading] = useState({});
    const [showConnectPrompt, setShowConnectPrompt] = useState(false);
    const [selectedLawyer, setSelectedLawyer] = useState(null);

    useEffect(() => {
        const info = localStorage.getItem('clientInfo');
        if (info) {
            const client = JSON.parse(info);
            setFormData(prev => ({
                ...prev,
                client: client.fullName || '',
                clientEmail: client.email || '',
                clientPhone: client.phone || ''
            }));
        }

        const prefilled = sessionStorage.getItem('prefilledCase');
        if (prefilled) {
            const caseData = JSON.parse(prefilled);
            setFormData(prev => ({
                ...prev,
                caseType: caseData.caseType || '',
                title: caseData.title || caseData.caseTitle || '',
                description: caseData.description || ''
            }));
            if (caseData.caseType) {
                fetchRecommendations(caseData.caseType);
            }
            sessionStorage.removeItem('prefilledCase');
        }
    }, []);

    const fetchRecommendations = async (type) => {
        setFetchingLawyers(true);
        try {
            const areaMapping = {
                'civil': 'Civil Law',
                'criminal': 'Criminal Law',
                'family': 'Family Law',
                'corporate': 'Corporate Law',
                'labor': 'Labor Law',
                'intellectual': 'Intellectual Property'
            };
            const practiceArea = areaMapping[type] || type;

            const matchResponse = await authService.getPerfectMatch({
                practiceArea,
                description: formData.description,
                city: formData.jurisdiction
            });

            if (matchResponse.success && matchResponse.match) {
                setPerfectMatch(matchResponse.match);
                setSelectedLawyer(matchResponse.match);
                setShowConnectPrompt(true);
            } else {
                setPerfectMatch(null);
            }

            const response = await authService.searchLawyers({
                practiceArea,
                rating: 0,
                showAll: true
            });
            if (response.success) {
                const lawyers = response.lawyers.slice(0, 4);
                const filteredLawyers = matchResponse.match
                    ? lawyers.filter(l => l._id !== matchResponse.match._id)
                    : lawyers;
                setRecommendedLawyers(filteredLawyers);
            }
        } catch (err) {
            console.error('Failed to fetch recommendations', err);
        } finally {
            setFetchingLawyers(false);
        }
    };

    const handleConnectLawyer = async (lawyerId) => {
        const id = lawyerId?.toString();
        if (!id) return;
        setConnectLoading(prev => ({ ...prev, [id]: true }));
        try {
            const response = await authService.sendConnectionRequest(id);
            if (response.success) {
                alert('Connection request sent to this specialist!');
                setShowConnectPrompt(false);
            } else {
                alert(response.error || 'Failed to send request.');
            }
        } catch (err) {
            console.error('Connect error:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Error sending connection request.';
            alert(errorMsg);
        } finally {
            setConnectLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleCaseTypeSelect = (id) => {
        setFormData(prev => ({ ...prev, caseType: id }));
        fetchRecommendations(id);
    };

    const caseTypes = [
        { id: 'civil', name: 'Civil Case' },
        { id: 'criminal', name: 'Criminal Case' },
        { id: 'family', name: 'Family Law' },
        { id: 'corporate', name: 'Corporate Law' },
        { id: 'labor', name: 'Labor Law' },
        { id: 'intellectual', name: 'Intellectual Property' }
    ];

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.caseType) return alert('Please select a case type');
            if (files.length === 0) return alert('Please upload at least one document');
        }
        if (step === 2) {
            const required = ['title', 'client', 'clientEmail', 'clientPhone', 'opposingParty', 'court', 'jurisdiction', 'description'];
            if (required.some(field => !formData[field])) return alert('Please fill in all required fields');
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            files.forEach(file => {
                submitData.append('documents', file);
            });

            const response = await authService.fileCase(submitData);
            if (response.success) {
                setCaseRef(response.caseId || response.caseReference);
                setStep(4);
            } else {
                alert(response.message || 'Failed to file case. Please try again.');
            }
        } catch (error) {
            console.error('Filing error:', error);
            alert('Failed to file case. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="efiling-body">
            <div className="efiling-container">
                <header className="efiling-header">
                    <h1>📤 E-Filing Case</h1>
                    <p>Upload your legal documents and file your case digitally</p>
                </header>

                <div className="efiling-content">
                    <Link href="/client-dashboard" className="back-link" style={{ textDecoration: 'none', color: '#666', fontWeight: '600', marginBottom: '20px', display: 'inline-block' }}>← Back to Dashboard</Link>

                    <div className="efiling-layout">
                        <div className="efiling-main">
                            <div className="progress-steps">
                                {[1, 2, 3, 4].map(s => (
                                    <div key={s} className={`step ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
                                        <div className="step-number">{s}</div>
                                        <div className="step-label">
                                            {s === 1 ? 'Upload' : s === 2 ? 'Details' : s === 3 ? 'Review' : 'Progress'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {step === 1 && (
                                <div className="form-section active">
                                    <div className="form-group">
                                        <label>Select Case Type *</label>
                                        <div className="case-type-grid">
                                            {caseTypes.map(ct => (
                                                <div
                                                    key={ct.id}
                                                    className={`case-type-card ${formData.caseType === ct.id ? 'active' : ''}`}
                                                    onClick={() => handleCaseTypeSelect(ct.id)}
                                                >
                                                    {ct.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.caseType && (
                                        <div className="recommendations-section fade-in">
                                            {fetchingLawyers ? (
                                                <div className="mini-loader">Analyzing your case for the perfect match...</div>
                                            ) : perfectMatch ? (
                                                <div className="perfect-match-box">
                                                    <div className="match-header">
                                                        <div className="perfect-badge">✨ PERFECT 98% MATCH</div>
                                                        <div className="match-title">Based on your case description, we recommend:</div>
                                                    </div>
                                                    <div className="perfect-lawyer-card">
                                                        <div className="lawyer-main-info">
                                                            <div className="perfect-avatar">
                                                                {perfectMatch.personalInfo?.profilePicture ? (
                                                                    <img src={`/api/${perfectMatch.personalInfo.profilePicture}`} alt={perfectMatch.fullName} />
                                                                ) : (
                                                                    <span>{perfectMatch.fullName?.charAt(0)}</span>
                                                                )}
                                                            </div>
                                                            <div className="lawyer-details">
                                                                <h3 style={{ color: '#c19651' }}>{perfectMatch.fullName}</h3>
                                                                <div className="specialty-tags">
                                                                    <span className="spec-tag">{perfectMatch.specialization}</span>
                                                                    {perfectMatch.matchDetails?.map((detail, idx) => (
                                                                        <span key={idx} className="spec-tag-match">{detail}</span>
                                                                    ))}
                                                                </div>
                                                                <div className="experience-line">💼 {perfectMatch.professionalInfo?.yearsOfExperience || 0} Years Experience • 📍 {perfectMatch.personalInfo?.city || 'Local'}</div>
                                                            </div>
                                                        </div>
                                                        <div className="perfect-actions">
                                                            <div className="rating-wrap">
                                                                <span className="stars">★ {perfectMatch.ratings?.averageRating || 0}</span>
                                                                <span className="reviews">({perfectMatch.ratings?.totalReviews || 0} reviews)</span>
                                                            </div>
                                                            <button
                                                                className={`btn-perfect-connect ${connectLoading[perfectMatch._id] ? 'loading' : ''}`}
                                                                onClick={() => handleConnectLawyer(perfectMatch._id)}
                                                                disabled={connectLoading[perfectMatch._id]}
                                                            >
                                                                {connectLoading[perfectMatch._id] ? '...' : 'Connect Now'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}

                                            <div className="section-header" style={{ marginTop: perfectMatch ? '30px' : '0' }}>
                                                <label>Other {formData.caseType.charAt(0).toUpperCase() + formData.caseType.slice(1)} Specialists</label>
                                                {recommendedLawyers.length > 0 && (
                                                    <Link
                                                        href={`/search-lawyers?practiceArea=${encodeURIComponent(
                                                            {
                                                                'civil': 'Civil Law',
                                                                'criminal': 'Criminal Law',
                                                                'family': 'Family Law',
                                                                'corporate': 'Corporate Law',
                                                                'labor': 'Labor Law',
                                                                'intellectual': 'Intellectual Property'
                                                            }[formData.caseType] || formData.caseType
                                                        )}`}
                                                        className="view-all-link"
                                                    >
                                                        Browse All Lawyers →
                                                    </Link>
                                                )}
                                            </div>

                                            {!fetchingLawyers && recommendedLawyers.length > 0 ? (
                                                <div className="lawyer-recommendation-grid">
                                                    {recommendedLawyers.map(lawyer => (
                                                        <div key={lawyer._id} className="lawyer-mini-card">
                                                            <div className="lawyer-avatar">
                                                                {lawyer.personalInfo?.profilePicture ? (
                                                                    <img src={`/api/${lawyer.personalInfo.profilePicture}`} alt={lawyer.fullName} />
                                                                ) : (
                                                                    <span>{lawyer.fullName?.charAt(0)}</span>
                                                                )}
                                                            </div>
                                                            <div className="lawyer-min-info">
                                                                <h4>{lawyer.fullName}</h4>
                                                                <div className="rating-badge">★ {lawyer.ratings?.averageRating || 0} ({lawyer.ratings?.totalReviews || 0} reviews)</div>
                                                                <button
                                                                    className={`btn-mini-connect ${connectLoading[lawyer._id] ? 'loading' : ''}`}
                                                                    onClick={() => handleConnectLawyer(lawyer._id)}
                                                                    disabled={connectLoading[lawyer._id]}
                                                                >
                                                                    {connectLoading[lawyer._id] ? '...' : 'Connect'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Link
                                                    className="no-lawyers-cta"
                                                    href={`/search-lawyers?practiceArea=${encodeURIComponent(
                                                        {
                                                            'civil': 'Civil Law',
                                                            'criminal': 'Criminal Law',
                                                            'family': 'Family Law',
                                                            'corporate': 'Corporate Law',
                                                            'labor': 'Labor Law',
                                                            'intellectual': 'Intellectual Property'
                                                        }[formData.caseType] || formData.caseType
                                                    )}`}
                                                >
                                                    Browse Lawyers →
                                                </Link>
                                            )}
                                        </div>
                                    )}

                                    <div className="form-group" style={{ marginTop: '30px' }}>
                                        <label>Upload Legal Documents *</label>
                                        <div className="upload-dropzone" onClick={() => document.getElementById('file-input').click()} style={{ cursor: 'pointer' }}>
                                            <span className="upload-icon">📁</span>
                                            <p>Click to upload or drag and drop</p>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>PDF, DOC, DOCX (Max 10MB)</p>
                                            <input type="file" id="file-input" multiple style={{ display: 'none' }} onChange={handleFileChange} />
                                        </div>
                                        <div className="file-list">
                                            {files.map((file, i) => (
                                                <div key={i} className="file-item">
                                                    <span style={{ color: '#333' }}>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                                    <button className="btn-remove-file" onClick={() => removeFile(i)}>Remove</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="form-section active">
                                    <div className="form-group">
                                        <label>Case Title *</label>
                                        <input id="title" className="profile-input" value={formData.title} onChange={handleInputChange} placeholder="e.g. Property Dispute" style={{ color: '#333' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label>Full Name *</label>
                                            <input id="client" className="profile-input" value={formData.client} onChange={handleInputChange} style={{ color: '#333' }} />
                                        </div>
                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input id="clientEmail" type="email" className="profile-input" value={formData.clientEmail} onChange={handleInputChange} style={{ color: '#333' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label>Phone *</label>
                                            <input id="clientPhone" className="profile-input" value={formData.clientPhone} onChange={handleInputChange} style={{ color: '#333' }} />
                                        </div>
                                        <div className="form-group">
                                            <label>Filing Date *</label>
                                            <input id="filingDate" type="date" className="profile-input" value={formData.filingDate} onChange={handleInputChange} style={{ color: '#333' }} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Opposing Party *</label>
                                        <input id="opposingParty" className="profile-input" value={formData.opposingParty} onChange={handleInputChange} style={{ color: '#333' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label>Court Name *</label>
                                            <input id="court" className="profile-input" value={formData.court} onChange={handleInputChange} style={{ color: '#333' }} />
                                        </div>
                                        <div className="form-group">
                                            <label>Jurisdiction *</label>
                                            <input id="jurisdiction" className="profile-input" value={formData.jurisdiction} onChange={handleInputChange} style={{ color: '#333' }} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description *</label>
                                        <textarea id="description" className="profile-input" style={{ height: '120px', color: '#333' }} value={formData.description} onChange={handleInputChange} />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="form-section active">
                                    <div className="summary-grid">
                                        <div className="summary-item"><label>Case Type</label><p style={{ color: '#333' }}>{formData.caseType}</p></div>
                                        <div className="summary-item"><label>Title</label><p style={{ color: '#333' }}>{formData.title}</p></div>
                                        <div className="summary-item"><label>Client</label><p style={{ color: '#333' }}>{formData.client}</p></div>
                                        <div className="summary-item"><label>Email</label><p style={{ color: '#333' }}>{formData.clientEmail}</p></div>
                                        <div className="summary-item"><label>Files</label><p style={{ color: '#333' }}>{files.length} documents</p></div>
                                        <div className="summary-item"><label>Court</label><p style={{ color: '#333' }}>{formData.court}</p></div>
                                    </div>
                                    <div style={{ marginTop: '30px', padding: '20px', background: '#fff3cd', borderLeft: '4px solid #ffc107', borderRadius: '8px', color: '#856404' }}>
                                        <strong>⚠️ Important:</strong> Please review all information. Once submitted, your case will be assigned to a lawyer.
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="form-section active" style={{ textAlign: 'center', padding: '40px 0' }}>
                                    {loading ? (
                                        <div>
                                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                                            <p style={{ marginTop: '20px', color: '#c19651' }}>Processing your case filing...</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: '4rem', color: '#10b981', marginBottom: '20px' }}>✓</div>
                                            <h2 style={{ color: '#10b981', marginBottom: '10px' }}>Case Successfully Filed!</h2>
                                            <p style={{ color: '#333' }}>Your case reference number is: <strong>{caseRef}</strong></p>
                                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
                                                <button className="btn-efiling btn-efiling-next" onClick={() => router.push('/client-dashboard')}>Dashboard</button>
                                                <button className="btn-efiling btn-efiling-prev" onClick={() => router.push('/client-my-cases')}>My Cases</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step < 4 && (
                                <div className="efiling-footer">
                                    <button
                                        className="btn-efiling btn-efiling-prev"
                                        onClick={() => setStep(prev => prev - 1)}
                                        disabled={step === 1}
                                    >
                                        Previous
                                    </button>
                                    {step < 3 ? (
                                        <button className="btn-efiling btn-efiling-next" onClick={nextStep}>Next</button>
                                    ) : (
                                        <button className="btn-efiling btn-efiling-next" onClick={handleSubmit}>Submit Case</button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="efiling-sidebar">
                            <div className="benefit-card">
                                <h3>🚀 Why E-File?</h3>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    <li><strong>Faster Processing:</strong> Digital filing speeds up the legal proceedings.</li>
                                    <li><strong>24/7 Access:</strong> File your case anytime, anywhere.</li>
                                    <li><strong>Real-time Tracking:</strong> Get instant updates on your case status.</li>
                                    <li><strong>Eco-friendly:</strong> Reduce paperwork and save trees.</li>
                                </ul>
                            </div>
                            <div className="help-card">
                                <h3>❓ Need Help?</h3>
                                <p>Our support team is available 24/7 to assist you with the filing process.</p>
                                <button className="btn-help" onClick={() => router.push('/chatbot')}>Chat with Assistant</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Prompt Modal */}
            {showConnectPrompt && selectedLawyer && (
                <div className="modal-overlay fade-in">
                    <div className="connection-prompt-modal">
                        <div className="modal-icon">🤝</div>
                        <h3>Professional Recommendation</h3>
                        <p>
                            We've found a highly-rated specialist, <strong>{selectedLawyer.fullName}</strong>,
                            who specializes in <strong>{formData.caseType.charAt(0).toUpperCase() + formData.caseType.slice(1)} Law</strong>.
                        </p>
                        <p className="modal-subtext">
                            Would you like us to automatically send a professional message to connect and discuss your case?
                        </p>

                        <div className="professional-preview">
                            <span className="preview-label">Message Preview:</span>
                            <div className="preview-content">
                                "Dear {selectedLawyer.fullName}, I am initiating a {formData.caseType} filing via the Lawwise portal and your expertise has been recommended for this matter. I would appreciate the opportunity to discuss my case and potential representation with you."
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-modal-yes"
                                onClick={() => {
                                    handleConnectLawyer(selectedLawyer._id);
                                    setShowConnectPrompt(false);
                                }}
                            >
                                Yes, Connect
                            </button>
                            <button
                                className="btn-modal-no"
                                onClick={() => setShowConnectPrompt(false)}
                            >
                                No, I'll Choose Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientEFilingPage;

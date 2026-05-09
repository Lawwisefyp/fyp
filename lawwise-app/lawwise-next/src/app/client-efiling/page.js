'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/api';
import ClientSidebar from '@/components/ClientSidebar';
import '@/styles/ClientEFiling.css';

const ClientEFilingPage = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    // ... existing state ...
    const [loading, setLoading] = useState(false);
    const [caseRef, setCaseRef] = useState(null);
    const [caseId, setCaseId] = useState(null);
    const [aiResult, setAiResult] = useState(null);
    const [suggestedLawyers, setSuggestedLawyers] = useState([]);
    const [formData, setFormData] = useState({
        caseType: '',
        title: '',
        client: '',
        clientEmail: '',
        clientPhone: '',
        filingDate: new Date().toISOString().split('T')[0],
        opponentDetails: '',
        court: '',
        location: '',
        description: '',
        budget: '',
        urgency: 'medium',
        consultationRequested: false,
        consultationDate: '',
        consultationTime: ''
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
            // Use the new assignLawyerToRequest instead of sendConnectionRequest
            const response = await authService.assignLawyerToRequest(caseRef, id);
            if (response.success) {
                alert('Your case request has been sent directly to this lawyer for review!');
                setShowConnectPrompt(false);
                // Update local state to show pending status
                setSuggestedLawyers(prev => prev.map(l => 
                    l._id === lawyerId ? { ...l, connectionStatus: 'pending' } : l
                ));
            } else {
                alert(response.error || 'Failed to send request.');
            }
        } catch (err) {
            console.error('Connect error:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Error sending request to lawyer.';
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
            const required = ['title', 'description', 'urgency', 'opponentDetails', 'location'];
            if (required.some(field => !formData[field])) return alert('Please fill in all required fields');
        }
        if (step === 2) {
            if (files.length === 0) return alert('Please upload at least one document as evidence');
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'caseType') {
                    submitData.append('category', formData[key]);
                } else {
                    submitData.append(key, formData[key]);
                }
            });
            // Also append budget explicitly if needed, but the loop above handles it.
            // Ensure consultationRequested is a string if sending via FormData
            submitData.set('consultationRequested', formData.consultationRequested.toString());
            
            files.forEach(file => {
                submitData.append('documents', file);
            });

            const response = await authService.fileCaseRequest(submitData);
            if (response.success) {
                setCaseRef(response.requestId);
                setCaseId(response.caseId);
                setAiResult(response.analysis);
                setSuggestedLawyers(response.suggestedLawyers || []);
                setStep(4);
            } else {
                alert(response.message || 'Failed to submit request. Please try again.');
            }
        } catch (error) {
            console.error('Filing error:', error);
            alert('Failed to file case. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-body">
            <ClientSidebar />
            <div className="efiling-container" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <header className="efiling-header">
                    <h1>⚖️ Submit Legal Request</h1>
                    <p>Provide your case details for AI analysis and lawyer matching</p>
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
                                            {s === 1 ? 'Details' : s === 2 ? 'Evidence' : s === 3 ? 'Review' : 'Status'}
                                        </div>
                                    </div>
                                ))}
                            </div>


                            {step === 1 && (
                                <div className="fade-in">
                                    <div className="form-group">
                                        <label>Case Title *</label>
                                        <input id="title" className="profile-input" value={formData.title} onChange={handleInputChange} placeholder="e.g. Property Ownership Dispute" style={{ color: '#333' }} />
                                    </div>

                                    <div className="form-group">
                                        <label>Detailed Issue Description *</label>
                                        <textarea id="description" className="profile-input" style={{ height: '150px', color: '#333' }} value={formData.description} onChange={handleInputChange} placeholder="Describe your legal issue in detail..." />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label>Category (Optional)</label>
                                            <select id="caseType" className="profile-input" value={formData.caseType} onChange={handleInputChange} style={{ color: '#333' }}>
                                                <option value="">Select Category</option>
                                                <option value="civil">Civil</option>
                                                <option value="criminal">Criminal</option>
                                                <option value="family">Family</option>
                                                <option value="corporate">Corporate</option>
                                                <option value="labor">Labor</option>
                                                <option value="intellectual">Intellectual</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Urgency *</label>
                                            <select id="urgency" className="profile-input" value={formData.urgency} onChange={handleInputChange} style={{ color: '#333' }}>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Opponent Details *</label>
                                        <input id="opponentDetails" className="profile-input" value={formData.opponentDetails} onChange={handleInputChange} placeholder="Name, Contact, or Info of the opposing party" style={{ color: '#333' }} />
                                    </div>

                                    <div className="form-group">
                                        <label>Location / Jurisdiction *</label>
                                        <input id="location" className="profile-input" value={formData.location} onChange={handleInputChange} placeholder="City, District or Region" style={{ color: '#333' }} />
                                    </div>

                                    <div className="form-group">
                                        <label>Budget (PKR) - Optional</label>
                                        <input id="budget" type="number" className="profile-input" value={formData.budget} onChange={handleInputChange} placeholder="Maximum you are willing to pay" style={{ color: '#333' }} />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="fade-in">
                                    <div className="form-group">
                                        <label>Evidence & Initial Documents *</label>
                                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                                            Please upload any relevant documents, images, or PDFs that support your case request.
                                        </p>
                                        <div className="upload-dropzone" onClick={() => document.getElementById('file-input').click()} style={{ cursor: 'pointer' }}>
                                            <span className="upload-icon">📄</span>
                                            <p>Upload PDFs, Images, or Documents</p>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>Max 10MB per file</p>
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

                                    <div className="consultation-section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                                        <div className="form-group" style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    id="consultationRequested" 
                                                    checked={formData.consultationRequested} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, consultationRequested: e.target.checked }))}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                <span>I want to request a preliminary consultation</span>
                                            </label>
                                        </div>
                                        
                                        {formData.consultationRequested && (
                                            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                                                <div className="form-group">
                                                    <label>Preferred Date</label>
                                                    <input id="consultationDate" type="date" className="profile-input" value={formData.consultationDate} onChange={handleInputChange} style={{ color: '#333' }} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Preferred Time</label>
                                                    <input id="consultationTime" type="time" className="profile-input" value={formData.consultationTime} onChange={handleInputChange} style={{ color: '#333' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="form-section active">
                                    <div className="summary-grid">
                                        <div className="summary-item"><label>Case Type</label><p style={{ color: '#333' }}>{formData.caseType}</p></div>
                                        <div className="summary-item"><label>Title</label><p style={{ color: '#333' }}>{formData.title}</p></div>
                                        <div className="summary-item"><label>Urgency</label><p style={{ color: '#333', textTransform: 'capitalize' }}>{formData.urgency}</p></div>
                                        <div className="summary-item"><label>Location</label><p style={{ color: '#333' }}>{formData.location}</p></div>
                                        <div className="summary-item"><label>Opponent</label><p style={{ color: '#333' }}>{formData.opponentDetails}</p></div>
                                        <div className="summary-item"><label>Budget</label><p style={{ color: '#333' }}>PKR {formData.budget || 0}</p></div>
                                        <div className="summary-item" style={{ gridColumn: 'span 2' }}><label>Description</label><p style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{formData.description}</p></div>
                                        <div className="summary-item"><label>Consultation</label><p style={{ color: '#333' }}>{formData.consultationRequested ? `Requested for ${formData.consultationDate} at ${formData.consultationTime}` : 'Not Requested'}</p></div>
                                        <div className="summary-item"><label>Evidence</label><p style={{ color: '#333' }}>{files.length} documents uploaded</p></div>
                                    </div>
                                    <div style={{ marginTop: '30px', padding: '20px', background: '#fff3cd', borderLeft: '4px solid #ffc107', borderRadius: '8px', color: '#856404' }}>
                                        <strong>ℹ️ Note:</strong> Your request will be analyzed by our AI system before being presented to matching lawyers.
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
                                            <div style={{ fontSize: '4rem', color: '#10b981', marginBottom: '20px' }}>⚖️</div>
                                            <h2 style={{ color: '#10b981', marginBottom: '10px' }}>Request Submitted & AI Analyzed!</h2>
                                            <p style={{ color: '#333' }}>Your official Case ID: <strong>{caseId}</strong></p>
                                            
                                            {aiResult && (
                                                <div className="ai-analysis-success fade-in" style={{ 
                                                    marginTop: '30px', 
                                                    padding: '25px', 
                                                    background: '#f0f9ff', 
                                                    border: '1px solid #bae6fd', 
                                                    borderRadius: '12px',
                                                    textAlign: 'left',
                                                    maxWidth: '800px',
                                                    margin: '30px auto'
                                                }}>
                                                    <h3 style={{ color: '#0369a1', borderBottom: '2px solid #e0f2fe', paddingBottom: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span>🤖</span> AI Intake Report & Recommended Specialists
                                                    </h3>
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Detected Category</label>
                                                            <p style={{ color: '#0f172a', fontWeight: '600', margin: '5px 0' }}>{aiResult.predictedCategory}</p>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Priority Level</label>
                                                            <p style={{ 
                                                                color: aiResult.predictedPriority?.toLowerCase().includes('high') ? '#ef4444' : '#0f172a', 
                                                                fontWeight: '600', 
                                                                margin: '5px 0' 
                                                            }}>
                                                                {aiResult.predictedPriority?.toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ marginBottom: '20px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>AI Legal Summary</label>
                                                        <p style={{ color: '#334155', fontStyle: 'italic', margin: '5px 0', lineHeight: '1.5' }}>
                                                            "{aiResult.aiSummary}"
                                                        </p>
                                                    </div>

                                                    {suggestedLawyers.length > 0 && (
                                                        <div style={{ marginTop: '25px' }}>
                                                            <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '15px' }}>Top Matching Specialists for this Case</label>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                                {suggestedLawyers.map(lawyer => (
                                                                    <div key={lawyer._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#c19651', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                                                            {lawyer.personalInfo?.profilePicture ? (
                                                                                <img src={`/api/${lawyer.personalInfo.profilePicture}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                                                            ) : (
                                                                                lawyer.fullName.charAt(0)
                                                                            )}
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lawyer.fullName}</h4>
                                                                            <p style={{ margin: '2px 0', fontSize: '0.75rem', color: '#64748b' }}>{lawyer.specialization}</p>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                                                                                <span style={{ fontSize: '0.75rem', color: '#eab308' }}>★ {lawyer.ratings?.averageRating || 0}</span>
                                                                                {lawyer.connectionStatus === 'accepted' ? (
                                                                                    <button 
                                                                                        className="btn-mini-connect" 
                                                                                        onClick={() => router.push(`/client-communication?userId=${lawyer._id}`)}
                                                                                        style={{ padding: '2px 8px', fontSize: '0.7rem', background: '#10b981' }}
                                                                                    >
                                                                                        Message
                                                                                    </button>
                                                                                ) : (
                                                                                    <button 
                                                                                        className={`btn-mini-connect ${lawyer.connectionStatus === 'pending' ? 'status-pending' : ''}`} 
                                                                                        onClick={() => (lawyer.connectionStatus === 'not_connected' || lawyer.connectionStatus === 'rejected' || lawyer.connectionStatus === 'none') && handleConnectLawyer(lawyer._id)}
                                                                                        disabled={lawyer.connectionStatus === 'pending' || connectLoading[lawyer._id]}
                                                                                        style={{ 
                                                                                            padding: '2px 8px', 
                                                                                            fontSize: '0.7rem',
                                                                                            background: lawyer.connectionStatus === 'pending' ? '#f59e0b' : 
                                                                                                        lawyer.connectionStatus === 'rejected' ? '#3b82f6' : '#c19651'
                                                                                        }}
                                                                                    >
                                                                                        {lawyer.connectionStatus === 'pending' ? 'Pending' : 
                                                                                         lawyer.connectionStatus === 'rejected' ? 'Reconnect' : 'Connect'}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
                                                        {aiResult.aiKeywords?.map((kw, idx) => (
                                                            <span key={idx} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                                #{kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <p style={{ marginTop: '15px', color: '#666' }}>
                                                Your request has been successfully analyzed and is now visible to our specialized legal panel.
                                            </p>
                                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
                                                <button className="btn-efiling btn-efiling-next" onClick={() => router.push('/client-dashboard')}>Go to Dashboard</button>
                                                <button className="btn-efiling btn-efiling-prev" onClick={() => router.push('/client-my-requests')}>My Requests</button>
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
                                        <button className="btn-efiling btn-efiling-next" onClick={nextStep}>Continue</button>
                                    ) : (
                                        <button className="btn-efiling btn-efiling-next" onClick={handleSubmit}>Submit Request</button>
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

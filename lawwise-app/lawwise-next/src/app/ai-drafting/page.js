'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import '@/styles/LawyerAIDrafting.css';

const LawyerAIDraftingPage = () => {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Select Template, 2: Fill Details, 3: Review & AI
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateFields, setTemplateFields] = useState({});
    const [enhanceClauses, setEnhanceClauses] = useState(true);

    const [details, setDetails] = useState('');
    const [title, setTitle] = useState('');
    const [files, setFiles] = useState([]);
    const [currentDraft, setCurrentDraft] = useState(null);
    const [myDrafts, setMyDrafts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [displayedContent, setDisplayedContent] = useState('');
    const typingIntervalRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (currentDraft && currentDraft.content) {
            startTypingEffect(currentDraft.content);
        } else {
            setDisplayedContent('');
        }
    }, [currentDraft]);

    const loadData = async () => {
        try {
            const [draftsData, templatesData] = await Promise.all([
                authService.getMyDrafts(),
                authService.getTemplates()
            ]);
            if (draftsData.success) setMyDrafts(draftsData.drafts);
            if (templatesData.success) setTemplates(templatesData.templates);
        } catch (err) {
            console.error('Failed to load initial data', err);
        }
    };

    const startTypingEffect = (text) => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setDisplayedContent('');
        let i = 0;
        const speed = 2; // Faster typing for better UX
        typingIntervalRef.current = setInterval(() => {
            if (i < text.length) {
                setDisplayedContent(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(typingIntervalRef.current);
            }
        }, speed);
    };

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        const initialFields = {};
        if (template.fields) {
            template.fields.forEach(f => {
                initialFields[f.name] = f.type === 'boolean' ? false : '';
            });
        }
        setTemplateFields(initialFields);
        setStep(2);
    };

    const handleFieldChange = (name, value) => {
        setTemplateFields(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();

        // Basic Validation
        if (!details.trim()) {
            setError('Please provide case facts or situation details.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        setCurrentDraft(null);

        const formData = new FormData();
        formData.append('templateId', selectedTemplate?._id || '');
        formData.append('formData', JSON.stringify(templateFields));
        formData.append('details', details);
        formData.append('title', title || (selectedTemplate ? selectedTemplate.name : 'Legal Draft'));
        formData.append('enhanceClauses', enhanceClauses);
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const data = await authService.generateDraft(formData);
            if (data.success) {
                setCurrentDraft(data.draft);
                setMyDrafts([data.draft, ...myDrafts]);
                setMessage('Drafting Agent successfully synthesized the document.');
                setStep(3);
                setDisplayedContent(''); // Reset for typing effect
            } else {
                setError(data.error || 'Agent execution failed.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'AI Generation failed. The Drafting Agent could not process the request.');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async () => {
        if (!currentDraft) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('lawyerToken') || sessionStorage.getItem('lawyerToken');
            const response = await fetch(`/api/drafting/${currentDraft._id}/review`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setMessage('AI Audit complete. Review results displayed in terminal.');
                setDisplayedContent(prev => prev + "\n\n--- AI AUDIT RESULTS ---\n" + data.reviewNotes);
            }
        } catch (err) {
            setError('Review failed.');
        } finally {
            setLoading(false);
        }
    };

    const exportToWord = async () => {
        if (!currentDraft) return;
        try {
            const token = localStorage.getItem('lawyerToken') || sessionStorage.getItem('lawyerToken');
            const response = await fetch(`/api/drafting/export/${currentDraft._id}/docx`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentDraft.title || 'Legal_Draft'}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed', err);
            setError('Failed to export document.');
        }
    };

    const convertToCase = () => {
        if (!currentDraft) return;
        const caseData = {
            caseType: currentDraft.documentType.toLowerCase(),
            caseTitle: currentDraft.title,
            description: currentDraft.details
        };
        sessionStorage.setItem('prefilledCase', JSON.stringify(caseData));
        router.push('/client-efiling'); // Adjusted for Next.js
    };

    const renderStep1 = () => {
        const categories = [...new Set(templates.map(t => t.type))];

        return (
            <div className="wizard-step">
                <h2 className="panel-title">Step 1: Select Drafting Category</h2>
                <div className="drafting-library">
                    {categories.map(cat => (
                        <div key={cat} className="category-section">
                            <h3 className="category-title">{cat}s</h3>
                            <div className="template-grid">
                                {templates.filter(t => t.type === cat).map(t => (
                                    <div key={t._id} className="template-card" onClick={() => handleTemplateSelect(t)}>
                                        <div className="template-icon">📄</div>
                                        <h4>{t.name}</h4>
                                        <p>{t.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="category-section">
                        <h3 className="category-title">Custom</h3>
                        <div className="template-grid">
                            <div className="template-card custom" onClick={() => { setSelectedTemplate(null); setStep(2); }}>
                                <div className="template-icon">✍️</div>
                                <h4>Custom Private Draft</h4>
                                <p>Generate from absolute scratch.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep2 = () => (
        <div className="wizard-step">
            <h2 className="panel-title">Step 2: Directive Details</h2>
            <div className="template-context-alert">
                Synthesizing: <strong>{selectedTemplate?.name || 'Custom Private Draft'}</strong>
            </div>

            <div className="form-group">
                <label>Document Title <span className="req">*</span></label>
                <input
                    type="text"
                    className="modern-input"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={selectedTemplate ? `Draft: ${selectedTemplate.name}` : "e.g. Legal Notice to X"}
                />
            </div>

            <div className="form-group">
                <label>Case Facts / Situation Details <span className="req">*</span></label>
                <textarea
                    rows="10"
                    className="modern-textarea large-area"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide all facts, party names, dates, and instructions here. The Agent will synthesize this into the professional legal syntax of the chosen document type."
                    required
                />
            </div>

            <div className="form-group toggle-group">
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={enhanceClauses}
                        onChange={e => setEnhanceClauses(e.target.checked)}
                    />
                    <span>Advanced AI Clause Synthesis (Enforce Professional Boilerplate)</span>
                </label>
            </div>

            <div className="file-upload-zone">
                <label>Reference Evidence / Drafts (Optional)</label>
                <input type="file" multiple onChange={handleFileChange} />
                <p className="hint-text">Upload documents for higher accuracy and context.</p>
            </div>

            <div className="wizard-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
                    {loading ? <div className="spinner"></div> : '🚀 SYNTHESIZE DRAFT'}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="wizard-step">
            <h2 className="panel-title">Step 3: Review & Finalize</h2>
            <div className="review-meta">
                <div><strong>Draft:</strong> {currentDraft?.title}</div>
                <div><strong>Method:</strong> {currentDraft?.metadata?.agentUsed}</div>
            </div>
            <div className="wizard-actions vertical">
                <button className="btn-audit" onClick={handleReview} disabled={loading}>
                    {loading ? <div className="spinner"></div> : '🔍'} Scan for Inconsistencies
                </button>
                <div className="flex-row">
                    <button className="btn-secondary" onClick={() => setStep(2)}>Adjust Details</button>
                    <button className="btn-primary" onClick={() => { setStep(1); setCurrentDraft(null); }}>New Draft</button>
                </div>
            </div>
        </div>
    );

    const parseMarkdown = (text) => {
        if (!text) return '';
        // Simple regex for bold **text**
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Simple regex for headers ### Header
        html = html.replace(/^### (.*$)/gim, '<strong>$1</strong>');
        return html;
    };

    return (
        <div className="drafting-body">
            <div className="drafting-container">
                <header className="drafting-header">
                    <h1>Legal Intelligence Agent</h1>
                    <p>Elite AI-driven document synthesis and case integration</p>
                    <div className="wizard-progress">
                        <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                        <div className="progress-line"></div>
                        <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                        <div className="progress-line"></div>
                        <div className={`progress-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                    </div>
                </header>

                <div className="drafting-grid">
                    <div className="control-panel">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}

                        {error && <div className="alert-error">⚠️ {error}</div>}
                        {message && <div className="alert-success">✓ {message}</div>}

                        <div className="history-section">
                            <h3 className="history-title">Recent Directives</h3>
                            <div className="history-list">
                                {myDrafts.length === 0 ? (
                                    <p className="no-history">No drafting history found.</p>
                                ) : (
                                    myDrafts.map(draft => (
                                        <div
                                            key={draft._id}
                                            className={`history-item ${currentDraft?._id === draft._id ? 'active' : ''}`}
                                            onClick={() => { setCurrentDraft(draft); setStep(3); }}
                                        >
                                            <div className="hist-title">{draft.title}</div>
                                            <div className="hist-meta">
                                                {draft.documentType} • {new Date(draft.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="ai-console">
                        <div className="console-header">
                            <div className="console-title">
                                <span>&gt;</span> LEGAL_SYNTHESIS_TERMINAL_V1.0
                            </div>
                            {currentDraft && (
                                <div className="console-actions">
                                    <button onClick={exportToWord} className="btn-action btn-export">📄 DOC</button>
                                    <button onClick={convertToCase} className="btn-action btn-convert">⚖️ File Case</button>
                                </div>
                            )}
                        </div>

                        <div className="console-content">
                            {!currentDraft && !loading ? (
                                <div className="console-placeholder">
                                    <div className="placeholder-icon">🤖</div>
                                    <p>Ready for Directive. Please follow the wizard.</p>
                                </div>
                            ) : loading && !currentDraft ? (
                                <div className="console-placeholder">
                                    <div className="spinner-large"></div>
                                    <p className="loading-text">Agent is synthesizing legal framework...</p>
                                </div>
                            ) : (
                                <div
                                    className="draft-text whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{
                                        __html: parseMarkdown(displayedContent) + (displayedContent.length < (currentDraft?.content?.length || 0) ? '<span class="cursor-blink">▊</span>' : '')
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LawyerAIDraftingPage;

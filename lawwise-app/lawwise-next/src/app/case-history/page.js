'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Eye,
    Clock,
    FileText,
    Paperclip,
    CheckCircle2,
    Download,
    Share2,
    MessageCircle,
    X,
    Trash2
} from 'lucide-react';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import '@/styles/LawyerCaseHistory.css';
import '@/styles/Dashboard.css';

const LawyerCaseHistoryPage = () => {
    const [cases, setCases] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null); // { url, name, type }

    const getToken = () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('lawyerToken') ||
            sessionStorage.getItem('lawyerToken') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token');
    };

    // Form States
    const [newCase, setNewCase] = useState({
        title: '',
        client: '',
        clientEmail: '',
        caseType: 'civil',
        priority: 'medium',
        filingDate: '',
        opposingParty: '',
        description: '',
        court: '',
        jurisdiction: '',
        reminders: [] // Initial reminders
    });

    const [reminderForm, setReminderForm] = useState({
        title: '',
        dueDate: '',
        description: '',
        files: []
    });

    const router = useRouter();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            setLoading(true);
            const data = await authService.getCases();
            if (data.success) {
                setCases(data.cases);
            }
        } catch (error) {
            console.error('Failed to fetch cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCase = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            // 1. Create the case
            const caseRes = await authService.createCase({
                ...newCase,
                reminders: undefined // Don't send file objects in JSON
            });

            if (caseRes.success) {
                const caseId = caseRes.case.id;

                // 2. Upload initial reminders
                if (newCase.reminders.length > 0) {
                    for (const rem of newCase.reminders) {
                        const formData = new FormData();
                        formData.append('title', rem.title);
                        formData.append('dueDate', rem.dueDate);
                        formData.append('description', rem.description || '');
                        if (rem.files && rem.files.length > 0) {
                            for (let i = 0; i < rem.files.length; i++) {
                                formData.append('documents', rem.files[i]);
                            }
                        }
                        await authService.addReminder(caseId, formData);
                    }
                }

                setShowAddModal(false);
                fetchCases();
                setNewCase({
                    title: '', client: '', clientEmail: '', caseType: 'civil',
                    priority: 'medium', filingDate: '', opposingParty: '',
                    description: '', court: '', jurisdiction: '', reminders: []
                });
            }
        } catch (error) {
            alert('Failed to create case: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const addInitialReminderField = () => {
        setNewCase({
            ...newCase,
            reminders: [...newCase.reminders, { title: '', dueDate: '', description: '', files: [] }]
        });
    };

    const removeInitialReminderField = (index) => {
        const updated = [...newCase.reminders];
        updated.splice(index, 1);
        setNewCase({ ...newCase, reminders: updated });
    };

    const updateInitialReminder = (index, field, value) => {
        const updated = [...newCase.reminders];
        updated[index][field] = value;
        setNewCase({ ...newCase, reminders: updated });
    };

    const handleShare = (caseId, filename) => {
        const url = `${window.location.origin}/api/cases/${caseId}/documents/${filename}`;
        navigator.clipboard.writeText(url);
        alert('Document link copied to clipboard!');
    };

    const handleWhatsAppShare = (caseId, filename, originalName) => {
        const url = `${window.location.origin}/api/cases/${caseId}/documents/${filename}`;
        const message = `Check out this document for case ${caseId}: ${originalName} - ${url}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handlePreview = async (caseId, doc) => {
        const url = `/api/cases/${caseId}/documents/${doc.filename}/view`;
        const extension = doc.originalName.split('.').pop().toLowerCase();

        if (['docx', 'doc'].includes(extension) && window.mammoth) {
            try {
                setLoading(true);
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (!response.ok) throw new Error(`Preview failed: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const result = await window.mammoth.convertToHtml({ arrayBuffer });
                setPreviewDoc({ url, name: doc.originalName, extension, htmlContent: result.value });
            } catch (error) {
                console.error('DOCX preview failed', error);
                setPreviewDoc({ url, name: doc.originalName, extension });
            } finally {
                setLoading(false);
            }
        } else if (extension === 'txt') {
            try {
                setLoading(true);
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (!response.ok) throw new Error(`Preview failed: ${response.status}`);
                const text = await response.text();
                setPreviewDoc({ url, name: doc.originalName, extension, textContent: text });
            } catch (error) {
                console.error('TXT preview failed', error);
                setPreviewDoc({ url, name: doc.originalName, extension });
            } finally {
                setLoading(false);
            }
        } else {
            setPreviewDoc({ url, name: doc.originalName, extension });
        }
    };

    const handleDownload = async (caseId, filename, originalName) => {
        try {
            const token = getToken();
            const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + `/api/cases/${caseId}/documents/${filename}`;

            console.log('Downloading from:', backendUrl);

            const response = await fetch(backendUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('Download response error:', response.status, errData);
                throw new Error(errData.error || errData.message || `HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed: ' + error.message + '\n\nPlease try refreshing or logging in again.');
        }
    };

    const handleAddReminder = async (e) => {
        e.preventDefault();
        if (!selectedCase) return;

        try {
            const formData = new FormData();
            formData.append('title', reminderForm.title);
            formData.append('dueDate', reminderForm.dueDate);
            formData.append('description', reminderForm.description);
            if (reminderForm.files && reminderForm.files.length > 0) {
                for (let i = 0; i < reminderForm.files.length; i++) {
                    formData.append('documents', reminderForm.files[i]);
                }
            }

            const data = await authService.addReminder(selectedCase.id, formData);
            if (data.success) {
                setShowReminderModal(false);
                setReminderForm({ title: '', dueDate: '', description: '', files: [] });
                // Refresh cases and selected case
                const updatedCases = await authService.getCases();
                if (updatedCases.success) {
                    setCases(updatedCases.cases);
                    const updated = updatedCases.cases.find(c => c.id === selectedCase.id);
                    setSelectedCase(updated);
                }
            }
        } catch (error) {
            alert('Failed to add reminder');
        }
    };

    const markReminderDone = async (reminderId) => {
        try {
            // Build a minimal patch: only pass the one reminder being marked done
            const updatedDeadlines = selectedCase.deadlines.map(d =>
                d._id === reminderId ? { ...d, isCompleted: true } : d
            );

            const data = await authService.updateCase(selectedCase.id, {
                deadlines: updatedDeadlines
            });

            if (data.success) {
                setSelectedCase(data.case);
                fetchCases();
            }
        } catch (error) {
            console.error('Failed to mark reminder as done', error);
        }
    };

    const handleCompleteCase = async () => {
        if (!selectedCase) return;
        if (!window.confirm('Mark this case as COMPLETED? This means the case is officially closed/disposed.')) return;

        try {
            setLoading(true);
            const data = await authService.updateCaseStatus(selectedCase.id, 'completed');
            if (data.success) {
                setSelectedCase(data.case);
                fetchCases();
                alert('✅ Case has been marked as COMPLETED.');
            }
        } catch (error) {
            console.error('Failed to complete case', error);
            alert('Failed to update case status.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCase = async () => {
        if (!selectedCase) return;
        if (!window.confirm('PERMANENTLY DELETE this case? This action cannot be undone and all associated documents will be removed.')) return;

        try {
            setLoading(true);
            const data = await authService.deleteCase(selectedCase.id);
            if (data.success) {
                setShowDetailModal(false);
                setSelectedCase(null);
                fetchCases();
                alert('Case deleted successfully.');
            }
        } catch (error) {
            console.error('Failed to delete case', error);
            alert('Failed to delete case: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReminder = async (reminderId) => {
        if (!window.confirm('Are you sure you want to delete this reminder? This will also delete any associated documents.')) return;

        try {
            const token = getToken();
            const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
            const response = await fetch(`${backendBase}/api/cases/${selectedCase.id}/reminders/${reminderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setSelectedCase(data.case);
                fetchCases();
            } else {
                alert('Failed to delete reminder: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete reminder error:', error);
            alert('Error deleting reminder');
        }
    };

    const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };

    const filteredCases = cases
        .filter(c =>
            c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.id?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const weightA = priorityWeight[a.priority?.toLowerCase()] || 0;
            const weightB = priorityWeight[b.priority?.toLowerCase()] || 0;
            return weightB - weightA;
        });

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return '#10b981'; // Emerald green
            case 'pending': return '#f59e0b'; // Amber
            case 'completed': return '#6366f1'; // Indigo/purple
            default: return '#64748b'; // Slate
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#64748b';
        }
    };

    return (
        <div className="dashboard-body">
            <LawyerSidebar />

            <div className="dashboard-main">
                <div className="case-history-container">

                    {/* Header Section */}
                    <div className="case-page-header">
                        <div className="header-text">
                            <h1>My Matters</h1>
                            <p>{cases.length} matters assigned to you</p>
                        </div>
                        <button className="btn-new-matter" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} />
                            NEW MATTER
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="case-toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search matters by ID, Title or Client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Matters Table */}
                    <div className="matters-table-container">
                        <table className="matters-table">
                            <thead>
                                <tr>
                                    <th>MATTER ID</th>
                                    <th>TITLE</th>
                                    <th>CLIENT</th>
                                    <th>TYPE</th>
                                    <th>STATUS</th>
                                    <th>NEXT HEARING</th>
                                    <th>PRIORITY</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="table-loader">Loading cases...</td></tr>
                                ) : filteredCases.length > 0 ? (
                                    filteredCases.map((c) => (
                                        <tr key={c.id}>
                                            <td className="col-id">{c.id}</td>
                                            <td className="col-title">{c.title}</td>
                                            <td className="col-client">{c.client}</td>
                                            <td className="col-type">
                                                <span className="type-badge">{c.caseType?.toUpperCase()}</span>
                                            </td>
                                            <td>
                                                <span className="status-indicator" style={{ '--dot-color': getStatusColor(c.realTimeStatus || c.status) }}>
                                                    {(c.realTimeStatus || c.status)?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="col-hearing">
                                                {c.nextHearingDate || '—'}
                                            </td>
                                            <td>
                                                <span className="priority-badge" style={{ '--bg-color': getPriorityColor(c.priority) + '20', '--text-color': getPriorityColor(c.priority) }}>
                                                    {c.priority?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-view-eye" onClick={() => { setSelectedCase(c); setShowDetailModal(true); }}>
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="8" className="table-empty">No matters found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-box glass-modal">
                        <div className="modal-header">
                            <h2>Create New Matter</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleCreateCase} className="modal-form">
                            <div className="form-group full-width">
                                <label>MATTER TITLE *</label>
                                <input
                                    type="text"
                                    placeholder="Plaintiff vs. Defendant"
                                    value={newCase.title}
                                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>CLIENT *</label>
                                    <input
                                        type="text"
                                        placeholder="Client Name"
                                        value={newCase.client}
                                        onChange={(e) => setNewCase({ ...newCase, client: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>CLIENT EMAIL</label>
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={newCase.clientEmail}
                                        onChange={(e) => setNewCase({ ...newCase, clientEmail: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>CASE TYPE</label>
                                    <select value={newCase.caseType} onChange={(e) => setNewCase({ ...newCase, caseType: e.target.value })}>
                                        <option value="civil">Civil Litigation</option>
                                        <option value="criminal">Criminal Defense</option>
                                        <option value="family">Family Law</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="labor">Labor & Employment</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>PRIORITY</label>
                                    <select value={newCase.priority} onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>FILING DATE</label>
                                    <input
                                        type="date"
                                        value={newCase.filingDate}
                                        onChange={(e) => setNewCase({ ...newCase, filingDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>OPPOSING PARTY</label>
                                    <input
                                        type="text"
                                        placeholder="Opponent name"
                                        value={newCase.opposingParty}
                                        onChange={(e) => setNewCase({ ...newCase, opposingParty: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>COURT</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. High Court"
                                        value={newCase.court}
                                        onChange={(e) => setNewCase({ ...newCase, court: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>JURISDICTION</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Islamabad"
                                        value={newCase.jurisdiction}
                                        onChange={(e) => setNewCase({ ...newCase, jurisdiction: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>CASE DESCRIPTION</label>
                                <textarea
                                    rows="3"
                                    placeholder="Brief description of the case..."
                                    value={newCase.description}
                                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Initial Reminders Section */}
                            <div className="initial-reminders-section">
                                <div className="section-header-mini">
                                    <label>INITIAL REMINDERS (OPTIONAL)</label>
                                    <button type="button" className="btn-add-mini" onClick={addInitialReminderField}>
                                        <Plus size={14} /> Add Reminder
                                    </button>
                                </div>

                                {newCase.reminders.map((rem, idx) => (
                                    <div key={idx} className="initial-reminder-box">
                                        <div className="rem-box-header">
                                            <span>Reminder #{idx + 1}</span>
                                            <button type="button" className="btn-remove-rem" onClick={() => removeInitialReminderField(idx)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>HEADING</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Hearing"
                                                    value={rem.title}
                                                    onChange={(e) => updateInitialReminder(idx, 'title', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>DATE</label>
                                                <input
                                                    type="date"
                                                    value={rem.dueDate}
                                                    onChange={(e) => updateInitialReminder(idx, 'dueDate', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>DOCUMENTS</label>
                                            <input
                                                type="file"
                                                multiple
                                                onChange={(e) => updateInitialReminder(idx, 'files', e.target.files)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Matter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && selectedCase && (
                <div className="modal-overlay">
                    <div className="modal-box detail-modal-wide">
                        <div className="modal-header">
                            <div className="title-with-badge">
                                <h2>{selectedCase.title}</h2>
                                <span className="case-id-badge">{selectedCase.id}</span>
                                {selectedCase.status === 'completed' && (
                                    <span className="closed-status-badge">CASE CLOSED</span>
                                )}
                            </div>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}><X /></button>
                        </div>

                        <div className="detail-content-grid">
                            <div className="detail-sidebar">
                                <div className="info-section">
                                    <label>Client Details</label>
                                    <div className="info-card">
                                        <p><strong>{selectedCase.client}</strong></p>
                                        <p>{selectedCase.clientEmail}</p>
                                        <p>{selectedCase.clientPhone || 'No phone'}</p>
                                    </div>
                                </div>
                                <div className="info-section">
                                    <label>Case Info</label>
                                    <div className="info-card">
                                        <p><span>Type:</span> {selectedCase.caseType?.toUpperCase()}</p>
                                        <p><span>Court:</span> {selectedCase.court}</p>
                                        <p><span>Jurisdiction:</span> {selectedCase.jurisdiction}</p>
                                        <p><span>Opponent:</span> {selectedCase.opposingParty}</p>
                                        <p><span>Filed:</span> {selectedCase.filingDate}</p>
                                    </div>
                                </div>
                                <div className="info-section">
                                    <label>Description</label>
                                    <div className="info-card description-box">
                                        <p>{selectedCase.description || 'No description provided.'}</p>
                                    </div>
                                </div>

                                {/* Case Management Actions */}
                                <div className="info-section action-section">
                                    <label>Case Management</label>
                                    <div className="action-buttons-stack">
                                        {selectedCase.status !== 'completed' && (
                                            <button className="btn-complete-case" onClick={handleCompleteCase}>
                                                <CheckCircle2 size={18} />
                                                CLOSE CASE (MARK COMPLETED)
                                            </button>
                                        )}
                                        <button className="btn-delete-case" onClick={handleDeleteCase}>
                                            <Trash2 size={18} />
                                            DELETE ENTIRE CASE
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-main">
                                <div className="section-header">
                                    <h3>Reminders & Hearings</h3>
                                    {selectedCase.status !== 'completed' && (
                                        <button className="btn-add-mini" onClick={() => setShowReminderModal(true)}>
                                            <Plus size={14} /> Add Reminder
                                        </button>
                                    )}
                                </div>

                                <div className="reminders-list">
                                    {selectedCase.deadlines && selectedCase.deadlines.length > 0 ? (
                                        selectedCase.deadlines.map((rem, idx) => (
                                            <div key={idx} className={`reminder-item ${rem.isCompleted ? 'completed' : ''}`}>
                                                <div className="rem-header">
                                                    <div className="rem-title-block">
                                                        <Clock size={16} className="icon" />
                                                        <span className="rem-title">
                                                            {rem.title}
                                                            {rem.isCompleted && <span className="done-label">DONE</span>}
                                                        </span>
                                                    </div>
                                                    <div className="rem-meta-right">
                                                        <span className="rem-date">{rem.dueDate}</span>
                                                        {selectedCase.status !== 'completed' && (
                                                            <button
                                                                className="btn-delete-rem-mini"
                                                                onClick={() => handleDeleteReminder(rem._id)}
                                                                title="Delete Reminder"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="rem-desc">{rem.description}</p>

                                                {rem.documents && rem.documents.length > 0 && (
                                                    <div className="rem-docs-expanded">
                                                        {rem.documents.map((doc, dIdx) => (
                                                            <div key={dIdx} className="expanded-doc-row">
                                                                <div className="doc-left clickable" onClick={() => handlePreview(selectedCase.id, doc)}>
                                                                    <FileText size={16} />
                                                                    <span className="doc-name-text">{doc.originalName}</span>
                                                                </div>
                                                                <div className="doc-right-actions">
                                                                    <button
                                                                        className="btn-doc-icon preview"
                                                                        onClick={() => handlePreview(selectedCase.id, doc)}
                                                                        title="View on screen"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                    <button
                                                                        className="btn-doc-icon"
                                                                        onClick={() => handleDownload(selectedCase.id, doc.filename, doc.originalName)}
                                                                        title="Download"
                                                                    >
                                                                        <Download size={14} />
                                                                    </button>
                                                                    <button
                                                                        className="btn-doc-icon whatsapp"
                                                                        onClick={() => handleWhatsAppShare(selectedCase.id, doc.filename, doc.originalName)}
                                                                        title="Share on WhatsApp"
                                                                    >
                                                                        <MessageCircle size={14} />
                                                                    </button>
                                                                    <button
                                                                        className="btn-doc-icon"
                                                                        onClick={() => handleShare(selectedCase.id, doc.filename)}
                                                                        title="Copy Link"
                                                                    >
                                                                        <Share2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {!rem.isCompleted && selectedCase.status !== 'completed' && (
                                                    <button className="btn-mark-done-inline" onClick={() => markReminderDone(rem._id)}>
                                                        <CheckCircle2 size={14} /> Mark as Done
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-reminders">No reminders set for this case.</div>
                                    )}
                                </div>

                                <div className="section-header">
                                    <h3>Case Documents</h3>
                                </div>
                                <div className="docs-grid">
                                    {selectedCase.documents?.map((doc, idx) => (
                                        <div key={idx} className="doc-card-mini">
                                            <FileText size={20} className="doc-icon" />
                                            <div className="doc-info">
                                                <span className="doc-name">{doc.originalName}</span>
                                                <button
                                                    className="btn-doc-icon-mini"
                                                    onClick={() => handleDownload(selectedCase.id, doc.filename, doc.originalName)}
                                                >
                                                    <Download size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showReminderModal && (
                <div className="modal-overlay mini-overlay">
                    <div className="modal-box reminder-modal">
                        <div className="modal-header">
                            <h3>Add New Reminder</h3>
                            <button className="close-btn" onClick={() => setShowReminderModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleAddReminder} className="modal-form">
                            <div className="form-group">
                                <label>REMINDER HEADING</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Final Evidence Submission"
                                    value={reminderForm.title}
                                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>REMINDER DATE</label>
                                <input
                                    type="date"
                                    value={reminderForm.dueDate}
                                    onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>DESCRIPTION</label>
                                <textarea
                                    rows="2"
                                    placeholder="Details about this reminder..."
                                    value={reminderForm.description}
                                    onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>ATTACH DOCUMENTS</label>
                                <div className="file-upload-box">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => setReminderForm({ ...reminderForm, files: e.target.files })}
                                    />
                                    <div className="upload-prompt">
                                        <Paperclip size={20} />
                                        <span>Click to upload related documents</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn-save full-btn">Add Reminder</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="modal-overlay preview-overlay" onClick={() => setPreviewDoc(null)}>
                    <div className="preview-container" onClick={e => e.stopPropagation()}>
                        <div className="preview-header">
                            <h3>{previewDoc.name}</h3>
                            <button className="close-btn" onClick={() => setPreviewDoc(null)}><X /></button>
                        </div>
                        <div className="preview-body">
                            {previewDoc.htmlContent ? (
                                <div className="docx-preview-wrapper" dangerouslySetInnerHTML={{ __html: previewDoc.htmlContent }}></div>
                            ) : previewDoc.textContent ? (
                                <div className="txt-preview-wrapper">
                                    <pre>{previewDoc.textContent}</pre>
                                </div>
                            ) : ['pdf'].includes(previewDoc.extension) ? (
                                <iframe src={previewDoc.url} width="100%" height="100%" title="PDF Preview"></iframe>
                            ) : ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(previewDoc.extension) ? (
                                <div className="image-preview-wrapper">
                                    <img src={previewDoc.url} alt="Document Preview" />
                                </div>
                            ) : (
                                <div className="no-preview">
                                    <FileText size={64} />
                                    <p>Preview not available for .{previewDoc.extension} files.</p>
                                    <button
                                        onClick={() => handleDownload(selectedCase.id, previewDoc.filename || previewDoc.url.split('/').slice(-2)[0], previewDoc.name)}
                                        className="btn-save"
                                    >
                                        Download to View
                                    </button>
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

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LawyerSidebar from '@/components/LawyerSidebar';
import '@/styles/LawyerMiniLawLibrary.css';
import { authService } from '@/lib/services/api';
import mammoth from 'mammoth';
import axios from 'axios';
import { Bot, Loader2, Sparkles, MessageCircle, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const LawyerMiniLawLibraryPage = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showChatSelectionModal, setShowChatSelectionModal] = useState(false);
    const [selectedChatDocs, setSelectedChatDocs] = useState([]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [briefcaseHistory, setBriefcaseHistory] = useState([]);

    const handleLoadAnalysis = async (sessionId) => {
        try {
            setIsAnalyzing(true);
            const session = await authService.getChatSession(sessionId);
            if (session && session.messages && session.messages.length > 1) {
                setAnalysisResult({
                    content: session.messages[1].content,
                    timestamp: session.updatedAt,
                    docCount: "Saved"
                });
            }
        } catch (error) {
            console.error('Failed to load analysis:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleStartAIChat = async () => {
        if (selectedChatDocs.length === 0) {
            alert('Please select at least one document to discuss.');
            return;
        }
        
        try {
            setIsAnalyzing(true);
            setShowChatSelectionModal(false);
            
            const data = await authService.startAnalysis(selectedChatDocs);
            if (data && (data.response || data.answer)) {
                setAnalysisResult({
                    content: data.response || data.answer,
                    timestamp: new Date(),
                    docCount: selectedChatDocs.length
                });
                fetchData();
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('AI Analysis failed. Please try again later.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleDocSelection = (docId) => {
        if (selectedChatDocs.includes(docId)) {
            setSelectedChatDocs(selectedChatDocs.filter(id => id !== docId));
        } else {
            setSelectedChatDocs([...selectedChatDocs, docId]);
        }
    };
    const [folders, setFolders] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Form state
    const [newDocName, setNewDocName] = useState('');
    const [newDocCategory, setNewDocCategory] = useState('personal');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Viewer state
    const [showViewer, setShowViewer] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [docxHtml, setDocxHtml] = useState('');
    const [loadingDocx, setLoadingDocx] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [docRes, folderRes, historyRes] = await Promise.all([
                authService.getDocuments(),
                authService.getFolders(),
                authService.getBriefcaseHistory().catch(() => [])
            ]);

            if (docRes.success) setDocuments(docRes.documents);
            if (folderRes.success) setFolders(folderRes.folders);
            if (historyRes) setBriefcaseHistory(historyRes);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const response = await authService.createFolder(newFolderName);
            if (response.success) {
                setFolders([response.folder, ...folders]);
                setShowFolderModal(false);
                setNewFolderName('');
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('Error creating folder');
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('title', newDocName || selectedFile.name);
        formData.append('category', newDocCategory);

        if (selectedFolder) {
            formData.append('folderId', selectedFolder._id);
        }

        try {
            const response = await authService.uploadDocument(formData);
            console.log('Upload response:', response);
            if (response.success) {
                alert('Document uploaded successfully!');
                setShowUploadModal(false);
                setNewDocName('');
                setSelectedFile(null);
                fetchData(); // Refresh list
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert(error.response?.data?.error || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteFolder = async (folderId) => {
        if (window.confirm('Are you sure you want to delete this folder and all its documents?')) {
            try {
                const response = await authService.deleteFolder(folderId);
                if (response.success) {
                    setFolders(folders.filter(f => f._id !== folderId));
                    // Also remove documents belonging to this folder from local state
                    setDocuments(documents.filter(d => d.folderId !== folderId));
                    if (selectedFolder && selectedFolder._id === folderId) {
                        setSelectedFolder(null);
                    }
                }
            } catch (error) {
                console.error('Delete folder failed:', error);
                alert('Failed to delete folder');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                const response = await authService.deleteDocument(id);
                if (response.success) {
                    setDocuments(documents.filter(d => d._id !== id));
                    if (viewingDoc && viewingDoc._id === id) {
                        setShowViewer(false);
                        setViewingDoc(null);
                    }
                }
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Failed to delete document');
            }
        }
    };

    const handleWhatsAppShare = (doc) => {
        const fileUrl = window.location.origin + getFullUrl(doc);
        const text = `Lawwise Document Share: ${doc.title}\n\nYou can view the document here: ${fileUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };



    const getFullUrl = (doc) => {
        if (!doc) return "";
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        if (doc._id && !doc.filePath) {
            return `${API_BASE}/api/documents/download/${doc._id}`;
        }
        return `${API_BASE}/${doc.filePath}`;
    };

    const handleDownload = (doc) => {
        const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');
        const token = localStorage.getItem('lawyerToken') || sessionStorage.getItem('lawyerToken');

        let url = doc.filePath
            ? `${API_BASE}/${doc.filePath}`
            : `${API_BASE}/api/documents/download/${doc._id}`;

        // Append token for direct download authentication
        if (token) {
            url += `${url.includes('?') ? '&' : '?'}token=${token}`;
        }

        // Open in new tab which triggers download due to Content-Disposition header
        window.open(url, '_blank');
    };

    const filteredDocs = documents.filter(doc => {
        return doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const isImage = (doc) => {
        const imgExts = ['JPG', 'JPEG', 'PNG', 'GIF'];
        return imgExts.includes(doc.fileType);
    };

    return (
        <div className="dashboard-body">
            <LawyerSidebar />
            <div className="dashboard-main library-body">
                <div className="library-container">
                    <div className="briefcase-top-bar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        <span>Briefcase</span>
                    </div>

                    <header className="briefcase-page-header">
                        <div className="briefcase-header-left">
                            <h1>My Folders</h1>
                            <p>Manage your legal cases and documents.</p>
                        </div>
                        <div className="briefcase-header-right">
                            <div className="briefcase-search-box">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input
                                    type="text"
                                    placeholder="Search folders..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="btn-add-folder" onClick={() => setShowFolderModal(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add Folder
                            </button>
                        </div>
                    </header>

                    <div className="folders-main-container">
                        {!selectedFolder ? (
                            <>
                                {loading ? (
                                    <div className="folders-loading">
                                        <div className="loading-spinner"></div>
                                        <p>Opening briefcase...</p>
                                    </div>
                                ) : (folders.length === 0) ? (
                                    <div className="empty-folders-state">
                                        <div className="empty-icon-circle">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
                                        </div>
                                        <h3>No folders created yet</h3>
                                        <p>Organize your cases and documents by creating your first folder.</p>
                                    </div>
                                ) : (
                                    <div className="folders-grid">
                                        {folders.map(folder => (
                                            <div key={folder._id} className="folder-card" onClick={() => setSelectedFolder(folder)}>
                                                <div className="folder-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                                </div>
                                                <div className="folder-info">
                                                    <h4>{folder.name}</h4>
                                                    <p>{documents.filter(d => d.folderId === folder._id).length} items</p>
                                                </div>
                                                <div className="folder-more" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id); }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="folder-detail-view">
                                <div className="folder-detail-header">
                                    <div className="folder-title-area">
                                        <button className="btn-back" onClick={() => setSelectedFolder(null)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                                        </button>
                                        <div className="folder-title-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                        </div>
                                        <h2>{selectedFolder.name}</h2>
                                    </div>
                                    <div className="folder-header-actions">
                                        <button className="btn-delete-folder" onClick={() => handleDeleteFolder(selectedFolder._id)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="folder-split-content">
                                    <div className="folder-content-left">
                                        <div className="section-header">
                                            <div className="section-title">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                <h3>Documents</h3>
                                                <span className="count-badge">{documents.filter(d => d.folderId === selectedFolder._id).length}</span>
                                            </div>
                                            <div className="section-actions">
                                                <button className="btn-refresh" onClick={fetchData}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                                                </button>
                                                <button className="btn-upload-black" onClick={() => setShowUploadModal(true)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                    Upload
                                                </button>
                                            </div>
                                        </div>

                                        <div className="docs-table-container">
                                            <table className="docs-table">
                                                <thead>
                                                    <tr>
                                                        <th>NAME</th>
                                                        <th>DATE</th>
                                                        <th>STATUS</th>
                                                        <th>ACTION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {documents.filter(d => d.folderId === selectedFolder._id).map(doc => (
                                                        <tr key={doc._id}>
                                                            <td className="doc-name-cell" onClick={() => handleDownload(doc)} title="Click to download">{doc.title}</td>
                                                            <td>{new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                            <td>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                            </td>
                                                            <td className="doc-table-actions">
                                                                <button className="btn-table-action" onClick={() => handleDownload(doc)} title="Download">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                                </button>
                                                                <button className="btn-table-action" onClick={() => handleWhatsAppShare(doc)} title="Share to WhatsApp">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                                                </button>
                                                                <button className="btn-table-action" onClick={() => handleDelete(doc._id)} title="Delete">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {documents.filter(d => d.folderId === selectedFolder._id).length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="table-empty">No documents yet. Click Upload to add files.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="folder-content-right">
                                        <div className="section-header">
                                            <div className="section-title">
                                                <Bot size={18} style={{ color: '#6366f1' }} />
                                                <h3>AI Insights</h3>
                                                {analysisResult && <span className="count-badge">1</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {analysisResult && briefcaseHistory.length > 0 && (
                                                    <button className="btn-upload-black" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }} onClick={() => setAnalysisResult(null)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><polyline points="15 18 9 12 15 6"></polyline></svg>
                                                        History
                                                    </button>
                                                )}
                                                <button className="btn-upload-black" onClick={() => {
                                                    setAnalysisResult(null);
                                                    setShowChatSelectionModal(true);
                                                }}>
                                                    <Sparkles size={16} />
                                                    {analysisResult ? 'New Analysis' : 'Start AI Analysis'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="analysis-display-container">
                                            {isAnalyzing ? (
                                                <div className="analysis-loading-state">
                                                    <Loader2 className="animate-spin" size={32} style={{ color: '#6366f1', marginBottom: '15px' }} />
                                                    <h4>Analyzing Documents...</h4>
                                                    <p>Our AI is reviewing your legal files. This may take a few moments.</p>
                                                </div>
                                            ) : analysisResult ? (
                                                <div className="analysis-result-content">
                                                    <div className="analysis-meta-info">
                                                        <span><FileText size={14} /> {analysisResult.docCount} Documents</span>
                                                        <span>{new Date(analysisResult.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div className="markdown-body">
                                                        <ReactMarkdown>{analysisResult.content}</ReactMarkdown>
                                                    </div>
                                                    <div className="analysis-disclaimer">
                                                        <AlertCircle size={12} />
                                                        <span>AI-generated insights should be verified by a legal professional.</span>
                                                    </div>
                                                </div>
                                            ) : briefcaseHistory.length > 0 ? (
                                                <div className="briefcase-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflowY: 'auto' }}>
                                                    <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous Analyses</h4>
                                                    {briefcaseHistory.map(session => (
                                                        <div key={session._id} onClick={() => handleLoadAnalysis(session._id)} style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '6px' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(99, 102, 241, 0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <strong style={{ fontSize: '14px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{session.title || 'Document Analysis'}</strong>
                                                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{new Date(session.updatedAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.messages[0]?.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="empty-discussions">
                                                    <div className="empty-icon-box">
                                                        <Bot size={24} style={{ color: '#94a3b8' }} />
                                                    </div>
                                                    <h4>AI Briefcase Assistant</h4>
                                                    <p>Select documents to generate an instant legal summary and risk analysis right here.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showFolderModal && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <div className="modal-title">
                                <span>Create New Folder</span>
                                <button onClick={() => setShowFolderModal(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                            </div>
                            <form onSubmit={handleCreateFolder}>
                                <div className="form-group">
                                    <label className="form-label">Folder Name *</label>
                                    <input
                                        className="profile-input"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        required
                                        placeholder="e.g. Constitutional Cases"
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="btn-profile-save" style={{ background: '#000000' }}>
                                    Create Folder
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {showUploadModal && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <div className="modal-title">
                                <span>Upload to Briefcase</span>
                                <button onClick={() => setShowUploadModal(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                            </div>
                            <form onSubmit={handleUpload}>
                                <div className="form-group">
                                    <label className="form-label">Document Title *</label>
                                    <input className="profile-input" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} required placeholder="e.g. Constitutional Amended Act" />
                                </div>
                                {/* Category selection removed as per user request */}
                                <div className="upload-area" style={{ border: '2px dashed #d1d5db', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '15px', background: '#f9fafb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#6b7280' }}>{selectedFile ? selectedFile.name : 'Drag and drop or click to select file'}</p>
                                    <input type="file" style={{ display: 'none' }} id="file-up" onChange={handleFileChange} />
                                    <button type="button" onClick={() => document.getElementById('file-up').click()} className="btn-doc-action" style={{ background: '#111827', color: '#fff', padding: '8px 20px', margin: '0 auto' }}>Select File</button>
                                </div>
                                <button type="submit" className="btn-profile-save" style={{ background: '#7b1fa2' }} disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Upload Document'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}


                {showChatSelectionModal && (
                    <div className="modal-overlay">
                        <div className="modal-box chat-selection-modal">
                            <div className="modal-title">
                                <span>Select Documents for AI Analysis</span>
                                <button onClick={() => setShowChatSelectionModal(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                            </div>
                            <div className="selection-list">
                                <p className="selection-hint">Select the files you want to summarize or ask questions about:</p>
                                {documents.filter(d => d.folderId === selectedFolder._id).map(doc => (
                                    <div key={doc._id} className={`selection-item ${selectedChatDocs.includes(doc._id) ? 'selected' : ''}`} onClick={() => toggleDocSelection(doc._id)}>
                                        <div className="selection-checkbox">
                                            {selectedChatDocs.includes(doc._id) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            )}
                                        </div>
                                        <div className="selection-doc-info">
                                            <span className="doc-name">{doc.title}</span>
                                            <span className="doc-meta">{doc.fileType} • {doc.fileSize}</span>
                                        </div>
                                    </div>
                                ))}
                                {documents.filter(d => d.folderId === selectedFolder._id).length === 0 && (
                                    <p className="no-docs-hint">No documents found in this folder. Upload some files first.</p>
                                )}
                            </div>
                            <div className="selection-actions">
                                <button className="btn-cancel" onClick={() => setShowChatSelectionModal(false)}>Cancel</button>
                                <button className="btn-start-chat" onClick={handleStartAIChat} disabled={selectedChatDocs.length === 0}>
                                    Start Analysis
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LawyerMiniLawLibraryPage;

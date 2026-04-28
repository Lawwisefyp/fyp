'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import '@/styles/LawyerMiniLawLibrary.css';
import { authService } from '@/lib/services/api';
import mammoth from 'mammoth';
import axios from 'axios';

const LawyerMiniLawLibraryPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

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

    // Categories removed as per user request

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authService.getDocuments();
            if (response.success) {
                setDocuments(response.documents);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

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
        console.log('Starting document upload...', { name: newDocName, file: selectedFile?.name });
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', newDocName || selectedFile.name);
        formData.append('category', newDocCategory);

        try {
            const response = await authService.uploadDocument(formData);
            console.log('Upload response:', response);
            if (response.success) {
                alert('Document uploaded successfully!');
                setShowUploadModal(false);
                setNewDocName('');
                setSelectedFile(null);
                fetchDocuments(); // Refresh list
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert(error.response?.data?.error || 'Failed to upload document');
        } finally {
            setUploading(false);
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

    const handleView = async (doc) => {
        setViewingDoc(doc);
        setShowViewer(true);
        setDocxHtml('');

        if (doc.fileType === 'DOCX') {
            setLoadingDocx(true);
            try {
                const response = await axios.get(getFullUrl(doc.filePath), {
                    responseType: 'arraybuffer'
                });

                if (!response.data || response.data.byteLength === 0) {
                    throw new Error('Downloaded file is empty');
                }

                const result = await mammoth.convertToHtml({ arrayBuffer: response.data });
                setDocxHtml(result.value);
            } catch (error) {
                console.error('Failed to convert DOCX:', error);
                setDocxHtml(`
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <h3 style="color: #1e293b;">Integrated viewing failed</h3>
                        <p>This DOCX file could not be rendered on screen. This can happen with complex layouts or password protection.</p>
                        <p style="font-size: 0.8rem; margin-top: 10px;">Error Details: ${error.message}</p>
                    </div>
                `);
            } finally {
                setLoadingDocx(false);
            }
        } else if (doc.fileType === 'DOC') {
            setDocxHtml(`
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <h3 style="color: #1e293b;">Legacy .doc file detected</h3>
                    <p>Older Word documents (.doc) do not support integrated viewing. Please download the file to view it in Microsoft Word or another editor.</p>
                </div>
            `);
        }
    };

    const handleDownload = (filePath, fileName) => {
        const link = document.createElement('a');
        link.href = getFullUrl(filePath);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const filteredDocs = documents.filter(doc => {
        return doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const getFullUrl = (filePath) => {
        // Files are stored in public/uploads/documents/...
        // They are accessible at /uploads/documents/...
        return `/${filePath}`;
    };

    const isImage = (doc) => {
        const imgExts = ['JPG', 'JPEG', 'PNG', 'GIF'];
        return imgExts.includes(doc.fileType);
    };

    return (
        <div className="library-body">
            <div className="library-container">
                <header className="library-header">
                    <div className="header-content">
                        <h1>Personal Law Library</h1>
                        <p>Access and manage your own important legal documents and research files.</p>
                        <div className="library-header-actions">
                            <div className="library-search-container">
                                <span className="library-search-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                </span>
                                <input
                                    type="text"
                                    className="library-search-input"
                                    placeholder="Search your documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="btn-library-upload" onClick={() => setShowUploadModal(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                Upload Document
                            </button>
                        </div>
                    </div>

                    <Link href="/lawyer-dashboard" className="btn-back-dashboard">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        Back to Dashboard
                    </Link>
                </header>

                <div className="library-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px' }}>
                            <div className="loading-spinner"></div>
                            <p>Loading your library...</p>
                        </div>
                    ) : filteredDocs.map(doc => (
                        <div key={doc._id} className="library-card">
                            <div className="library-doc-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <h3 className="library-doc-title">{doc.title}</h3>
                            <div className="library-doc-meta" style={{ marginTop: '10px' }}>
                                <span>Type: {doc.fileType}</span>
                                <span>Size: {doc.fileSize}</span>
                            </div>
                            <div className="library-doc-meta">
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="library-doc-actions">
                                <button className="btn-doc-action btn-doc-view" onClick={() => handleView(doc)}>View</button>
                                <button className="btn-doc-action btn-doc-download" onClick={() => handleDownload(doc.filePath, doc.fileName)}>Download</button>
                                <button className="btn-doc-action btn-doc-delete" onClick={() => handleDelete(doc._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                    {!loading && filteredDocs.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.8)', borderRadius: '24px' }}>
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <h3>No documents found</h3>
                            <p>Upload your own documents to build your personal law library.</p>
                        </div>
                    )}
                </div>
            </div>

            {showUploadModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-title">
                            <span>Upload to Personal Library</span>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
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

            {showViewer && viewingDoc && (
                <div className="viewer-overlay">
                    <div className="viewer-box">
                        <div className="viewer-header">
                            <h3>{viewingDoc.title}</h3>
                            <div className="viewer-actions">
                                <button className="btn-viewer-close" onClick={() => handleDownload(viewingDoc.filePath, viewingDoc.fileName)}>Download</button>
                                <button className="btn-viewer-close" onClick={() => setShowViewer(false)}>Close</button>
                            </div>
                        </div>
                        <div className="viewer-content">
                            {loadingDocx ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div className="loading-spinner"></div>
                                    <p>Converting document for display...</p>
                                </div>
                            ) : isImage(viewingDoc) ? (
                                <img src={getFullUrl(viewingDoc.filePath)} alt={viewingDoc.title} className="viewer-img" />
                            ) : viewingDoc.fileType === 'PDF' ? (
                                <iframe src={getFullUrl(viewingDoc.filePath)} title={viewingDoc.title} className="viewer-iframe" />
                            ) : (viewingDoc.fileType === 'DOCX' || viewingDoc.fileType === 'DOC') ? (
                                <div className="docx-viewer-container" dangerouslySetInnerHTML={{ __html: docxHtml }} />
                            ) : (
                                <div className="viewer-placeholder">
                                    <h3>Integrated viewing not supported for {viewingDoc.fileType} files</h3>
                                    <p>Please download the file to view its content.</p>
                                    <button className="btn-library-upload" style={{ marginTop: '20px' }} onClick={() => handleDownload(viewingDoc.filePath, viewingDoc.fileName)}>Download Now</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerMiniLawLibraryPage;

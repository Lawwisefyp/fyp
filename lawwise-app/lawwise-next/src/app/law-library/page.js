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

    const categories = [
        { id: 'all', name: 'All Documents', icon: '📁' },
        { id: 'statutes', name: 'Statutes', icon: '📜' },
        { id: 'rules', name: 'Rules', icon: '⚖️' },
        { id: 'cases', name: 'Case Law', icon: '🏛️' },
        { id: 'personal', name: 'Personal', icon: '👤' }
    ];

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
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('title', newDocName || selectedFile.name);
        formData.append('category', newDocCategory);

        try {
            const response = await authService.uploadDocument(formData);
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
                        <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
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
                    <div style="font-size: 3rem; margin-bottom: 20px;">📜</div>
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
        const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getFullUrl = (filePath) => `/api/documents/raw?path=${encodeURIComponent(filePath)}`;

    const isImage = (doc) => {
        const imgExts = ['JPG', 'JPEG', 'PNG', 'GIF'];
        return imgExts.includes(doc.fileType);
    };

    return (
        <div className="library-body">
            <div className="library-container">
                <Link href="/lawyer-dashboard" style={{ color: '#fff', fontWeight: '700', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>← Back to Dashboard</Link>

                <header className="library-header">
                    <h1>📚 Personal Law Library</h1>
                    <p>Access and manage your own important legal documents and research files.</p>
                    <div className="library-header-actions">
                        <div className="library-search-container">
                            <span className="library-search-icon">🔍</span>
                            <input
                                type="text"
                                className="library-search-input"
                                placeholder="Search your documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn-library-upload" onClick={() => setShowUploadModal(true)}>📤 Upload Document</button>
                    </div>
                </header>

                <div className="guidance-filter-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`guidance-tab ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.icon} {cat.name}
                            <span className="tab-badge" style={{ marginLeft: '10px', fontSize: '0.8rem', opacity: 0.8 }}>
                                {loading ? '...' : (cat.id === 'all' ? documents.length : documents.filter(d => d.category === cat.id).length)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="library-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px' }}>
                            <div className="loading-spinner"></div>
                            <p>Loading your library...</p>
                        </div>
                    ) : filteredDocs.map(doc => (
                        <div key={doc._id} className="library-card">
                            <div className="library-doc-icon">
                                {doc.category === 'statutes' ? '📜' : doc.category === 'rules' ? '⚖️' : doc.category === 'cases' ? '🏛️' : '👤'}
                            </div>
                            <h3 className="library-doc-title">{doc.title}</h3>
                            <div className="library-doc-category">
                                {categories.find(c => c.id === doc.category)?.name}
                            </div>
                            <div className="library-doc-meta">
                                <span>📄 Type: {doc.fileType}</span>
                                <span>💾 Size: {doc.fileSize}</span>
                            </div>
                            <div className="library-doc-meta">
                                <span>📅 {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="library-doc-actions">
                                <button className="btn-doc-action btn-doc-view" onClick={() => handleView(doc)}>👁️ View</button>
                                <button className="btn-doc-action btn-doc-download" onClick={() => handleDownload(doc.filePath, doc.fileName)}>⬇️</button>
                                <button className="btn-doc-action btn-doc-delete" onClick={() => handleDelete(doc._id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                    {!loading && filteredDocs.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.8)', borderRadius: '24px' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📂</div>
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
                            <span>📤 Upload to Personal Library</span>
                            <button onClick={() => setShowUploadModal(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className="form-group">
                                <label className="form-label">Document Title *</label>
                                <input className="profile-input" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} required placeholder="e.g. Constitutional Amended Act" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="profile-select" value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)}>
                                    <option value="personal">Personal Documents</option>
                                    <option value="statutes">Statute</option>
                                    <option value="rules">Rules & Regulation</option>
                                    <option value="cases">Case Law</option>
                                </select>
                            </div>
                            <div className="upload-area" style={{ border: '2px dashed #7b1fa2', padding: '15px', borderRadius: '15px', textAlign: 'center', marginBottom: '15px' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '5px' }}>📄</div>
                                <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>{selectedFile ? selectedFile.name : 'Drag and drop or click to select file'}</p>
                                <input type="file" style={{ display: 'none' }} id="file-up" onChange={handleFileChange} />
                                <button type="button" onClick={() => document.getElementById('file-up').click()} className="btn-doc-action" style={{ background: '#7b1fa2', color: '#fff', padding: '6px 15px', margin: '0 auto' }}>Select File</button>
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
                                <button className="btn-viewer-close" onClick={() => handleDownload(viewingDoc.filePath, viewingDoc.fileName)}>⬇️ Download</button>
                                <button className="btn-viewer-close" onClick={() => setShowViewer(false)}>✕ Close</button>
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
                                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📎</div>
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

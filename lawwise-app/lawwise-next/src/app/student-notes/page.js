'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import '@/styles/StudentNotes.css';

const StudentNotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [folders, setFolders] = useState([]);
    const [activeFolder, setActiveFolder] = useState(null); // 'all' | folderId
    const [activeTab, setActiveTab] = useState('library'); // 'library' | 'community'
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiExplanation, setAiExplanation] = useState(null);
    const [explainingId, setExplainingId] = useState(null);
    const [openShareId, setOpenShareId] = useState(null);

    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        subject: '',
        folderId: '',
        isPublic: false
    });
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchFolders();
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [activeTab, activeFolder]);

    const fetchFolders = async () => {
        try {
            const result = await authService.getFolders();
            if (result.success) setFolders(result.folders);
        } catch (error) {
            console.error('Error fetching folders:', error);
        }
    };

    const fetchNotes = async () => {
        setLoading(true);
        try {
            let result;
            if (activeTab === 'community') {
                result = await authService.getPublicNotes();
            } else {
                result = await authService.getMyNotes(activeFolder === 'all' ? '' : activeFolder);
            }
            if (result.success) setNotes(result.notes);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        try {
            const result = await authService.createFolder(newFolderName);
            if (result.success) {
                setNewFolderName('');
                setShowFolderModal(false);
                fetchFolders();
            }
        } catch (error) {
            alert('Failed to create folder');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert('Please select a file');

        setUploading(true);
        const formData = new FormData();
        formData.append('noteFile', selectedFile);
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        formData.append('subject', uploadData.subject);
        formData.append('folderId', uploadData.folderId);
        formData.append('isPublic', uploadData.isPublic);

        try {
            const result = await authService.uploadNote(formData);
            if (result.success) {
                alert('Note added successfully!');
                setShowUploadModal(false);
                fetchNotes();
                setUploadData({ title: '', description: '', subject: '', folderId: '', isPublic: false });
                setSelectedFile(null);
            }
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleTogglePublic = async (note) => {
        try {
            const result = await authService.togglePublicNote(note._id, !note.isPublic);
            if (result.success) {
                alert(`Note is now ${!note.isPublic ? 'Public' : 'Private'}`);
                fetchNotes();
            }
        } catch (error) {
            alert('Failed to update sharing status');
        }
    };

    const handleAIExplain = async (id) => {
        setExplainingId(id);
        setAiExplanation(null);
        setShowAIModal(true);
        try {
            const result = await authService.getNoteAIExplanation(id);
            if (result.success) {
                setAiExplanation(result.explanation);
            } else {
                setAiExplanation(result.error);
            }
        } catch (error) {
            setAiExplanation('Error generating AI explanation.');
        } finally {
            setExplainingId(null);
        }
    };

    const handleDownload = async (id, fileUrl) => {
        try {
            await authService.downloadNote(id);
            // In Next.js, static files are served from public directory at root
            const absoluteUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
            window.open(absoluteUrl, '_blank');
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const handleGenerateQuiz = async (id) => {
        try {
            setUploading(true);
            const result = await authService.generateNoteQuiz(id);
            if (result.success) {
                router.push(`/student-quizzes?quizId=${result.quizId}`);
            }
        } catch (error) {
            alert('Failed to generate quiz');
        } finally {
            setUploading(false);
        }
    };

    const getShareUrl = (note) => {
        const appUrl = `${window.location.origin}/student-library`;
        return `📚 *${note.title}*\nSubject: ${note.subject}\n\nHey! I'm sharing my legal study notes with you. Check them out on Lawwise:\n${appUrl}`;
    };

    const shareOnWhatsApp = (note) => {
        setOpenShareId(null);
        const text = getShareUrl(note);
        window.open(`https://api.whatsapp.com/send/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareViaEmail = (note) => {
        setOpenShareId(null);
        const subject = `Legal Notes: ${note.title}`;
        const body = getShareUrl(note);
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="notes-page-container">
            <div className="notes-sidebar">
                <div className="sidebar-section">
                    <button className="back-btn" onClick={() => router.push('/student-dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>← Dashboard</button>
                    <h3>My Organization</h3>
                    <div className="folder-list">
                        <div
                            className={`folder-item ${activeTab === 'library' && (activeFolder === 'all' || !activeFolder) ? 'active' : ''}`}
                            onClick={() => { setActiveTab('library'); setActiveFolder('all'); }}
                        >
                            📁 All Notes
                        </div>
                        {folders.map(folder => (
                            <div
                                key={folder._id}
                                className={`folder-item ${activeTab === 'library' && activeFolder === folder._id ? 'active' : ''}`}
                                onClick={() => { setActiveTab('library'); setActiveFolder(folder._id); }}
                            >
                                📂 {folder.name}
                            </div>
                        ))}
                        <button className="add-folder-btn" onClick={() => setShowFolderModal(true)}>+ New Folder</button>
                    </div>
                </div>

                <div className="sidebar-section">
                    <h3>Explore</h3>
                    <div
                        className={`folder-item ${activeTab === 'community' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('community'); setActiveFolder('public'); }}
                    >
                        🌎 Community Hub
                    </div>
                    <div
                        className="folder-item"
                        onClick={() => router.push('/student-library')}
                    >
                        📖 Resource Hub
                    </div>
                </div>
            </div>

            <div className="notes-main-content">
                <div className="notes-header">
                    <div className="notes-title-sec">
                        <h1 style={{ color: '#1e293b' }}>{activeTab === 'community' ? 'Community Hub' : 'My Library'}</h1>
                        <p style={{ color: '#64748b' }}>
                            {activeTab === 'community'
                                ? 'Discover notes shared by law students across the platform.'
                                : `Managing notes ${activeFolder && activeFolder !== 'all' ? `in ${folders.find(f => f._id === activeFolder)?.name}` : 'across all folders'}.`}
                        </p>
                    </div>
                    {activeTab === 'library' && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="btn-primary"
                            style={{ padding: '12px 25px', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff' }}
                        >
                            + Upload Notes
                        </button>
                    )}
                </div>

                <div className="notes-tabs">
                    <div className={`note-tab ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>My Library</div>
                    <div className={`note-tab ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>Public Discussions</div>
                </div>

                {loading ? <p style={{ color: '#64748b' }}>Loading resources...</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                        {notes.length > 0 ? (
                            notes.map(note => (
                                <div key={note._id} className="note-card" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <div className="note-badge" style={{ backgroundColor: '#fff7ed', color: '#f57c00', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-block', marginBottom: '12px' }}>#{note.subject}</div>
                                    <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>{note.title}</h3>
                                    <p className="note-desc" style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px', minHeight: '40px' }}>{note.description || 'No description provided.'}</p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                        <span>{activeTab === 'community' ? `By: ${note.uploader?.fullName || 'Student'}` : 'Private Note'}</span>
                                        <span>📥 {note.downloadsCount} downloads</span>
                                    </div>

                                    <div className="note-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div className="note-actions-row" style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleDownload(note._id, note.fileUrl)} style={{ padding: '10px 14px', borderRadius: '10px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', background: '#f1f5f9', color: '#334155', border: '1.5px solid #94a3b8', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>📥 Download</button>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <button onClick={() => setOpenShareId(openShareId === note._id ? null : note._id)} style={{ padding: '10px 14px', borderRadius: '10px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', background: openShareId === note._id ? '#e2e8f0' : '#f1f5f9', color: '#334155', border: '1.5px solid #94a3b8', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>🔗 Share ▾</button>
                                                {openShareId === note._id && (
                                                    <div style={{ position: 'absolute', bottom: '110%', left: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', padding: '8px', minWidth: '160px', zIndex: 100 }}>
                                                        <div className="share-opt" style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '6px', color: '#334155' }} onClick={() => shareOnWhatsApp(note)}>WhatsApp</div>
                                                        <div className="share-opt" style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '6px', color: '#334155' }} onClick={() => shareViaEmail(note)}>Email</div>
                                                        {activeTab === 'library' && (
                                                            <div
                                                                className="share-opt"
                                                                style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '6px', color: note.isPublic ? '#ef4444' : '#f57c00', fontWeight: 'bold' }}
                                                                onClick={() => { handleTogglePublic(note); setOpenShareId(null); }}
                                                            >
                                                                {note.isPublic ? 'Make Private' : 'Share to Public'}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => handleAIExplain(note._id)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#f0f9ff', color: '#0369a1', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            ✨ AI Explanation
                                        </button>
                                        <button onClick={() => handleGenerateQuiz(note._id)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#fef3c7', color: '#b45309', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            🧠 Take Quiz
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '100px 0', gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📚</div>
                                <h2 style={{ color: '#1e293b' }}>No notes found here yet</h2>
                                <p style={{ color: '#64748b' }}>Start by uploading your first study guide or folder.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '550px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h2 style={{ margin: 0, color: '#1e293b' }}>Add New Notes</h2>
                            <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Title</label>
                                    <input
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#333' }}
                                        value={uploadData.title}
                                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Subject</label>
                                    <input
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#333' }}
                                        value={uploadData.subject}
                                        onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                                        placeholder="e.g. Contract Law"
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Select Folder</label>
                                <select
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#333' }}
                                    value={uploadData.folderId}
                                    onChange={(e) => setUploadData({ ...uploadData, folderId: e.target.value })}
                                >
                                    <option value="">No Folder (General)</option>
                                    {folders.map(f => (
                                        <option key={f._id} value={f._id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Description</label>
                                <textarea
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px', color: '#333' }}
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={uploadData.isPublic}
                                    onChange={(e) => setUploadData({ ...uploadData, isPublic: e.target.checked })}
                                />
                                <label htmlFor="isPublic" style={{ fontWeight: '600', cursor: 'pointer', color: '#334155' }}>Share to Community Hub (Everyone can see it)</label>
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>File Upload (PDF/DOC)</label>
                                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} required style={{ color: '#333' }} />
                            </div>
                            <button
                                type="submit"
                                disabled={uploading}
                                style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '12px', fontSize: '1.1rem', cursor: 'pointer', background: '#2563eb', color: '#fff', fontWeight: '700' }}
                            >
                                {uploading ? 'Processing...' : 'Upload & Save'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Folder Modal */}
            {showFolderModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px' }}>
                        <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>Create New Folder</h2>
                        <form onSubmit={handleCreateFolder}>
                            <input
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', color: '#333' }}
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder Name (e.g. 1st Semester)"
                                required
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowFolderModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Explanation Modal */}
            {showAIModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '35px', borderRadius: '24px', width: '90%', maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h2 style={{ margin: 0, color: '#1e293b' }}>✨ AI Professor Explanation</h2>
                            <button onClick={() => setShowAIModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <div className="ai-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {explainingId ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🤖</div>
                                    <p style={{ color: '#64748b' }}>AI is analyzing the legal context of your notes...</p>
                                </div>
                            ) : (
                                <div className="ai-exp-text" style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.6' }}>
                                    {aiExplanation}
                                </div>
                            )}
                        </div>
                        {!explainingId && (
                            <button onClick={() => setShowAIModal(false)} style={{ width: '100%', marginTop: '30px', padding: '12px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Got it, thanks!</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentNotesPage;

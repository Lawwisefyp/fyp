'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import '@/styles/StudentQuiz.css';
import '@/styles/StudentNotes.css';

const StudentPastPapersPage = () => {
    const router = useRouter();
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadData, setUploadData] = useState({
        title: '',
        subject: '',
        year: '',
        description: ''
    });
    const [paperFile, setPaperFile] = useState(null);
    const [answerFile, setAnswerFile] = useState(null);
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const info = localStorage.getItem('studentInfo');
        if (info) setStudent(JSON.parse(info));
        fetchPastPapers();
    }, []);

    const fetchPastPapers = async () => {
        setLoading(true);
        try {
            const result = await authService.getPastPapers();
            if (result.success) setPapers(result.pastPapers);
        } catch (e) {
            console.error('Error fetching past papers:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!paperFile) return alert('Please select a past paper file');

        setUploading(true);
        const formData = new FormData();
        formData.append('paperFile', paperFile);
        if (answerFile) formData.append('answerFile', answerFile);
        formData.append('title', uploadData.title);
        formData.append('subject', uploadData.subject);
        formData.append('year', uploadData.year);
        formData.append('description', uploadData.description);

        try {
            const result = await authService.uploadPastPaper(formData);
            if (result.success) {
                alert('Past paper added successfully!');
                setShowUploadModal(false);
                fetchPastPapers();
                setUploadData({ title: '', subject: '', year: '', description: '' });
                setPaperFile(null);
                setAnswerFile(null);
            }
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (id, fileUrl) => {
        try {
            await authService.downloadPastPaper(id);

            // If it's an external URL (starts with http), just open it
            if (fileUrl.startsWith('http')) {
                window.open(fileUrl, '_blank');
                return;
            }

            // Otherwise, it's a local file. Prefix with backend URL if needed.
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
            const cleanUrl = fileUrl.replace(/\\/g, '/');
            const absoluteUrl = cleanUrl.startsWith('/') ? `${backendUrl}${cleanUrl}` : `${backendUrl}/${cleanUrl}`;
            window.open(absoluteUrl, '_blank');
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const handleShare = (paper) => {
        const shareUrl = window.location.href;
        const text = `Check out this past paper for ${paper.subject}: ${paper.title}`;

        if (navigator.share) {
            navigator.share({
                title: paper.title,
                text: text,
                url: shareUrl,
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(`${text} \n ${shareUrl}`);
            alert('Link and paper details copied to clipboard!');
        }
    };

    const scrollToYear = (year) => {
        const el = document.getElementById(`llb-year-${year}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const initials = student?.fullName ? student.fullName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() : 'S';

    return (
        <div className="notes-page-container">
            <div className="notes-sidebar">
                <div className="sidebar-section">
                    <button
                        onClick={() => router.push('/student-dashboard')}
                        style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                            border: 'none',
                            color: 'white',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '25px',
                            width: '100%',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        ← Dashboard
                    </button>
                    <h3>LLB Years</h3>
                    <div className="folder-list">
                        {[1, 2, 3, 4, 5].map(year => (
                            <div
                                key={year}
                                className="folder-item"
                                onClick={() => scrollToYear(year)}
                                style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', marginBottom: '5px', transition: '0.2s' }}
                            >
                                🎓 Year {year} Papers
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        style={{
                            width: '100%',
                            padding: '15px',
                            borderRadius: '12px',
                            background: '#f0f9ff',
                            color: '#0288d1',
                            border: '1px dashed #0288d1',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        + Contribute Paper
                    </button>
                </div>
            </div>

            <div className="notes-main-content">
                <div className="notes-header">
                    <div className="notes-title-sec">
                        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', fontWeight: '800', margin: '0 0 10px 0' }}>Past Papers & Model Answers</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Access previous year exams and learn from model solutions.</p>
                    </div>
                </div>

                <div className="dashboard-container">

                    <div className="dashboard-section-title">Available Past Papers</div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
                            <p>Loading academic records...</p>
                        </div>
                    ) : papers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📁</div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '1.5rem' }}>No papers found</h3>
                            <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.1rem' }}>Be the first to upload a past paper for your subject!</p>
                            <button onClick={() => setShowUploadModal(true)} className="quiz-cta-btn">Upload Paper</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            {[1, 2, 3, 4, 5].map(yearNum => {
                                const yearPapers = papers.filter(p => p.llbYear == yearNum);
                                if (yearPapers.length === 0) return null;

                                return (
                                    <div key={yearNum} id={`llb-year-${yearNum}`} style={{ scrollMarginTop: '100px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e3a8a' }}>LLB Year {yearNum} Papers</h2>
                                            <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #1e3a8a 0%, transparent 100%)' }}></div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
                                            {yearPapers.map(paper => (
                                                <div key={paper._id} className="feature-card" style={{ padding: '30px', position: 'relative', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                                        <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>#{paper.subject}</div>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <div style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{paper.year}</div>
                                                            <button
                                                                onClick={() => handleShare(paper)}
                                                                style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                                                            >
                                                                🔗 Share
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h3 style={{ color: '#111827', margin: '0 0 10px 0', fontSize: '1.2rem' }}>{paper.title}</h3>
                                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px', minHeight: '45px' }}>{paper.description || 'No description provided'}</p>

                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            onClick={() => handleDownload(paper._id, paper.fileUrl)}
                                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                        >
                                                            📥 Paper
                                                        </button>
                                                        {paper.modelAnswerUrl && (
                                                            <button
                                                                onClick={() => handleDownload(paper._id, paper.modelAnswerUrl)}
                                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#1e3a8a', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                            >
                                                                💡 Answers
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={{ marginTop: '15px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                                                        {paper.uploader ? `Uploaded by: ${paper.uploader.fullName}` : 'Official Punjab University Resource'} • {paper.downloadsCount} downloads
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '35px', borderRadius: '24px', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h2 style={{ margin: 0, color: '#1e293b' }}>Upload Past Paper</h2>
                            <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Exam Title</label>
                                <input
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                    placeholder="e.g. Contract Law Finals 2023"
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Subject</label>
                                    <input
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                        value={uploadData.subject}
                                        onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                                        placeholder="e.g. Contract Law"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Exam Year</label>
                                    <input
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                        value={uploadData.year}
                                        onChange={(e) => setUploadData({ ...uploadData, year: e.target.value })}
                                        placeholder="e.g. 2023"
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>LLB Year Level</label>
                                <select
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white' }}
                                    value={uploadData.llbYear}
                                    onChange={(e) => setUploadData({ ...uploadData, llbYear: e.target.value })}
                                    required
                                >
                                    <option value="">Select LLB Year</option>
                                    <option value="1">Year 1 (Part I)</option>
                                    <option value="2">Year 2 (Part II)</option>
                                    <option value="3">Year 3 (Part III)</option>
                                    <option value="4">Year 4 (Part IV)</option>
                                    <option value="5">Year 5 (Part V)</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Description</label>
                                <textarea
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px' }}
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                    placeholder="Any details about the exam (e.g. University Name, Semester)"
                                />
                            </div>

                            <div style={{ marginBottom: '20px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: '#1e293b' }}>Files</label>
                                <div style={{ marginBottom: '15px' }}>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Past Paper (Required)</p>
                                    <input type="file" onChange={(e) => setPaperFile(e.target.files[0])} required />
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Model Answers (Optional)</p>
                                    <input type="file" onChange={(e) => setAnswerFile(e.target.files[0])} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '12px', fontSize: '1.1rem', cursor: 'pointer', background: '#1e3a8a', color: '#fff', fontWeight: '700' }}
                            >
                                {uploading ? 'Uploading...' : 'Publish to Library'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal-overlay {
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default StudentPastPapersPage;

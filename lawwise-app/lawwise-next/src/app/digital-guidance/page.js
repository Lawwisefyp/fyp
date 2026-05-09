'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import '@/styles/LawyerDigitalGuidance.css';
import '@/styles/Dashboard.css';
import { youtubeService } from '@/lib/services/youtubeService';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';

const formatSummary = (text) => {
    if (!text) return '';
    return text
        .split('\n')
        .map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            // ## Heading
            if (trimmed.startsWith('## ')) return `<h4>${trimmed.slice(3)}</h4>`;
            // ### Heading
            if (trimmed.startsWith('### ')) return `<h4>${trimmed.slice(4)}</h4>`;
            // Bullet point
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                let content = trimmed.slice(2);
                // Bold **text**
                content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return `<li>${content}</li>`;
            }
            // Regular paragraph with bold support
            let content = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return `<p>${content}</p>`;
        })
        .join('\n');
};

const LawyerDigitalGuidancePage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [videos, setVideos] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [watchingVideo, setWatchingVideo] = useState(null);
    const [activeVideo, setActiveVideo] = useState(null);
    const [notesContent, setNotesContent] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [loadingSummary, setLoadingSummary] = useState(false);

    const topics = [
        { name: 'Court Procedure' },
        { name: 'Family Law' },
        { name: 'Civil Litigation' },
        { name: 'Corporate Law' },
        { name: 'Legal Drafting' },
        { name: 'Constitutional Law' },
        { name: 'Property Law' },
        { name: 'Evidence Law' },
    ];

    const fetchVideos = useCallback(async (query) => {
        setLoading(true);
        const results = await youtubeService.searchVideos(query || 'legal procedures legal education');
        setVideos(results);
        setLoading(false);
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const response = await authService.getHistory();
            if (response.success) {
                setHistory(response.history);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    }, []);

    useEffect(() => {
        fetchVideos();
        fetchHistory();
    }, [fetchVideos, fetchHistory]);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            fetchVideos(searchQuery.trim());
        }
    };

    const handleWatchVideo = async (video) => {
        setWatchingVideo(video);
        setNotesContent(video.notes || '');

        try {
            const response = await authService.saveHistory({
                videoId: video.id || video.videoId,
                title: video.title,
                thumbnail: video.thumb || video.thumbnail,
                channelName: video.channel || video.channelName
            });
            if (response.success) {
                if (!video._id) {
                    setWatchingVideo(response.historyItem);
                }
                fetchHistory();
            }
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    };

    const handleSaveVideo = async (video) => {
        try {
            await authService.saveHistory({
                videoId: video.id || video.videoId,
                title: video.title,
                thumbnail: video.thumb || video.thumbnail,
                channelName: video.channel || video.channelName
            });
            alert('Video saved to history!');
            fetchHistory();
        } catch (error) {
            console.error('Failed to save video:', error);
            alert('Failed to save video.');
        }
    };

    const handleOpenNotes = async (video) => {
        let historyVideo = video;
        if (!video._id) {
            try {
                const response = await authService.saveHistory({
                    videoId: video.id || video.videoId,
                    title: video.title,
                    thumbnail: video.thumb || video.thumbnail,
                    channelName: video.channel || video.channelName
                });
                if (response.success) {
                    historyVideo = response.historyItem;
                    fetchHistory();
                }
            } catch (error) {
                console.error("Failed to add to history for notes", error);
                alert("Could not initialize notes for this video.");
                return;
            }
        }
        setActiveVideo(historyVideo);
        setNotesContent(historyVideo.notes || '');
        setIsNotesModalOpen(true);
    };

    const handleSaveNotes = async () => {
        if (!activeVideo || !activeVideo._id) return;

        setSavingNotes(true);
        try {
            const response = await authService.updateHistoryNotes(activeVideo._id, notesContent);
            if (response.success) {
                setHistory(history.map(item => item._id === activeVideo._id ? { ...item, notes: notesContent } : item));
                setIsNotesModalOpen(false);
                setActiveVideo(null);
                setNotesContent('');
                alert('Notes saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save notes:', error);
            alert('Failed to save notes.');
        } finally {
            setSavingNotes(false);
        }
    };

    const handleSaveWatchingNotes = async () => {
        if (!watchingVideo || !watchingVideo._id) return;

        setSavingNotes(true);
        try {
            const response = await authService.updateHistoryNotes(watchingVideo._id, notesContent);
            if (response.success) {
                setHistory(history.map(item => item._id === watchingVideo._id ? { ...item, notes: notesContent } : item));
                alert('Progress saved!');
            }
        } catch (error) {
            console.error('Failed to save notes:', error);
            alert('Failed to save notes.');
        } finally {
            setSavingNotes(false);
        }
    };

    const handleAISummary = async (video) => {
        setAiSummary('');
        setLoadingSummary(true);
        try {
            const response = await authService.getVideoAISummary(
                video.title,
                video.description || '',
                video.channel || video.channelName || ''
            );
            if (response.success) {
                setAiSummary(response.summary);
            }
        } catch (error) {
            console.error('AI Summary error:', error);
            setAiSummary('Failed to generate AI summary. Please try again.');
        } finally {
            setLoadingSummary(false);
        }
    };

    const renderWatchingView = () => (
        <div className="watching-view">
            <div className="watching-header">
                <button className="btn-back-results" onClick={() => { setWatchingVideo(null); setAiSummary(''); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    Back to Resources
                </button>
                <h2 dangerouslySetInnerHTML={{ __html: watchingVideo.title }}></h2>
            </div>
            <div className="watching-layout">
                <div className="watching-player-container">
                    <iframe
                        width="100%"
                        height="500"
                        src={`https://www.youtube.com/embed/${watchingVideo.id || watchingVideo.videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                    <div className="watching-info-footer">
                        <h3>{watchingVideo.channel || watchingVideo.channelName}</h3>
                        <p>{watchingVideo.description}</p>
                        <button 
                            className="btn-ai-summary" 
                            onClick={() => handleAISummary(watchingVideo)}
                            disabled={loadingSummary}
                        >
                            {loadingSummary ? 'Generating Summary...' : 'AI Summary'}
                        </button>
                    </div>
                    {(loadingSummary || aiSummary) && (
                        <div className="ai-summary-panel">
                            <div className="ai-summary-header">
                                <h3>AI-Generated Summary</h3>
                            </div>
                            <div className="ai-summary-content">
                                {loadingSummary ? (
                                    <div className="ai-summary-loading">
                                        <div className="loading-spinner"></div>
                                        <p>Analyzing video content with AI...</p>
                                    </div>
                                ) : (
                                    <div className="ai-summary-text" dangerouslySetInnerHTML={{ __html: formatSummary(aiSummary) }}></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="watching-notes-panel">
                    <div className="notes-panel-header">
                        <h3>Take Notes</h3>
                        <p>Write down key takeaways while watching</p>
                    </div>
                    <textarea
                        className="panel-notes-textarea"
                        placeholder="Jot down important legal points here..."
                        value={notesContent}
                        onChange={(e) => setNotesContent(e.target.value)}
                    ></textarea>
                    <button 
                        className="btn-panel-save-notes" 
                        onClick={handleSaveWatchingNotes}
                        disabled={savingNotes}
                    >
                        {savingNotes ? 'Saving...' : 'Save Progress'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderVideoGrid = (videoList) => (
        <div className="guidance-grid">
            {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner"></div>
                    <p>Fetching legal videos from YouTube...</p>
                </div>
            ) : videoList.length > 0 ? (
                videoList.map(video => (
                    <div key={video.id || video._id} className="guidance-card">
                        <div className="guidance-thumb" style={{ backgroundImage: `url(${video.thumb || video.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            {!video.thumb && !video.thumbnail && <span className="guidance-thumb-placeholder">▶</span>}
                        </div>
                        <div className="guidance-info">
                            <h4 className="guidance-title" dangerouslySetInnerHTML={{ __html: video.title }}></h4>
                            <div className="guidance-meta">
                                <span>{video.channel || video.channelName}</span>
                                <span>{video.date || (video.watchedAt && new Date(video.watchedAt).toLocaleDateString())}</span>
                            </div>
                            <p className="guidance-desc">{video.description && video.description.substring(0, 100) + '...'}</p>
                            <div className="guidance-actions">
                                <button className="btn-guidance-watch" onClick={() => handleWatchVideo(video)}>Watch Now</button>
                                <button className="btn-guidance-notes" onClick={() => handleOpenNotes(video)}>Notes</button>
                                <button className="btn-guidance-save" onClick={() => handleSaveVideo(video)}>Save</button>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>No videos found.</p>
            )}
        </div>
    );

    const renderMainContent = () => (
        <div className="guidance-full-layout">
            <aside className="guidance-sidebar">
                <h3>Navigation</h3>
                <ul className="guidance-topic-list">
                    <li className={`guidance-topic-item ${!showHistory && !selectedTopic ? 'active-sidebar-tab' : ''}`} onClick={() => { setShowHistory(false); setSelectedTopic(null); }}>
                        Home
                    </li>
                    <li className={`guidance-topic-item ${showHistory ? 'active-sidebar-tab' : ''}`} onClick={() => { setShowHistory(true); setSelectedTopic(null); }}>
                        Watch History
                        <span className="guidance-topic-count">{history.length}</span>
                    </li>
                </ul>
                <h3 style={{ marginTop: '24px' }}>Legal Topics</h3>
                <ul className="guidance-topic-list">
                    {topics.map(topic => (
                        <li key={topic.name} className={`guidance-topic-item ${selectedTopic === topic.name ? 'active-sidebar-tab' : ''}`} onClick={() => { setSelectedTopic(topic.name); setShowHistory(false); fetchVideos(topic.name); }}>
                            {topic.name}
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="guidance-main">
                {showHistory ? (
                    <div>
                        <div className="guidance-section-header">
                            <h2>Watch History</h2>
                            <p>Your recently watched legal education videos</p>
                        </div>
                        {renderVideoGrid(history)}
                    </div>
                ) : selectedTopic ? (
                    <div>
                        <button className="guidance-back-btn" onClick={() => setSelectedTopic(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                            Back to Home
                        </button>
                        <div className="guidance-section-header">
                            <h2>{selectedTopic} Resources</h2>
                            <p>Comprehensive video resources for {selectedTopic.toLowerCase()}</p>
                        </div>
                        {renderVideoGrid(videos)}
                    </div>
                ) : (
                    <>
                        <div className="guidance-filter-tabs">
                            {['all', 'recent', 'trending', 'beginner', 'advanced'].map(tab => (
                                <button
                                    key={tab}
                                    className={`guidance-tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                        {renderVideoGrid(videos)}
                    </>
                )}
            </main>
        </div>
    );

    return (
        <div className="dashboard-body">
            <LawyerSidebar />
            <div className="dashboard-main" style={{ background: '#f8fafc' }}>
                <header className="dg-page-header">
                    <div className="dg-header-content">
                        <div>
                            <h1>Digital Guidance</h1>
                            <p>Search and watch legal education videos from YouTube</p>
                        </div>
                        <form className="dg-search-form" onSubmit={handleSearchSubmit}>
                            <svg className="dg-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search legal topics on YouTube..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit">Search</button>
                        </form>
                    </div>
                </header>

                <div className="dg-content-area">
                    {watchingVideo ? renderWatchingView() : renderMainContent()}
                </div>

                {/* Notes Modal */}
                {isNotesModalOpen && (
                    <div className="notes-modal-overlay">
                        <div className="notes-modal">
                            <div className="notes-modal-header">
                                <h3>Notes for: <span dangerouslySetInnerHTML={{ __html: activeVideo?.title }}></span></h3>
                                <button onClick={() => setIsNotesModalOpen(false)} className="notes-close-btn">✖</button>
                            </div>
                            <div className="notes-modal-body">
                                <textarea 
                                    className="notes-textarea" 
                                    placeholder="Jot down important legal points, case citations, or procedural steps here..."
                                    value={notesContent}
                                    onChange={(e) => setNotesContent(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="notes-modal-footer">
                                <button className="btn-cancel" onClick={() => setIsNotesModalOpen(false)}>Cancel</button>
                                <button className="btn-save" onClick={handleSaveNotes} disabled={savingNotes}>
                                    {savingNotes ? 'Saving...' : 'Save Notes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LawyerDigitalGuidancePage;

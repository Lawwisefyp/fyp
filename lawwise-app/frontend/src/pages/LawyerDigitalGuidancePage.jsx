import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LawyerDigitalGuidance.css';
import { youtubeService } from '../services/youtubeService';
import { authService } from '../services/api';

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
        { name: 'Constitutional Law', count: 24, icon: '⚖️' },
        { name: 'Contract Law', count: 31, icon: '📄' },
        { name: 'Criminal Procedure', count: 19, icon: '⛓️' },
        { name: 'Civil Litigation', count: 27, icon: '🏛️' },
        { name: 'Corporate Law', count: 22, icon: '💼' },
        { name: 'Family Law', count: 18, icon: '👨‍👩‍👧' },
        { name: 'Property Law', count: 15, icon: '🏠' },
        { name: 'Evidence Law', count: 21, icon: '🔍' },
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
        if (searchQuery) {
            fetchVideos(searchQuery);
        }
    };

    const handleWatchVideo = async (video) => {
        setWatchingVideo(video);
        setNotesContent(video.notes || '');

        // Save to history in backend
        try {
            const response = await authService.saveHistory({
                videoId: video.id || video.videoId,
                title: video.title,
                thumbnail: video.thumb || video.thumbnail,
                channelName: video.channel || video.channelName
            });
            if (response.success) {
                // If the video didn't have an _id (it was from search), 
                // update it with the one from history so notes can be saved.
                if (!video._id) {
                    setWatchingVideo(response.historyItem);
                }
                fetchHistory(); // Refresh history
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
            // It's from search, not history. Save it to history first to get an _id.
            try {
                const response = await authService.saveHistory({
                    videoId: video.id || video.videoId,
                    title: video.title,
                    thumbnail: video.thumb || video.thumbnail,
                    channelName: video.channel || video.channelName
                });
                if (response.success) {
                    historyVideo = response.historyItem;
                    fetchHistory(); // refresh history list
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
                <button className="btn-back-results" onClick={() => { setWatchingVideo(null); setAiSummary(''); }}>← Back to Resources</button>
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
                            {loadingSummary ? '✨ Generating Summary...' : '✨ AI Summary'}
                        </button>
                    </div>
                    {(loadingSummary || aiSummary) && (
                        <div className="ai-summary-panel">
                            <div className="ai-summary-header">
                                <h3>✨ AI-Generated Summary</h3>
                            </div>
                            <div className="ai-summary-content">
                                {loadingSummary ? (
                                    <div className="ai-summary-loading">
                                        <div className="loading-spinner"></div>
                                        <p>Analyzing video content with AI...</p>
                                    </div>
                                ) : (
                                    <div className="ai-summary-text" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br>').replace(/### (.*)/g, '<h4>$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/- (.*?)(<br>|$)/g, '<li>$1</li>') }}></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="watching-notes-panel">
                    <div className="notes-panel-header">
                        <h3>📝 Take Notes</h3>
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
                        {savingNotes ? 'Saving...' : 'Save progress'}
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
                            {!video.thumb && !video.thumbnail && '📺'}
                        </div>
                        <div className="guidance-info">
                            <h4 className="guidance-title" dangerouslySetInnerHTML={{ __html: video.title }}></h4>
                            <div className="guidance-meta">
                                <span>{video.channel || video.channelName}</span>
                                <span>{video.date || (video.watchedAt && new Date(video.watchedAt).toLocaleDateString())}</span>
                            </div>
                            <p className="guidance-desc">{video.description && video.description.substring(0, 100) + '...'}</p>
                            <div className="guidance-actions">
                                <button className="btn-guidance-watch" onClick={() => handleWatchVideo(video)}>Watch</button>
                                <button className="btn-guidance-notes" onClick={() => handleOpenNotes(video)}>📝 Notes</button>
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
        <div className="guidance-layout">
            <aside className="guidance-sidebar">
                <h3>Navigation</h3>
                <ul className="guidance-topic-list">
                    <li className={`guidance-topic-item ${!showHistory ? 'active-sidebar-tab' : ''}`} onClick={() => { setShowHistory(false); setSelectedTopic(null); }}>
                        Home
                        <span className="guidance-topic-count">🏠</span>
                    </li>
                    <li className={`guidance-topic-item ${showHistory ? 'active-sidebar-tab' : ''}`} onClick={() => { setShowHistory(true); setSelectedTopic(null); }}>
                        Watch History
                        <span className="guidance-topic-count">{history.length}</span>
                    </li>
                </ul>
                <h3 style={{ marginTop: '30px' }}>Legal Topics</h3>
                <ul className="guidance-topic-list">
                    {topics.map(topic => (
                        <li key={topic.name} className="guidance-topic-item" onClick={() => { setSelectedTopic(topic.name); setShowHistory(false); fetchVideos(topic.name); }}>
                            {topic.name}
                            <span className="guidance-topic-count">{topic.icon}</span>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="guidance-main">
                {showHistory ? (
                    <div>
                        <div className="guidance-header" style={{ marginBottom: '20px' }}>
                            <h1>📜 Watch History</h1>
                            <p>Your recently watched videos from various legal topics</p>
                        </div>
                        {renderVideoGrid(history)}
                    </div>
                ) : selectedTopic ? (
                    <div>
                        <button className="guidance-tab" onClick={() => setSelectedTopic(null)} style={{ marginBottom: '20px' }}>← Back to Home</button>
                        <div className="guidance-header">
                            <h1>{selectedTopic} Resources</h1>
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
        <div className="guidance-body">
            <div className="guidance-container">
                <Link to="/lawyer-dashboard" style={{ color: '#0369a1', fontWeight: '700', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>← Back to Dashboard</Link>

                <header className="guidance-header">
                    <h1>🎓 Digital Guidance</h1>
                    <p>Search and watch any legal education videos directly from YouTube</p>
                    <form className="guidance-search-container" onSubmit={handleSearchSubmit}>
                        <span className="guidance-search-icon">🔍</span>
                        <input
                            type="text"
                            className="guidance-search-input"
                            placeholder="Enter any topic to search YouTube (e.g. Criminal Law, Contract Law)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn-guidance-search">Search</button>
                    </form>
                </header>

                {watchingVideo ? renderWatchingView() : renderMainContent()}

                {/* Notes Modal */}
                {isNotesModalOpen && (
                    <div className="notes-modal-overlay">
                        <div className="notes-modal">
                            <div className="notes-modal-header">
                                <h3>📝 Notes for: <span dangerouslySetInnerHTML={{ __html: activeVideo?.title }}></span></h3>
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

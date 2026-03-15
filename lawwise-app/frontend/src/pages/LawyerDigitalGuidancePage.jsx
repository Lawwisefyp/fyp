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

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
    };

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery) {
                fetchVideos(searchQuery);
            }
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, fetchVideos]);

    const handleWatchVideo = async (video) => {
        // Open video in new tab
        window.open(video.url || `https://www.youtube.com/watch?v=${video.id}`, '_blank');

        // Save to history in backend
        try {
            await authService.saveHistory({
                videoId: video.id || video.videoId,
                title: video.title,
                thumbnail: video.thumb || video.thumbnail,
                channelName: video.channel || video.channelName
            });
            fetchHistory(); // Refresh history
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    };

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
                                <button className="btn-guidance-watch" onClick={() => handleWatchVideo(video)}>Watch Now</button>
                                <button className="btn-guidance-save">Save</button>
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
                    <div className="guidance-search-container">
                        <span className="guidance-search-icon">🔍</span>
                        <input
                            type="text"
                            className="guidance-search-input"
                            placeholder="Enter any topic to search YouTube (e.g. Criminal Law, Contract Law)..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                </header>

                {renderMainContent()}
            </div>
        </div>
    );
};

export default LawyerDigitalGuidancePage;

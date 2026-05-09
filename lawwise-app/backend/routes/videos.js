const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Default search queries for the home page
const DEFAULT_QUERIES = [
    'legal education law lecture',
    'court procedure tutorial law',
    'Pakistan law legal rights'
];

// @route   GET /api/videos/search?q=query
// @desc    Search YouTube videos
// @access  Private
router.get('/search', auth, async (req, res) => {
    const query = req.query.q || '';
    const apiKey = process.env.YOUTUBE_API_KEY;

    // Always try YouTube API first if key exists
    if (apiKey && apiKey.trim()) {
        try {
            const searchQuery = query.trim() 
                ? query + ' law legal education' 
                : 'legal education law lecture Pakistan';

            const response = await axios.get(`${BASE_URL}/search`, {
                params: {
                    part: 'snippet',
                    maxResults: 12,
                    q: searchQuery,
                    type: 'video',
                    relevanceLanguage: 'en',
                    key: apiKey
                },
                timeout: 8000
            });

            const videos = response.data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                description: item.snippet.description,
                thumb: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                date: new Date(item.snippet.publishedAt).toLocaleDateString(),
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));

            if (videos.length > 0) {
                return res.json({ success: true, videos, source: 'youtube_api' });
            }
        } catch (error) {
            console.error('YouTube API error:', error.response?.data?.error?.message || error.message);
        }
    }

    // Fallback: return empty with a message
    return res.json({ 
        success: true, 
        videos: [], 
        source: 'none',
        message: 'YouTube API key missing or invalid. Please add a valid YOUTUBE_API_KEY to your .env file.'
    });
});

module.exports = router;

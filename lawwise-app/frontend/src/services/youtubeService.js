import axios from 'axios';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const youtubeService = {
    searchVideos: async (query) => {
        try {
            if (!API_KEY) {
                console.error('YouTube API Key is missing');
                return [];
            }

            const response = await axios.get(`${BASE_URL}/search`, {
                params: {
                    part: 'snippet',
                    maxResults: 12,
                    q: query,
                    type: 'video',
                    key: API_KEY
                }
            });

            return response.data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                description: item.snippet.description,
                thumb: item.snippet.thumbnails.high.url,
                date: new Date(item.snippet.publishedAt).toLocaleDateString(),
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));
        } catch (error) {
            console.error('YouTube search error:', error);
            return [];
        }
    }
};

export default youtubeService;

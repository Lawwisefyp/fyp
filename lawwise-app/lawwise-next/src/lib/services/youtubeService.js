import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const CURATED_VIDEOS = {
    'Court Procedure': [
        { id: 'HIUhVfooVZ4', title: 'Courtroom Etiquette and Procedure', channel: 'Legal Practice', thumb: 'https://i.ytimg.com/vi/HIUhVfooVZ4/hqdefault.jpg' },
        { id: 'ZuKsY8B6OZI', title: 'How to Address the Judge', channel: 'Professional Law', thumb: 'https://i.ytimg.com/vi/ZuKsY8B6OZI/hqdefault.jpg' },
        { id: 'o_TaCEX8NYw', title: 'Trial Advocacy Basics', channel: 'Litigation Pro', thumb: 'https://i.ytimg.com/vi/o_TaCEX8NYw/hqdefault.jpg' }
    ],
    'Family Law': [
        { id: 'LZqi4doRzD4', title: 'Understanding Child Custody', channel: 'Family Law Center', thumb: 'https://i.ytimg.com/vi/LZqi4doRzD4/hqdefault.jpg' },
        { id: 'P5ewYjWVZSc', title: 'Divorce Process Explained', channel: 'Legal Help', thumb: 'https://i.ytimg.com/vi/P5ewYjWVZSc/hqdefault.jpg' }
    ],
    'Civil Litigation': [
        { id: 'Rb8JlfYICJ4', title: 'Phase of a Civil Lawsuit', channel: 'Lawyer Guide', thumb: 'https://i.ytimg.com/vi/Rb8JlfYICJ4/hqdefault.jpg' },
        { id: 'yNzKR0d0fEw', title: 'Discovery and Evidence', channel: 'Litigation Masters', thumb: 'https://i.ytimg.com/vi/yNzKR0d0fEw/hqdefault.jpg' }
    ],
    'Corporate Law': [
        { id: 'mGVJIvH8YYw', title: 'Business Entity Types', channel: 'Corporate Academy', thumb: 'https://i.ytimg.com/vi/mGVJIvH8YYw/hqdefault.jpg' },
        { id: 'kXVj_2XP1dU', title: 'Contract Negotiations 101', channel: 'Business Law', thumb: 'https://i.ytimg.com/vi/kXVj_2XP1dU/hqdefault.jpg' }
    ],
    'Legal Drafting': [
        { id: 'BpJHQX1acfI', title: 'How to Draft Legal Notices', channel: 'Legal Skills', thumb: 'https://i.ytimg.com/vi/BpJHQX1acfI/hqdefault.jpg' },
        { id: 'MiSlDpDQxbk', title: 'Professional Pleading Drafting', channel: 'Drafting Pro', thumb: 'https://i.ytimg.com/vi/MiSlDpDQxbk/hqdefault.jpg' }
    ]
};

export const youtubeService = {
    searchVideos: async (query) => {
        // If no query, return all curated videos as default
        if (!query) {
            return youtubeService.getFallbackVideos();
        }

        // If query matches a curated category, return those first
        if (CURATED_VIDEOS[query]) {
            return CURATED_VIDEOS[query].map(v => ({
                ...v,
                url: `https://www.youtube.com/watch?v=${v.id}`,
                date: 'Featured',
                description: `Educational video on ${query}`
            }));
        }

        try {
            if (!API_KEY) {
                console.warn('YouTube API Key is missing, providing curated content');
                return this.getFallbackVideos();
            }

            const response = await axios.get(`${BASE_URL}/search`, {
                params: {
                    part: 'snippet',
                    maxResults: 12,
                    q: query || 'legal procedures legal education',
                    type: 'video',
                    key: API_KEY
                }
            });

            const results = response.data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                description: item.snippet.description,
                thumb: item.snippet.thumbnails.high.url,
                date: new Date(item.snippet.publishedAt).toLocaleDateString(),
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));

            // If no results from API, provide fallbacks
            return results.length > 0 ? results : youtubeService.getFallbackVideos();
        } catch (error) {
            console.error('YouTube search error:', error);
            return youtubeService.getFallbackVideos();
        }
    },

    getFallbackVideos: () => {
        return Object.entries(CURATED_VIDEOS).flatMap(([category, videos]) => 
            videos.map(v => ({
                ...v,
                url: `https://www.youtube.com/watch?v=${v.id}`,
                date: 'Featured',
                description: `Curated educational content in ${category}`
            }))
        );
    }
};

export default youtubeService;

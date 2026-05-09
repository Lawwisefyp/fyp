import { authService } from './api';

// YouTube service now calls the backend API instead of YouTube directly.
// This ensures the API key stays on the server and search always works.

export const youtubeService = {
    searchVideos: async (query) => {
        try {
            const response = await authService.searchVideos(query);
            if (response.success) {
                return response.videos;
            }
            return [];
        } catch (error) {
            console.error('Video search error:', error);
            return [];
        }
    }
};

export default youtubeService;

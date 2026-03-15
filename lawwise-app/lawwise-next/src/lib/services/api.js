import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const lawyerToken = localStorage.getItem('lawyerToken') || sessionStorage.getItem('lawyerToken');
        const clientToken = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
        const studentToken = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');

        let token = null;
        const path = window.location.pathname;

        if (path.includes('/client') || path.includes('/search-lawyers')) {
            token = clientToken || lawyerToken || studentToken;
        } else if (path.includes('/student')) {
            token = studentToken || lawyerToken || clientToken;
        } else {
            token = lawyerToken || clientToken || studentToken;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    clientLogin: async (email, password) => {
        const response = await api.post('/clients/login', { email, password });
        return response.data;
    },
    clientRegister: async (userData) => {
        const response = await api.post('/clients/register', userData);
        return response.data;
    },
    studentLogin: async (email, password) => {
        const response = await api.post('/students/login', { email, password });
        return response.data;
    },
    studentRegister: async (userData) => {
        const response = await api.post('/students/register', userData);
        return response.data;
    },
    getDocuments: async () => {
        const response = await api.get('/documents');
        return response.data;
    },
    uploadDocument: async (formData) => {
        const response = await api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    // ... other methods will be ported as needed or I can port all now
    searchLawyers: async (params) => {
        const response = await api.get('/lawyer/search', { params });
        return response.data;
    },
    getLawyerProfile: async () => {
        const response = await api.get('/lawyer/profile');
        return response.data;
    },
    async getNotifications() {
        const response = await api.get('/notifications');
        return response.data;
    },
    async syncNotifications() {
        const response = await api.get('/notifications/sync');
        return response.data;
    },
    // Unified Messaging Methods
    async getChatContacts() {
        const response = await api.get('/messages/contacts');
        return response.data;
    },
    async getMessages(otherId) {
        const response = await api.get(`/messages?userId=${otherId}`);
        return response.data;
    },
    async sendMessage(messageData) {
        const response = await api.post('/messages', messageData);
        return response.data;
    },
    async forgotPassword(email, userType) {
        const response = await api.post('/auth/forgot-password', { email, userType });
        return response.data;
    },
    verifyOTP: async (email, otp, userType) => {
        const response = await api.post('/auth/verify-otp', { email, otp, userType });
        return response.data;
    },
    resetPassword: async (email, otp, newPassword, userType) => {
        const response = await api.post('/auth/reset-password', { email, otp, newPassword, userType });
        return response.data;
    },
    deleteDocument: async (id) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/history');
        return response.data;
    },
    saveHistory: async (videoData) => {
        const response = await api.post('/history', videoData);
        return response.data;
    },
    async respondToConnection(notificationId, response) {
        const res = await api.post('/notifications/respond', { notificationId, response });
        return res.data;
    },
    async updateLawyerProfile(formData) {
        const response = await api.post('/lawyer/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getLawyers: async () => {
        const response = await api.get('/lawyer/search', { params: { showAll: true } });
        return response.data;
    },
    getLawyerDetails: async (id) => {
        const response = await api.get(`/lawyer/search/${id}`); // Assuming this route for single lawyer
        return response.data;
    },
    sendConnectionRequest: async (targetLawyerId) => {
        const response = await api.post('/notifications/connect', { targetLawyerId });
        return response.data;
    },
    sendOfficialEmail: async (emailData) => {
        const response = await api.post('/messages/send-email', emailData);
        return response.data;
    },
    getPerfectMatch: async (params) => {
        const response = await api.get('/lawyer/match', { params });
        return response.data;
    },
    fileCase: async (formData) => {
        const response = await api.post('/cases', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getCases: async () => {
        const response = await api.get('/cases');
        return response.data;
    },
    createCase: async (caseData) => {
        const response = await api.post('/cases', caseData);
        return response.data;
    },
    updateCase: async (caseId, updateData) => {
        const response = await api.put(`/cases/${caseId}`, updateData);
        return response.data;
    },
    updateCaseProgress: async (caseId, stageId) => {
        const response = await api.put(`/cases/${caseId}/progress`, { stageId });
        return response.data;
    },
    getUnassignedCases: async () => {
        const response = await api.get('/cases/unassigned');
        return response.data;
    },
    claimCase: async (caseId) => {
        const response = await api.post(`/cases/claim/${caseId}`);
        return response.data;
    },
    getTemplates: async () => {
        const response = await api.get('/drafting/templates');
        return response.data;
    },
    generateDraft: async (formData) => {
        const response = await api.post('/drafting/generate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    async getMyDrafts() {
        const response = await api.get('/drafting/my-drafts');
        return response.data;
    },
    // Student Library Methods
    searchOnlineLaw: async (q, mode = 'statutes') => {
        const response = await api.get('/student/library/search-online', { params: { q, mode } });
        return response.data;
    },
    getSavedLibrary: async () => {
        const response = await api.get('/student/library/saved');
        return response.data;
    },
    saveToLibrary: async (data) => {
        const response = await api.post('/student/library/saved', data);
        return response.data;
    },
    removeFromLibrary: async (id) => {
        const response = await api.delete(`/student/library/saved/${id}`);
        return response.data;
    },
    getStudentAnalytics: async () => {
        const response = await api.get('/student/analytics');
        return response.data;
    },
    // Quiz & Notes Methods
    getMyNotes: async (folderId = '') => {
        const response = await api.get('/student/notes', { params: { folderId } });
        return response.data;
    },
    getPublicNotes: async () => {
        const response = await api.get('/student/notes/public');
        return response.data;
    },
    uploadNote: async (formData) => {
        const response = await api.post('/student/notes/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    downloadNote: async (id) => {
        const response = await api.post(`/student/notes/download/${id}`);
        return response.data;
    },
    getNoteAIExplanation: async (id) => {
        const response = await api.post(`/student/notes/ai-explain/${id}`);
        return response.data;
    },
    togglePublicNote: async (id, isPublic) => {
        const response = await api.put(`/student/notes/${id}/public`, { isPublic });
        return response.data;
    },
    getFolders: async () => {
        const response = await api.get('/student/folders');
        return response.data;
    },
    createFolder: async (name) => {
        const response = await api.post('/student/folders', { name });
        return response.data;
    },
    generateNoteQuiz: async (id) => {
        const response = await api.post(`/student/notes/${id}/generate-quiz`);
        return response.data;
    },
    getQuizById: async (id) => {
        const response = await api.get(`/student/quizzes/${id}`);
        return response.data;
    },
};

export default api;

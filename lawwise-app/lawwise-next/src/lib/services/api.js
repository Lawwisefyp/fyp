import axios from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api';

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

        // Use userType as the source of truth for which token to use.
        // This prevents the wrong token from being sent when a client
        // visits a URL that doesn't start with '/client' (e.g. lawyer profile pages).
        const userType = localStorage.getItem('userType');

        if (userType === 'client') {
            token = clientToken;
        } else if (userType === 'lawyer') {
            token = lawyerToken;
        } else if (userType === 'student') {
            token = studentToken;
        }

        // Fallback in case userType is not set
        if (!token) {
            token = lawyerToken || clientToken || studentToken;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor to handle 429 and other global errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 429) {
            // Silently swallow 429s from polling to avoid console noise
            return new Promise(() => { }); // Return a pending promise to stop the chain
        }
        return Promise.reject(error);
    }
);

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
    async getUnreadNotificationCount() {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },
    async markNotificationsAsRead() {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },
    async deleteNotification(id) {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },
    async getAcceptedConnections() {
        const response = await api.get('/notifications/connections');
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
        // Handle FormData for file uploads if needed
        const config = messageData instanceof FormData ? {
            headers: { 'Content-Type': 'multipart/form-data' }
        } : {};

        const response = await api.post('/messages', messageData, config);
        return response.data;
    },
    async markMessagesAsRead(otherId) {
        const response = await api.patch(`/messages/mark-read/${otherId}`);
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
    updateHistoryNotes: async (id, notes) => {
        const response = await api.put(`/history/${id}/notes`, { notes });
        return response.data;
    },
    getVideoAISummary: async (title, description, channelName) => {
        const response = await api.post('/history/ai-summary', { title, description, channelName });
        return response.data;
    },
    searchVideos: async (query) => {
        const response = await api.get('/videos/search', { params: { q: query } });
        return response.data;
    },
    getAnalytics: async () => {
        const response = await api.get('/analytics');
        return response.data;
    },
    async respondToConnection(requestId, status) {
        const res = await api.post('/connections/respond', { requestId, status });
        return res.data;
    },
    async getPendingConnections() {
        const res = await api.get('/connections/pending');
        return res.data;
    },
    async getMyClients() {
        const res = await api.get('/connections/my-clients');
        return res.data;
    },
    async getConnectionStatus(lawyerId) {
        const res = await api.get(`/connections/status/${lawyerId}`);
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
        const response = await api.get(`/lawyer/${id}`);
        return response.data;
    },
    sendConnectionRequest: async (lawyerId) => {
        const response = await api.post('/connections/request', { lawyerId });
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
    fileCaseRequest: async (formData) => {
        const response = await api.post('/case-requests/file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    assignLawyerToRequest: async (requestId, lawyerId) => {
        const response = await api.post('/case-requests/assign-lawyer', { requestId, lawyerId });
        return response.data;
    },
    getCaseRequestsMarketplace: async () => {
        const response = await api.get('/case-requests/marketplace');
        return response.data;
    },
    updateAvailability: async (availability) => {
        const response = await api.put('/lawyer/availability', { availability });
        return response.data;
    },
    getMyCaseRequests: async () => {
        const response = await api.get('/case-requests/my-requests');
        return response.data;
    },
    respondToCaseRequest: async (requestId, data) => {
        const response = await api.post(`/case-requests/${requestId}/respond`, data);
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
    addReminder: async (caseId, formData) => {
        const response = await api.post(`/cases/${caseId}/reminders`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateCase: async (caseId, updateData) => {
        const response = await api.put(`/cases/${caseId}`, updateData);
        return response.data;
    },
    // Explicitly set case status: 'pending' | 'active' | 'completed'
    updateCaseStatus: async (caseId, status) => {
        const response = await api.patch(`/cases/${caseId}/status`, { status });
        return response.data;
    },
    updateCaseProgress: async (caseId, stageId) => {
        const response = await api.put(`/cases/${caseId}/progress`, { stageId });
        return response.data;
    },
    downloadFile: async (caseId, filename) => {
        const response = await api.get(`/cases/${caseId}/documents/${filename}`, {
            responseType: 'blob'
        });
        return response.data;
    },
    getUnassignedCases: async () => {
        const response = await api.get('/cases/unassigned');
        return response.data;
    },
    getMarketplaceCases: async () => {
        const response = await api.get('/cases/unassigned');
        return response.data;
    },
    claimCase: async (caseId) => {
        const response = await api.post(`/cases/claim/${caseId}`);
        return response.data;
    },
    deleteCase: async (caseId) => {
        const response = await api.delete(`/cases/${caseId}`);
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
        const response = await api.get('/students/library/search-online', { params: { q, mode } });
        return response.data;
    },
    getSavedLibrary: async () => {
        const response = await api.get('/students/library/saved');
        return response.data;
    },
    saveToLibrary: async (data) => {
        const response = await api.post('/students/library/saved', data);
        return response.data;
    },
    removeFromLibrary: async (id) => {
        const response = await api.delete(`/students/library/saved/${id}`);
        return response.data;
    },
    getStudentAnalytics: async () => {
        const response = await api.get('/students/analytics');
        return response.data;
    },
    saveQuizResult: async (resultData) => {
        const response = await api.post('/students/quizzes/save-result', resultData);
        return response.data;
    },
    // Quiz & Notes Methods
    getMyNotes: async (folderId = '') => {
        const response = await api.get('/students/notes', { params: { folderId } });
        return response.data;
    },
    getPublicNotes: async () => {
        const response = await api.get('/students/notes/public');
        return response.data;
    },
    uploadNote: async (formData) => {
        const response = await api.post('/students/notes/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    downloadNote: async (id) => {
        const response = await api.post(`/students/notes/download/${id}`);
        return response.data;
    },
    getNoteAIExplanation: async (id) => {
        const response = await api.post(`/students/notes/ai-explain/${id}`);
        return response.data;
    },
    togglePublicNote: async (id, isPublic) => {
        const response = await api.put(`/students/notes/${id}/public`, { isPublic });
        return response.data;
    },
    getFolders: async () => {
        const response = await api.get('/students/folders');
        return response.data;
    },
    createFolder: async (name) => {
        const response = await api.post('/students/folders', { name });
        return response.data;
    },
    generateNoteQuiz: async (id) => {
        const response = await api.post(`/students/notes/${id}/generate-quiz`);
        return response.data;
    },
    getQuizById: async (id) => {
        const response = await api.get(`/students/quizzes/${id}`);
        return response.data;
    },
    // Past Papers Methods
    getPastPapers: async (params) => {
        const response = await api.get('/students/past-papers', { params });
        return response.data;
    },
    uploadPastPaper: async (formData) => {
        const response = await api.post('/students/past-papers/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    downloadPastPaper: async (id) => {
        const response = await api.post(`/students/past-papers/download/${id}`);
        return response.data;
    },
    startAnalysis: async (documentIds) => {
        const response = await api.post('/chat', {
            message: "Please provide a comprehensive legal analysis and summary of the selected documents. Highlight key clauses, obligations, and any potential legal risks or noteworthy points.",
            documentIds: documentIds,
            isDocumentAnalysis: true
        });
        return response.data;
    },
    getBriefcaseHistory: async () => {
        const response = await api.get('/chat/history?module=briefcase');
        return response.data;
    },
    getChatSession: async (sessionId) => {
        const response = await api.get(`/chat/history/${sessionId}`);
        return response.data;
    },
};

export const appointmentService = {
    getLawyerSlots: async (lawyerId) => {
        const response = await api.get(`/appointments/lawyer/${lawyerId}/slots`);
        return response.data;
    },
    bookAppointment: async (data) => {
        const response = await api.post('/appointments/book', data);
        return response.data;
    },
    getMyAppointments: async () => {
        const response = await api.get('/appointments/my-appointments');
        return response.data;
    }
};

export const reviewService = {
    submitReview: async (reviewData) => {
        const response = await api.post('/reviews', reviewData);
        return response.data;
    },
    getLawyerReviews: async (lawyerId) => {
        const response = await api.get(`/reviews/lawyer/${lawyerId}`);
        return response.data;
    },
    getClientReviews: async () => {
        const response = await api.get('/reviews/client');
        return response.data;
    },
    replyToReview: async (reviewId, reply) => {
        const response = await api.put(`/reviews/${reviewId}/reply`, { reply });
        return response.data;
    }
};

export default api;

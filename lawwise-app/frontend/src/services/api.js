import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const lawyerToken = localStorage.getItem('lawyerToken') || sessionStorage.getItem('lawyerToken');
    const clientToken = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
    const studentToken = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');

    let token = null;
    const path = window.location.pathname;

    // Prioritize token based on the portal being used
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
    getStudentLibrary: async (params) => {
        const response = await api.get('/students/library', { params });
        return response.data;
    },
    saveToLibrary: async (documentData) => {
        const response = await api.post('/students/library/save', documentData);
        return response.data;
    },
    getSavedLibrary: async () => {
        const response = await api.get('/students/library/saved');
        return response.data;
    },
    removeFromLibrary: async (id) => {
        const response = await api.delete(`/students/library/saved/${id}`);
        return response.data;
    },
    getStudentQuizzes: async () => {
        const response = await api.get('/students/quizzes');
        return response.data;
    },
    getQuizDetails: async (id) => {
        const response = await api.get(`/students/quizzes/${id}`);
        return response.data;
    },
    getSharedNotes: async () => {
        const response = await api.get('/students/notes');
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
    fetchPublicNotes: async () => {
        const response = await api.get('/students/notes/public');
        return response.data;
    },
    getMyNotes: async (folderId = '') => {
        const response = await api.get('/students/notes', { params: { folderId } });
        return response.data;
    },
    getFolders: async () => {
        const response = await api.get('/students/folders');
        return response.data;
    },
    getQuizById: async (id) => {
        const response = await api.get(`/students/quizzes/${id}`);
        return response.data;
    },
    createFolder: async (name) => {
        const response = await api.post('/students/folders', { name });
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
    generateNoteQuiz: async (id) => {
        const response = await api.post(`/students/notes/${id}/generate-quiz`);
        return response.data;
    },
    searchOnlineLaw: async (query, mode = 'statutes') => {
        const response = await api.get('/students/library/search-online', { params: { q: query, mode } });
        return response.data;
    },
    searchLawyers: async (params) => {

        const response = await api.get('/lawyer/search', { params });
        return response.data;
    },
    getLawyerDetails: async (id) => {
        const response = await api.get(`/lawyer/${id}`);
        return response.data;
    },
    getPerfectMatch: async (params) => {
        const response = await api.get('/lawyer/match', { params });
        return response.data;
    },
    sendMessage: async (messageData) => {
        const response = await api.post('/messages/send', messageData);
        return response.data;
    },
    getChatHistory: async (otherLawyerId) => {
        const response = await api.get(`/messages/chat/${otherLawyerId}`);
        return response.data;
    },

    // Agentic Legal Drafting
    getTemplates: async () => {
        const response = await api.get('/drafting/templates');
        return response.data;
    },
    generateDraft: async (formData) => {
        // formData should contain documentType, details, title, and files
        const response = await api.post('/drafting/generate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getMyDrafts: async () => {
        const response = await api.get('/drafting/my-drafts');
        return response.data;
    },
    getNotifications: async (lawyerId) => {
        const response = await api.get(`/notifications?lawyerId=${lawyerId}`);
        return response.data;
    },
    syncNotifications: async () => {
        const response = await api.get('/notifications/sync');
        return response.data;
    },
    respondToConnection: async (notificationId, response) => {
        const res = await api.post('/notifications/respond', { notificationId, response });
        return res.data;
    },
    getLawyerProfile: async () => {
        const response = await api.get('/lawyer/profile');
        return response.data;
    },
    updateLawyerProfile: async (formData) => {
        const response = await api.post('/lawyer/profile', formData);
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
    updateCase: async (caseId, caseData) => {
        const response = await api.put(`/cases/${caseId}`, caseData);
        return response.data;
    },
    updateCaseProgress: async (caseId, stageId) => {
        const response = await api.put(`/cases/${caseId}/progress`, { stageId });
        return response.data;
    },
    getLawyers: async () => {
        const response = await api.get('/lawyer/search', { params: { showAll: true } });
        return response.data;
    },
    sendConnectionRequest: async (targetLawyerId) => {
        const response = await api.post('/notifications/connect', { targetLawyerId });
        return response.data;
    },
    fileCase: async (formData) => {
        const response = await api.post('/cases/file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getClientCases: async (email) => {
        const response = await api.get(`/cases/client/${email}`);
        return response.data;
    },
    saveHistory: async (videoData) => {
        const response = await api.post('/history', videoData);
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/history');
        return response.data;
    },
    uploadDocument: async (formData) => {
        const response = await api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getDocuments: async () => {
        const response = await api.get('/documents');
        return response.data;
    },
    deleteDocument: async (id) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    },
    sendOfficialEmail: async (emailData) => {
        const response = await api.post('/official-emails/send', emailData);
        return response.data;
    },
    getChatContacts: async () => {
        const response = await api.get('/messages/contacts');
        return response.data;
    },
    getMessages: async (otherId) => {
        const response = await api.get(`/messages/chat/${otherId}`);
        return response.data;
    },

    // Password Recovery
    forgotPassword: async (email, userType) => {
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
    verifyEmail: async (token, type) => {
        const response = await api.get('/auth/verify-email', { params: { token, type } });
        return response.data;
    },
    resendVerification: async (email, userType) => {
        const response = await api.post('/auth/resend-verification', { email, userType });
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
};

export default api;

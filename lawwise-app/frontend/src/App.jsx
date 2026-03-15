import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LawyerPortalPage from './pages/LawyerPortalPage';
import ClientPortalPage from './pages/ClientPortalPage';
import LawyerDashboard from './pages/LawyerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import LawyerCaseMarketplacePage from './pages/LawyerCaseMarketplacePage';
import SearchLawyersPage from './pages/SearchLawyersPage';
import LawyerChatbot from './pages/LawyerChatbot';
import LawyerNotificationsPage from './pages/LawyerNotificationsPage';
import LawyerProfilePage from './pages/LawyerProfilePage';
import LawyerCaseHistoryPage from './pages/LawyerCaseHistoryPage';
import LawyerDigitalGuidancePage from './pages/LawyerDigitalGuidancePage';
import LawyerMiniLawLibraryPage from './pages/LawyerMiniLawLibraryPage';
import LawyerNetworkingPage from './pages/LawyerNetworkingPage';
import LawyerPublicProfilePage from './pages/LawyerPublicProfilePage';
import ClientEFilingPage from './pages/ClientEFilingPage';
import ClientMyCasesPage from './pages/ClientMyCasesPage';
import LawyerAIDraftingPage from './pages/LawyerAIDraftingPage';
import CommunicationPage from './pages/CommunicationPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import StudentPortalPage from './pages/StudentPortalPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentLibraryPage from './pages/StudentLibraryPage';
import StudentQuizPage from './pages/StudentQuizPage';
import StudentNotesPage from './pages/StudentNotesPage';
import StudentLearningPage from './pages/StudentLearningPage';
import NoteQuizPage from './pages/NoteQuizPage';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Add more routes here as pages are converted */}
          <Route path="/lawyer-portal" element={<LawyerPortalPage />} />
          <Route path="/client-portal" element={<ClientPortalPage />} />
          <Route path="/student-portal" element={<StudentPortalPage />} />
          <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-library" element={<StudentLibraryPage />} />
          <Route path="/student-quizzes" element={<StudentQuizPage />} />
          <Route path="/student-notes" element={<StudentNotesPage />} />
          <Route path="/student-learning" element={<StudentLearningPage />} />
          <Route path="/take-quiz/:quizId" element={<NoteQuizPage />} />


          <Route path="/search-lawyers" element={<SearchLawyersPage />} />
          <Route path="/chatbot" element={<LawyerChatbot />} />
          <Route path="/notifications" element={<LawyerNotificationsPage />} />
          <Route path="/lawyer-profile" element={<LawyerProfilePage />} />
          <Route path="/case-history" element={<LawyerCaseHistoryPage />} />
          <Route path="/digital-guidance" element={<LawyerDigitalGuidancePage />} />
          <Route path="/law-library" element={<LawyerMiniLawLibraryPage />} />
          <Route path="/networking" element={<LawyerNetworkingPage />} />
          <Route path="/lawyer-public-profile/:id" element={<LawyerPublicProfilePage />} />
          <Route path="/ai-drafting" element={<LawyerAIDraftingPage />} />
          <Route path="/client-efiling" element={<ClientEFilingPage />} />
          <Route path="/lawyer-marketplace" element={<LawyerCaseMarketplacePage />} />
          <Route path="/client-my-cases" element={<ClientMyCasesPage />} />
          <Route path="/communication" element={<CommunicationPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;

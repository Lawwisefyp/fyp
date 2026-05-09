'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { authService } from '@/lib/services/api';
import {
    Bell,
    MessageSquare,
    Upload,
    Search,
    Star,
    Clock,
    CheckCircle,
    XCircle,
    Shield,
    FileText
} from 'lucide-react';
import '@/styles/Dashboard.css';

const ClientDashboard = () => {
    const [client, setClient] = useState(null);
    const [myRequests, setMyRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('clientInfo');
        const token = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');

        if (!token || !info) {
            router.push('/client-portal');
            return;
        }

        setClient(JSON.parse(info));
        fetchRequests();
    }, [router]);

    const fetchRequests = async () => {
        try {
            const res = await authService.getMyCaseRequests();
            if (res.success) {
                setMyRequests(res.requests);
            }
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('clientToken');
        sessionStorage.removeItem('clientToken');
        localStorage.removeItem('clientInfo');
        router.push('/client-portal');
    };

    if (!client) return <div className="dashboard-body"><div className="dashboard-container">Loading...</div></div>;

    const modules = [
        { title: 'Notifications', icon: Bell, desc: "View important messages", path: '/client-notifications', bg: '#eff6ff', color: '#3b82f6' },
        { title: 'Communication', icon: MessageSquare, desc: "Secure messaging with your lawyer", path: '/client-communication', bg: '#ecfdf5', color: '#10b981' },
        { title: 'Filed Cases', icon: FileText, desc: "Track your legal history", path: '/client-filed-cases', bg: '#fef2f2', color: '#ef4444' },
        { title: 'E-Filing Case', icon: Upload, desc: "Upload your case files", path: '/client-efiling', bg: '#fffbeb', color: '#f59e0b' },
        { title: 'Lawyer Filtering', icon: Search, desc: "Search and filter lawyers", path: '/search-lawyers', bg: '#f0f9ff', color: '#0ea5e9' },
        { title: 'Lawyer Reviews', icon: Star, desc: "Read and write reviews", path: '/lawyer-reviews', bg: '#fdf2f8', color: '#ec4899' }
    ];

    const initials = client.fullName ? client.fullName.split(' ').map(n => n[0]).join('') : 'C';

    const getStatusStyle = (status) => {
        switch (status) {
            case 'accepted': return { bg: '#ecfdf5', color: '#10b981', icon: CheckCircle };
            case 'rejected': return { bg: '#fef2f2', color: '#ef4444', icon: XCircle };
            case 'pending_review': return { bg: '#fffbeb', color: '#f59e0b', icon: Clock };
            default: return { bg: '#f8fafc', color: '#64748b', icon: Shield };
        }
    };

    return (
        <div className="dashboard-body">
            <ClientSidebar />

            <div className="dashboard-main">
                <header className="top-header">
                    <div className="top-header-left">
                        <h2>Client Dashboard</h2>
                        <p>Welcome back, {client.fullName}. Access your case details and legal tools.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-logout" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </header>

                <div className="dashboard-container">
                    {/* Profile Banner */}
                    <div className="profile-card">
                        <div className="profile-header">
                            <div className="profile-header-content">
                                <div className="profile-avatar">{initials}</div>
                                <div className="profile-main-info">
                                    <h2 className="profile-name">{client.fullName}</h2>
                                    <div className="profile-title">Client Account</div>
                                    <div className="profile-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">6</span>
                                            <span className="stat-label">Modules</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modules Grid */}
                    <div className="dashboard-section-title">Case Management Modules</div>
                    <div className="dashboard-features">
                        {modules.map((m, i) => (
                            <div key={i} className="feature-card" onClick={() => router.push(m.path)}>
                                <div className="feature-header">
                                    <div className="feature-icon" style={{ background: m.bg, color: m.color }}>
                                        <m.icon size={24} />
                                    </div>
                                    <h3 className="feature-title">{m.title}</h3>
                                </div>
                                <p className="feature-desc">{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;


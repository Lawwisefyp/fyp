'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    MessageSquare, 
    PenTool, 
    ClipboardList, 
    Library, 
    Mail, 
    Users, 
    Bell, 
    HelpCircle, 
    Activity, 
    Briefcase,
    Home,
    User,
    LogOut,
    Bot,
    X,
    CalendarDays,
    Star
} from 'lucide-react';
import { authService } from '@/lib/services/api';
import '@/styles/Dashboard.css';
import '@/styles/LawyerNetworking.css';

const LawyerSidebar = () => {
    const [lawyer, setLawyer] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    const fetchUnreadCount = async () => {
        try {
            const data = await authService.getUnreadNotificationCount();
            if (data.success) setUnreadCount(data.count);
        } catch (error) {
            // Silently ignore rate-limit or network errors for the badge count
            if (error?.response?.status !== 429) {
                console.error('Error fetching unread count:', error?.message);
            }
        }
    };

    useEffect(() => {
        const info = localStorage.getItem('lawyerInfo');
        if (info) {
            setLawyer(JSON.parse(info));
        }

        // Always fetch latest profile from server to ensure DP is up to date
        const refreshProfile = async () => {
            try {
                const data = await authService.getLawyerProfile();
                if (data && data.lawyer) {
                    // Merge fetched profile with existing info to preserve all fields
                    const existing = JSON.parse(localStorage.getItem('lawyerInfo') || '{}');
                    const updated = { ...existing, ...data.lawyer };
                    localStorage.setItem('lawyerInfo', JSON.stringify(updated));
                    setLawyer(updated);
                }
            } catch (err) {
                // Silently ignore — use cached data if server is unreachable
            }
        };

        refreshProfile();
        fetchUnreadCount();

        // Refresh count every minute
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const logout = () => {
        localStorage.removeItem('lawyerToken');
        sessionStorage.removeItem('lawyerToken');
        localStorage.removeItem('lawyerInfo');
        router.push('/lawyer-portal');
    };

    const features = [
        { title: 'AI Chatbot', icon: MessageSquare, path: '/chatbot' },
        { title: 'Legal Drafting', icon: PenTool, path: '/ai-drafting' },
        { title: 'Case History and Tracking', icon: ClipboardList, path: '/case-history' },
        { title: 'My Calendar', icon: CalendarDays, path: '/my-calendar' },
        { title: 'My Clients', icon: Users, path: '/my-clients' },
        { title: 'Briefcase', icon: Briefcase, path: '/law-library' },
        { title: 'Communication', icon: Mail, path: '/communication' },
        { title: 'Professional Networking', icon: Users, path: '/networking' },
        { title: 'Digital Guidance', icon: HelpCircle, path: '/digital-guidance' },
        { title: 'Client Reviews', icon: Star, path: '/lawyer-reputation' },
        { title: 'Analytics', icon: Activity, path: '/analytics' },
        { title: 'Case Marketplace', icon: Briefcase, path: '/lawyer-marketplace' }
    ];

    const avatarUrl = lawyer?.personalInfo?.profilePicture 
        ? `http://localhost:5001/${lawyer.personalInfo.profilePicture.replace(/\\/g, '/')}`
        : null;
    const initials = lawyer?.fullName ? lawyer.fullName.split(' ').map(n => n[0]).join('') : 'L';

    return (
        <>
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <Link href="/lawyer-dashboard" style={{ textDecoration: 'none' }}>
                        <h1>LAW<span>WISE</span></h1>
                    </Link>
                    <p>Legal Practice Management</p>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main</div>
                    <Link href="/lawyer-dashboard" className={`sidebar-nav-item ${pathname === '/lawyer-dashboard' ? 'active' : ''}`}>
                        <span className="sidebar-nav-icon"><Home size={18} /></span> Dashboard
                    </Link>

                    <div className="sidebar-section-label">Modules</div>
                    {features.map((f, i) => {
                        const Icon = f.icon;
                        const isActive = pathname === f.path;
                        return (
                            <Link key={i} href={f.path} className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                                <span className="sidebar-nav-icon"><Icon size={18} /></span> 
                                {f.title}
                                {f.title === 'Notifications' && unreadCount > 0 && (
                                    <span className="sidebar-badge">{unreadCount}</span>
                                )}
                            </Link>
                        );
                    })}

                    <div className="sidebar-section-label">Account</div>
                    <Link href="/lawyer-profile" className={`sidebar-nav-item ${pathname === '/lawyer-profile' ? 'active' : ''}`}>
                        <span className="sidebar-nav-icon"><User size={18} /></span> Edit Profile
                    </Link>
                    <div className="sidebar-nav-item" style={{ cursor: 'pointer' }} onClick={logout}>
                        <span className="sidebar-nav-icon"><LogOut size={18} /></span> Logout
                    </div>
                </nav>

                {lawyer && (
                    <div className="sidebar-footer">
                        <div className="sidebar-user">
                            <div 
                                className="sidebar-avatar" 
                                style={{ cursor: avatarUrl ? 'pointer' : 'default' }}
                                onClick={() => avatarUrl && setFullscreenImage({ url: avatarUrl, name: lawyer.fullName })}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="DP" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : initials}
                            </div>
                            <div className="sidebar-user-info">
                                <h4>{lawyer.fullName}</h4>
                                <p>{lawyer.specialization || 'Lawyer'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Global Sidebar Lightbox */}
            {fullscreenImage && (
                <div className="image-lightbox-overlay" onClick={() => setFullscreenImage(null)} style={{ zIndex: 10000 }}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="close-lightbox" onClick={() => setFullscreenImage(null)}>
                            <X size={24} />
                        </button>
                        <img src={fullscreenImage.url} alt="Fullscreen DP" />
                        <div className="lightbox-caption">
                            <h3>{fullscreenImage.name}</h3>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LawyerSidebar;

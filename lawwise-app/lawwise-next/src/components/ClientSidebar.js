'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    Home,
    Bell, 
    MessageSquare, 
    Upload, 
    Search, 
    Star, 
    LogOut,
    User,
    Menu,
    X
} from 'lucide-react';
import '@/styles/Dashboard.css';

const ClientSidebar = () => {
    const [client, setClient] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('clientInfo');
        if (info) {
            setClient(JSON.parse(info));
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('clientToken');
        sessionStorage.removeItem('clientToken');
        localStorage.removeItem('clientInfo');
        router.push('/client-portal');
    };

    const modules = [
        { title: 'Dashboard', icon: Home, path: '/client-dashboard' },
        { title: 'Notifications', icon: Bell, path: '/client-notifications' },
        { title: 'Communication', icon: MessageSquare, path: '/client-communication' },
        { title: 'E-Filing Case', icon: Upload, path: '/client-efiling' },
        { title: 'Lawyer Filtering', icon: Search, path: '/search-lawyers' },
        { title: 'Lawyer Reviews', icon: Star, path: '/lawyer-reviews' }
    ];

    const initials = client?.fullName ? client.fullName.split(' ').map(n => n[0]).join('') : 'C';

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-logo">
                <Link href="/client-dashboard" style={{ textDecoration: 'none' }}>
                    <h1>LAW<span>WISE</span></h1>
                </Link>
                <p>Client Portal</p>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Main</div>
                {modules.map((m, i) => (
                    <Link 
                        key={i} 
                        href={m.path} 
                        className={`sidebar-nav-item ${pathname === m.path ? 'active' : ''}`}
                        style={{ textDecoration: 'none' }}
                    >
                        <span className="sidebar-nav-icon">
                            <m.icon size={18} />
                        </span> 
                        {m.title}
                    </Link>
                ))}

                <div className="sidebar-section-label">Account</div>
                <div className="sidebar-nav-item" onClick={logout} style={{ cursor: 'pointer' }}>
                    <span className="sidebar-nav-icon"><LogOut size={18} /></span> Logout
                </div>
            </nav>

            {client && (
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <h4>{client.fullName}</h4>
                            <p>Client</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default ClientSidebar;

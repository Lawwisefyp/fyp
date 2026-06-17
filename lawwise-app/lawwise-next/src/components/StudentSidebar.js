'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
    Target, 
    FileText, 
    Library, 
    Share2, 
    Calculator, 
    Lightbulb, 
    Calendar,
    LogOut,
    User,
    Home
} from 'lucide-react';
import Link from 'next/link';
import '@/styles/Dashboard.css';

const StudentSidebar = () => {
    const [student, setStudent] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('studentInfo');
        if (info) {
            setStudent(JSON.parse(info));
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('studentToken');
        sessionStorage.removeItem('studentToken');
        localStorage.removeItem('studentInfo');
        localStorage.removeItem('userType');
        router.push('/student-portal');
    };

    const features = [
        { title: 'Personalized Learning', icon: Target, path: '/student-learning' },
        { title: 'Past Papers', icon: FileText, path: '/student-past-papers' },
        { title: 'Mini-Library', icon: Library, path: '/student-library' },
        { title: 'Notes Sharing', icon: Share2, path: '/student-notes' },
        { title: 'GPA Calculator', icon: Calculator, path: '/student-gpa' },
        { title: 'Insights & Guides', icon: Lightbulb, path: '/student-insights' },
        { title: 'Study Planner', icon: Calendar, path: '/student-planner' }
    ];

    const initials = student?.fullName ? student.fullName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() : 'S';

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-logo">
                <Link href="/student-dashboard" style={{ textDecoration: 'none' }}>
                    <h1>LAW<span>WISE</span></h1>
                </Link>
                <p>Student Academy</p>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Main</div>
                <Link href="/student-dashboard" className={`sidebar-nav-item ${pathname === '/student-dashboard' ? 'active' : ''}`}>
                    <span className="sidebar-nav-icon"><Home size={18} /></span> Dashboard
                </Link>

                <div className="sidebar-section-label">Learning Modules</div>
                {features.map((f, i) => {
                    const Icon = f.icon;
                    const isActive = pathname === f.path;
                    return (
                        <Link key={i} href={f.path} className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                            <span className="sidebar-nav-icon"><Icon size={18} /></span> {f.title}
                        </Link>
                    );
                })}

                <div className="sidebar-section-label">Account</div>
                <Link href="/student-profile" className={`sidebar-nav-item ${pathname === '/student-profile' ? 'active' : ''}`}>
                    <span className="sidebar-nav-icon"><User size={18} /></span> My Profile
                </Link>
                <div className="sidebar-nav-item" onClick={logout} style={{ cursor: 'pointer' }}>
                    <span className="sidebar-nav-icon"><LogOut size={18} /></span> Logout
                </div>
            </nav>

            {student && (
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <h4>{student.fullName}</h4>
                            <p>{student.university || 'Law Student'}</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default StudentSidebar;

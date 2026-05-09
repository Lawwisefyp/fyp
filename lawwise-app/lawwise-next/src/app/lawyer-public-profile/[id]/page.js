'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import ClientSidebar from '@/components/ClientSidebar';
import { 
    MapPin, 
    Briefcase, 
    GraduationCap, 
    Lock, 
    ShieldCheck, 
    Mail, 
    Phone, 
    CheckCircle2,
    Calendar,
    Award,
    ChevronLeft,
    X
} from 'lucide-react';
import '@/styles/Dashboard.css';

const LawyerPublicProfilePage = () => {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [lawyer, setLawyer] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('none'); // 'none' | 'pending' | 'accepted' | 'rejected'

    const API_BASE = 'http://localhost:5001';

    useEffect(() => {
        const type = localStorage.getItem('userType');
        setUserType(type);

        const loadData = async () => {
            setLoading(true);
            try {
                const [profileRes, lawyerRes, connRes] = await Promise.all([
                    type === 'lawyer' ? authService.getLawyerProfile().catch(() => ({ success: false })) : Promise.resolve({ success: false }),
                    authService.getLawyerDetails(id),
                    type === 'client' ? authService.getConnectionStatus(id).catch(() => ({ success: false })) : Promise.resolve({ success: false })
                ]);

                if (profileRes.success) setCurrentUser(profileRes.lawyer);
                if (lawyerRes.success) setLawyer(lawyerRes.lawyer);
                if (connRes.success && connRes.status) {
                    setConnectionStatus(connRes.status); // 'pending', 'accepted', 'rejected', or 'none'
                }
            } catch (error) {
                console.error('Failed to load profile data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const isConnected = currentUser?.connections?.some(cid => cid.toString() === id.toString());
    const isSelf = currentUser?._id?.toString() === id.toString();
    const canSeeFull = isConnected || isSelf || userType === 'client';

    const handleConnect = async () => {
        if (connectionStatus !== 'none') return; // Prevent duplicate requests
        try {
            const res = await authService.sendConnectionRequest(id);
            if (res.success) {
                setConnectionStatus('pending'); // Immediately update UI — don't wait for re-render
                alert('Connection request sent! The lawyer will be notified.');
            } else {
                alert(res.error || 'Failed to send connection request.');
            }
        } catch (error) {
            console.error('Connection error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to send connection request.';
            alert(errorMsg);
        }
    };

    const getProfileImage = (u) => {
        const photo = u?.personalInfo?.profilePicture || u?.profilePicture;
        if (photo) {
            return <img src={`${API_BASE}/${photo.replace(/\\/g, '/')}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
        }
        return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '800', color: '#64748b', background: '#f1f5f9' }}>
            {u?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'L'}
        </div>;
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!lawyer) return <div style={{ textAlign: 'center', padding: '100px' }}>Lawyer not found.</div>;

    const name = lawyer.fullName || `${lawyer.personalInfo?.firstName} ${lawyer.personalInfo?.lastName}`;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f2ef' }}>
            {userType === 'client' ? <ClientSidebar /> : <LawyerSidebar />}
            
            <div style={{ flex: 1, padding: '30px 40px', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    
                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0', overflow: 'hidden', marginBottom: '24px' }}>
                        <div style={{ height: '200px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}></div>
                        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
                            <div style={{ 
                                width: '160px', height: '160px', borderRadius: '50%', background: 'white', 
                                border: '4px solid white', position: 'absolute', top: '-80px', left: '24px',
                                overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10
                            }}>
                                {getProfileImage(lawyer)}
                            </div>
                            
                            <div style={{ marginTop: '20px', paddingLeft: '180px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h1 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#111', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {name} <ShieldCheck size={26} style={{ color: '#0a66c2' }} />
                                    </h1>
                                    <p style={{ fontSize: '1.15rem', color: '#333', margin: '0 0 12px', fontWeight: '600' }}>{lawyer.specialization || 'Legal Professional'}</p>
                                    <div style={{ display: 'flex', gap: '20px', color: '#666', fontSize: '1rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={18} /> {lawyer.personalInfo?.city || 'Location N/A'}</span>
                                        <span style={{ color: '#0a66c2', fontWeight: '800' }}>Verified Expert</span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {userType === 'client' && connectionStatus === 'none' && (
                                        <button onClick={handleConnect} className="btn-premium-connect" style={{ width: 'auto', padding: '10px 30px' }}>
                                            Connect to Lawyer
                                        </button>
                                    )}
                                    {userType === 'client' && connectionStatus === 'pending' && (
                                        <button disabled className="btn-premium-connect" style={{ width: 'auto', padding: '10px 30px', opacity: 0.7, cursor: 'not-allowed' }}>
                                            ✓ Requested
                                        </button>
                                    )}
                                    {userType === 'client' && connectionStatus === 'accepted' && (
                                        <button onClick={() => router.push(`/client-communication?userId=${id}`)} className="btn-premium-message" style={{ width: 'auto', padding: '10px 30px' }}>
                                            <Mail size={18} /> Message
                                        </button>
                                    )}
                                    {userType === 'lawyer' && !isSelf && (
                                        <button onClick={handleConnect} disabled={connectionStatus !== 'none'} className="btn-premium-connect" style={{ width: 'auto', padding: '10px 30px' }}>
                                            {connectionStatus !== 'none' ? 'Request Sent' : 'Connect'}
                                        </button>
                                    )}
                                    {isSelf && (
                                        <button onClick={() => router.push('/lawyer-profile')} className="btn-premium-message" style={{ width: 'auto', padding: '10px 30px' }}>
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
                        <div className="main-profile-content">
                            
                            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0', padding: '24px', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 16px' }}>About</h2>
                                <p style={{ color: '#333', lineHeight: '1.6', fontSize: '1rem' }}>
                                    {lawyer.personalInfo?.bio || `Experienced ${lawyer.specialization || 'Legal Professional'} dedicated to providing high-quality legal services and achieving excellence in the field.`}
                                </p>
                            </div>

                            {!canSeeFull && userType === 'lawyer' ? (
                                <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0', padding: '60px 40px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px' }}>Professional Details Locked</h3>
                                    <p style={{ color: '#666', maxWidth: '500px', margin: '0 auto 30px', lineHeight: '1.6' }}>
                                        Full professional experience, education, and verified certifications are only visible to confirmed connections of {name}.
                                    </p>
                                    <button onClick={handleConnect} className="btn-premium-connect" style={{ width: 'auto', margin: '0 auto', padding: '12px 40px' }}>
                                        {connectionSent ? 'Connection Pending' : 'Connect to Unlock Profile'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0', padding: '24px', marginBottom: '24px' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Briefcase size={22} color="#666" /> Experience
                                        </h2>
                                        {lawyer.experience?.length > 0 ? lawyer.experience.map((exp, i) => (
                                            <div key={i} style={{ marginBottom: '20px', borderBottom: i === lawyer.experience.length - 1 ? 'none' : '1px solid #f0f0f0', paddingBottom: '16px' }}>
                                                <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '700' }}>{exp.title}</h4>
                                                <div style={{ color: '#333', fontWeight: '600', marginBottom: '4px' }}>{exp.organization}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} /> {new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                                                </div>
                                                <p style={{ marginTop: '12px', fontSize: '0.95rem', color: '#444' }}>{exp.description}</p>
                                            </div>
                                        )) : <p style={{ color: '#94a3b8' }}>No detailed experience listed.</p>}
                                    </div>

                                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0', padding: '24px' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <GraduationCap size={24} color="#666" /> Education
                                        </h2>
                                        {lawyer.qualifications?.length > 0 ? lawyer.qualifications.map((edu, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '700' }}>{edu.degree}</h4>
                                                    <div style={{ color: '#333', fontWeight: '500' }}>{edu.institution}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Graduated: {edu.year}</div>
                                                </div>
                                                {edu.certificateFile && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#057642', background: '#eaf4ee', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                                                        <Award size={14} /> VERIFIED
                                                    </div>
                                                )}
                                            </div>
                                        )) : <p style={{ color: '#94a3b8' }}>No educational details listed.</p>}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="profile-side-rail">
                            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0', padding: '20px' }}>
                                <h3 style={{ margin: '0 0 15px', fontSize: '1rem', fontWeight: '800' }}>Professional Verification</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#666' }}>Email Status</span>
                                        <span style={{ color: '#057642', fontWeight: '700' }}>Verified ✓</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#666' }}>Bar Number</span>
                                        <span style={{ color: '#333', fontWeight: '700' }}>{lawyer.barNumber || 'Pending'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#666' }}>Experience</span>
                                        <span style={{ color: '#333', fontWeight: '700' }}>{lawyer.professionalInfo?.yearsOfExperience || 0} Years</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LawyerPublicProfilePage;

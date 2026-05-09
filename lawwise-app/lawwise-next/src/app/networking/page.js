'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import {
    X,
    Search,
    MessageSquare,
    UserPlus,
    Image as ImageIcon,
    Lock,
    CheckCircle2,
    ShieldCheck,
    ChevronUp,
    ChevronDown,
    MoreHorizontal
} from 'lucide-react';
import '@/styles/LawyerNetworking.css';
import '@/styles/Dashboard.css';

const LawyerNetworkingPage = () => {
    const router = useRouter();
    const [lawyers, setLawyers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [chatTarget, setChatTarget] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [isMessagingExpanded, setIsMessagingExpanded] = useState(false);
    const messagesEndRef = useRef(null);

    const API_BASE = 'http://localhost:5001';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [lawyersRes, profileRes] = await Promise.all([
                    authService.getLawyers(),
                    authService.getLawyerProfile()
                ]);
                if (lawyersRes.success) {
                    const dbLawyers = (lawyersRes.lawyers || []).filter(l => l.fullName && l.email);
                    setLawyers(dbLawyers);
                }
                if (profileRes.success) {
                    setCurrentUser(profileRes.lawyer);
                }
            } catch (error) {
                console.error('Failed to load networking data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredLawyers = lawyers.filter(lawyer => {
        const lawyerIdStr = lawyer._id?.toString();
        const currentUserIdStr = currentUser?._id?.toString();
        if (currentUserIdStr && lawyerIdStr === currentUserIdStr) return false;
        const name = (lawyer.fullName || `${lawyer.personalInfo?.firstName} ${lawyer.personalInfo?.lastName}`).toLowerCase();
        const spec = (lawyer.professionalInfo?.specialization || lawyer.specialization || '').toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase()) || spec.includes(searchQuery.toLowerCase());
        if (activeTab === 'connections') {
            const isConn = currentUser?.connections?.some(id => id.toString() === lawyerIdStr);
            return matchesSearch && isConn;
        }
        return matchesSearch;
    });

    const handleConnect = async (e, lawyerId) => {
        e.stopPropagation();
        try {
            await authService.sendConnectionRequest(lawyerId);
            alert('Connection request sent!');
        } catch (error) {
            alert('Failed to send request.');
        }
    };

    const getAvatar = (user) => {
        const photo = user?.personalInfo?.profilePicture || user?.profilePicture;
        if (photo) {
            const url = `${API_BASE}/${photo.replace(/\\/g, '/')}`;
            return <img src={url} alt="DP" onClick={(e) => { e.stopPropagation(); setFullscreenImage({ url, name: user.fullName }); }} />;
        }
        return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#6b7280', fontSize: '2rem', fontWeight: '800' }}>
            {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'L'}
        </div>;
    };

    return (
        <div className="dashboard-body">
            <LawyerSidebar />
            <div className="dashboard-main" style={{ background: '#f3f2ef', padding: 0 }}>

                <div className="full-bleed-networking">

                    {/* Header Area */}
                    <div className="full-bleed-header">
                        <h1>Professional Networking</h1>
                        <div className="full-bleed-search-bar">
                            <div className="search-input-premium">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name, expertise or city..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    onClick={() => setActiveTab('all')}
                                    style={{ background: activeTab === 'all' ? '#000' : 'transparent', color: activeTab === 'all' ? '#fff' : '#666', border: '1px solid #000', padding: '8px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Discover
                                </button>
                                <button
                                    onClick={() => setActiveTab('connections')}
                                    style={{ background: activeTab === 'connections' ? '#000' : 'transparent', color: activeTab === 'connections' ? '#fff' : '#666', border: '1px solid #000', padding: '8px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    My Network ({currentUser?.connections?.length || 0})
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px' }}>
                            <div className="loader"></div>
                            <p style={{ marginTop: '20px', fontWeight: '600', color: '#666' }}>Finding professionals...</p>
                        </div>
                    ) : (
                        <div className="discovery-grid-expanded">
                            {filteredLawyers.map(lawyer => {
                                const name = lawyer.fullName || `${lawyer.personalInfo?.firstName} ${lawyer.personalInfo?.lastName}`;
                                const isConnected = currentUser?.connections?.some(id => id.toString() === lawyer._id.toString());
                                return (
                                    <div key={lawyer._id} className="linkedin-card-premium" onClick={() => isConnected && router.push(`/lawyer-public-profile/${lawyer._id}`)}>
                                        <div className="card-premium-banner">
                                            {isConnected && <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#057642', color: '#fff', fontSize: '0.65rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>CONNECTED</div>}
                                        </div>
                                        <div className="card-premium-avatar">
                                            {getAvatar(lawyer)}
                                        </div>
                                        <div className="card-premium-info">
                                            <span className="card-premium-name">{name}</span>
                                            <div className="card-premium-spec">
                                                {lawyer.specialization || 'Legal Professional'}
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>
                                                📍 {lawyer.personalInfo?.city || 'Location N/A'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '15px' }}>
                                                {lawyer.professionalInfo?.yearsOfExperience || 0} Years Experience
                                            </div>

                                            {!isConnected ? (
                                                <>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '12px' }}>
                                                        <Lock size={10} /> Full profile details locked
                                                    </div>
                                                    <button className="btn-premium-connect" onClick={(e) => handleConnect(e, lawyer._id)}>
                                                        <UserPlus size={16} /> Connect
                                                    </button>
                                                </>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn-premium-message" onClick={(e) => { e.stopPropagation(); router.push(`/communication?userId=${lawyer._id}`); }}>
                                                        <MessageSquare size={16} /> Message
                                                    </button>
                                                    <button className="btn-premium-connect" style={{ width: 'auto', padding: '10px 15px', borderColor: '#e0e0e0', color: '#666' }} onClick={() => router.push(`/lawyer-public-profile/${lawyer._id}`)}>
                                                        View
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* LinkedIn Style Messaging Drawer */}
                <div className="messaging-drawer-fixed">
                    <div className="messaging-drawer-header" onClick={() => setIsMessagingExpanded(!isMessagingExpanded)}>
                        <h4>
                            <div className="active-dot-premium"></div>
                            Messaging
                        </h4>
                        <div style={{ display: 'flex', gap: '12px', color: '#666' }}>
                            <MoreHorizontal size={18} />
                            {isMessagingExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </div>
                    </div>

                    {isMessagingExpanded && (
                        <div style={{ height: '400px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                            {chatTarget ? (
                                <>
                                    <div style={{ padding: '10px 15px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{chatTarget.fullName}</span>
                                        <X size={18} style={{ cursor: 'pointer', color: '#666' }} onClick={() => setChatTarget(null)} />
                                    </div>
                                    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
                                        <MessageSquare size={40} style={{ marginBottom: '10px', opacity: 0.2 }} />
                                        <p style={{ fontSize: '0.85rem' }}>Send a professional message to {chatTarget.fullName.split(' ')[0]}</p>
                                    </div>
                                    <div style={{ padding: '15px', borderTop: '1px solid #f0f0f0' }}>
                                        <input
                                            type="text"
                                            placeholder="Write a message..."
                                            style={{ width: '100%', padding: '10px 15px', borderRadius: '20px', border: '1px solid #e0e0e0', background: '#f3f2ef', outline: 'none', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    <MessageSquare size={48} style={{ opacity: 0.1, marginBottom: '15px' }} />
                                    <p style={{ fontSize: '0.9rem' }}>Select a connection to start messaging</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Fullscreen Image Lightbox */}
            {fullscreenImage && (
                <div className="image-lightbox-overlay" onClick={() => setFullscreenImage(null)}>
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
        </div>
    );
};

export default LawyerNetworkingPage;

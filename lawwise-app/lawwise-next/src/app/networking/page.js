'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import '@/styles/LawyerNetworking.css';

const LawyerNetworkingPage = () => {
    const router = useRouter();
    const [lawyers, setLawyers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'connections'
    const [showMessageDrawer, setShowMessageDrawer] = useState(false);
    const [chatTarget, setChatTarget] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateHeader = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        
        return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [lawyersRes, profileRes] = await Promise.all([
                    authService.getLawyers(),
                    authService.getLawyerProfile()
                ]);
                if (lawyersRes.success) {
                    setLawyers(lawyersRes.lawyers || []);
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

    // Polling for new messages when drawer is open
    useEffect(() => {
        let interval;
        if (showMessageDrawer && chatTarget) {
            const fetchChat = async () => {
                try {
                    const res = await authService.getMessages(chatTarget._id);
                    if (res.success) {
                        setMessages(res.messages);
                    }
                } catch (err) {
                    console.error('Fetch chat error:', err);
                }
            };
            fetchChat();
            interval = setInterval(fetchChat, 3000);
        }
        return () => clearInterval(interval);
    }, [showMessageDrawer, chatTarget]);

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
            alert('Failed to send connection request.');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatTarget) return;

        try {
            const res = await authService.sendMessage({
                receiverId: chatTarget._id,
                content: newMessage,
                receiverModel: 'Lawyer'
            });
            if (res.success) {
                setMessages([...messages, res.message]);
                setNewMessage('');
            }
        } catch (err) {
            console.error('Send message error:', err);
        }
    };

    const openChat = (e, lawyer) => {
        e.stopPropagation();
        setChatTarget(lawyer);
        setMessages([]); // Clear previous chat till load
        setShowMessageDrawer(true);
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').filter(p => p).map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div style={{ background: '#f3f2ef', minHeight: '100vh', paddingTop: '100px', paddingBottom: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '25px' }}>

                {/* Left Sidebar */}
                <aside>
                    <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ height: '60px', background: '#111827' }}></div>
                        <div style={{ padding: '15px', textAlign: 'center', marginTop: '-40px' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'white', border: '2px solid white', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', color: '#111827', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                {currentUser ? getInitials(currentUser.fullName) : '??'}
                            </div>
                            <h3 style={{ margin: '10px 0 5px 0', fontSize: '1rem' }}>{currentUser?.fullName}</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{currentUser?.specialization}</p>
                        </div>
                        <div style={{ padding: '15px 0', borderTop: '1px solid #ebebeb' }}>
                            <div
                                onClick={() => setActiveTab('all')}
                                style={{ padding: '10px 20px', cursor: 'pointer', background: activeTab === 'all' ? '#f3f2ef' : 'transparent', fontWeight: activeTab === 'all' ? '700' : '400', fontSize: '0.9rem' }}
                            >
                                Discover Network
                            </div>
                            <div
                                onClick={() => setActiveTab('connections')}
                                style={{ padding: '10px 20px', cursor: 'pointer', background: activeTab === 'connections' ? '#f3f2ef' : 'transparent', fontWeight: activeTab === 'connections' ? '700' : '400', fontSize: '0.9rem' }}
                            >
                                My Connections ({currentUser?.connections?.length || 0})
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Feed */}
                <main>
                    <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Search by name or specialization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ flex: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid #dcdcdc', background: '#f3f2ef', outline: 'none', color: '#333' }}
                            />
                            <Link href="/lawyer-dashboard" style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid #111827', color: '#111827', textDecoration: 'none', fontWeight: '600' }}>Dashboard</Link>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#333' }}>Loading network...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                            {filteredLawyers.map(lawyer => {
                                const name = lawyer.fullName || `${lawyer.personalInfo?.firstName} ${lawyer.personalInfo?.lastName}`;
                                const isConnected = currentUser?.connections?.some(id => id.toString() === lawyer._id.toString());
                                return (
                                    <div
                                        key={lawyer._id}
                                        className="networking-card"
                                        style={{
                                            background: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s',
                                            overflow: 'hidden', height: '280px', display: 'flex', flexDirection: 'column'
                                        }}
                                        onClick={() => router.push(`/lawyer-public-profile/${lawyer._id}`)}
                                    >
                                        <div style={{ height: '60px', background: '#e2e8f0' }}></div>
                                        <div style={{ marginTop: '-35px' }}>
                                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'white', border: '2px solid white', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800', color: '#111827', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                {getInitials(name)}
                                            </div>
                                        </div>
                                        <div style={{ padding: '15px', flex: 1 }}>
                                            <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{name}</h4>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', minHeight: '32px' }}>{lawyer.specialization || 'Legal Professional'}</p>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px' }}>
                                                {lawyer.personalInfo?.city || 'City'}
                                            </div>
                                        </div>
                                        <div style={{ padding: '15px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px' }}>
                                            {!isConnected ? (
                                                <button
                                                    onClick={(e) => handleConnect(e, lawyer._id)}
                                                    style={{ flex: 1, background: 'transparent', border: '2px solid #111827', color: '#111827', borderRadius: '20px', padding: '6px 0', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    Connect
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => openChat(e, lawyer)}
                                                    style={{ flex: 1, background: '#111827', border: 'none', color: 'white', borderRadius: '20px', padding: '6px 0', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    Message
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Messaging Drawer */}
            {showMessageDrawer && (
                <div style={{
                    position: 'fixed', bottom: 0, right: '40px', width: '320px', height: '450px',
                    background: 'white', border: '1px solid #dcdcdc', borderRadius: '10px 10px 0 0',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 1000
                }}>
                    <div style={{ padding: '12px 15px', background: 'white', borderBottom: '1px solid #ebebeb', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>
                                {getInitials(chatTarget?.fullName || chatTarget?.personalInfo?.firstName)}
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#333' }}>{chatTarget?.fullName || `${chatTarget?.personalInfo?.firstName} ${chatTarget?.personalInfo?.lastName}`}</span>
                        </div>
                        <button onClick={() => setShowMessageDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#333' }}>✕</button>
                    </div>

                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
                                <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>No messages yet.<br />Start the conversation with {chatTarget?.fullName?.split(' ')[0] || chatTarget?.personalInfo?.firstName}!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMine = msg.senderId?.toString() === currentUser?._id?.toString();
                                const msgDate = new Date(msg.createdAt).toDateString();
                                const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
                                const showDateHeader = msgDate !== prevMsgDate;

                                return (
                                    <React.Fragment key={index}>
                                        {showDateHeader && (
                                            <div style={{
                                                textAlign: 'center',
                                                margin: '20px 0 10px 0',
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <span style={{
                                                    background: '#e2e8f0',
                                                    color: '#475569',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {formatDateHeader(msg.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                        <div style={{
                                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: isMine ? 'flex-end' : 'flex-start'
                                        }}>
                                            <div style={{
                                                background: isMine ? '#111827' : '#f1f5f9',
                                                color: isMine ? 'white' : '#1e293b',
                                                padding: '8px 14px',
                                                borderRadius: isMine ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                                fontSize: '0.88rem',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                lineHeight: '1.4'
                                            }}>
                                                {msg.content}
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.7rem', 
                                                color: '#94a3b8', 
                                                marginTop: '4px',
                                                marginRight: isMine ? '4px' : '0',
                                                marginLeft: !isMine ? '4px' : '0'
                                            }}>
                                                {formatTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} style={{ padding: '10px', background: '#f8fafc', borderTop: '1px solid #ebebeb', borderRadius: '0 0 10px 10px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="text"
                                placeholder="Write a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                style={{ flex: 1, padding: '8px 12px', border: '1px solid #dcdcdc', borderRadius: '20px', fontSize: '0.85rem', outline: 'none', color: '#333' }}
                            />
                            <button
                                type="submit"
                                style={{
                                    background: '#111827', color: 'white', border: 'none', borderRadius: '50%',
                                    width: '32px', height: '32px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'transform 0.1s'
                                }}
                            >
                                &#8250;
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default LawyerNetworkingPage;

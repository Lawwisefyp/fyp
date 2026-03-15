import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const LawyerPublicProfilePage = () => {
    const { id } = useParams();
    const location = useLocation();
    const [lawyer, setLawyer] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connectionSent, setConnectionSent] = useState(false);
    const [showMessageDrawer, setShowMessageDrawer] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('contact') === 'true') {
            setShowMessageDrawer(true);
        }

        const type = localStorage.getItem('userType');
        setUserType(type);

        const loadData = async () => {
            setLoading(true);
            try {
                console.log('Loading profile for ID:', id);
                const [profileRes, lawyerRes] = await Promise.all([
                    authService.getLawyerProfile().catch(() => ({ success: false })),
                    authService.getLawyerDetails(id)
                ]);

                if (profileRes.success) setCurrentUser(profileRes.lawyer);
                if (lawyerRes.success) {
                    setLawyer(lawyerRes.lawyer);
                } else {
                    console.error('Lawyer not found in API response');
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

    const handleConnect = async () => {
        try {
            await authService.sendConnectionRequest(id);
            setConnectionSent(true);
            alert('Connection request sent!');
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to send connection request.';
            alert(errorMsg);
        }
    };

    const toggleMessage = () => {
        if (userType === 'lawyer' && !isConnected) {
            alert('You must be connected to send messages to other lawyers.');
            return;
        }
        setShowMessageDrawer(!showMessageDrawer);
    };

    const handleSendMessage = async () => {
        if (!messageContent.trim()) return;
        setIsSending(true);
        try {
            await authService.sendMessage({
                receiverId: id,
                receiverType: 'Lawyer',
                content: messageContent
            });
            alert('Message sent successfully!');
            setMessageContent('');
            setShowMessageDrawer(false);
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#c19651' }}>Loading Profile...</div>;
    if (!lawyer) return <div style={{ textAlign: 'center', padding: '100px' }}>Lawyer not found.</div>;

    const name = lawyer.fullName || (lawyer.personalInfo?.firstName + ' ' + lawyer.personalInfo?.lastName);
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Link to={userType === 'client' ? "/search-lawyers" : "/networking"} style={{ color: '#65676b', textDecoration: 'none', fontWeight: '600', marginBottom: '20px', display: 'inline-block' }}>← Back to Search</Link>

                {/* Header Card */}
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <div style={{ height: '200px', background: 'linear-gradient(135deg, #c19651 0%, #8c6d3b 100%)' }}></div>
                    <div style={{ padding: '0 30px 30px', position: 'relative' }}>
                        <div style={{
                            width: '160px', height: '160px', borderRadius: '50%', background: 'white',
                            border: '4px solid white', position: 'absolute', top: '-80px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '4rem', fontWeight: '800', color: '#c19651', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            {initials}
                        </div>
                        <div style={{ marginTop: '90px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', color: '#1e293b' }}>{name}</h1>
                                <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#64748b' }}>{lawyer.specialization || 'Legal Professional'}</p>
                                <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>📍 {lawyer.personalInfo?.city || 'City not specified'}, {lawyer.personalInfo?.state || ''}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!isConnected && (
                                    <button
                                        onClick={handleConnect}
                                        disabled={connectionSent}
                                        style={{
                                            background: '#c19651', color: 'white', border: 'none',
                                            padding: '8px 24px', borderRadius: '20px', fontWeight: '700',
                                            cursor: connectionSent ? 'default' : 'pointer', opacity: connectionSent ? 0.7 : 1
                                        }}
                                    >
                                        {connectionSent ? 'Request Sent' : 'Connect'}
                                    </button>
                                )}
                                <button
                                    onClick={toggleMessage}
                                    style={{
                                        background: 'white', color: '#c19651', border: '2px solid #c19651',
                                        padding: '6px 22px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer'
                                    }}
                                >
                                    Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messaging Drawer */}
                {showMessageDrawer && (
                    <div style={{
                        position: 'fixed', bottom: 0, right: '40px', width: '320px', height: '400px',
                        background: 'white', border: '1px solid #dcdcdc', borderRadius: '10px 10px 0 0',
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 1000
                    }}>
                        <div style={{ padding: '12px 15px', background: 'white', borderBottom: '1px solid #ebebeb', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#c19651', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>
                                    {initials}
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{name}</span>
                            </div>
                            <button onClick={() => setShowMessageDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>
                        <div style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
                            <span style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</span>
                            <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>No messages yet.<br />Start the conversation with {name.split(' ')[0]}!</p>
                        </div>
                        <div style={{ padding: '10px', background: '#f8fafc', borderTop: '1px solid #ebebeb' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input
                                    type="text"
                                    placeholder="Write a message..."
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    disabled={isSending}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #dcdcdc', borderRadius: '20px', fontSize: '0.85rem' }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !messageContent.trim()}
                                    style={{
                                        background: '#c19651', color: 'white', border: 'none',
                                        borderRadius: '50%', width: '30px', height: '30px',
                                        cursor: isSending ? 'default' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: (isSending || !messageContent.trim()) ? 0.6 : 1
                                    }}
                                >
                                    {isSending ? '...' : '➤'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Body Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px' }}>
                    <div className="left-column">
                        {/* About Section */}
                        <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1e293b' }}>About</h3>
                            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
                                {lawyer.personalInfo?.bio || 'No bio provided yet.'}
                            </p>
                        </div>

                        {/* Professional Content - Logic for Locking */}
                        {userType === 'lawyer' && !isConnected ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                    borderRadius: '16px', padding: '60px 40px',
                                    textAlign: 'center', border: '1px dashed #cbd5e1',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%', background: '#fef3c7',
                                        color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '2.5rem', margin: '0 auto 20px'
                                    }}>🔒</div>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.5rem' }}>Professional Profile Locked</h3>
                                    <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto', lineHeight: '1.6', fontSize: '1rem' }}>
                                        To protect professional privacy, <strong>{name}</strong>'s detailed work history and certifications are only visible to confirmed connections.
                                    </p>
                                    <div style={{ marginTop: '30px' }}>
                                        {!connectionSent ? (
                                            <button
                                                onClick={handleConnect}
                                                style={{
                                                    background: '#c19651', color: 'white', border: 'none',
                                                    padding: '12px 30px', borderRadius: '30px', fontWeight: '700',
                                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(193, 150, 81, 0.3)'
                                                }}
                                            >
                                                Send Connection Request
                                            </button>
                                        ) : (
                                            <div style={{ color: '#c19651', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <span>⏳ Request Pending Acceptance</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Experience Section */}
                                <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Experience</h3>
                                    {lawyer.experience && lawyer.experience.length > 0 ? (
                                        lawyer.experience.map((exp, idx) => (
                                            <div key={idx} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: idx !== lawyer.experience.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                <h4 style={{ margin: '0 0 5px 0' }}>{exp.title}</h4>
                                                <div style={{ fontWeight: '600', color: '#c19651' }}>{exp.organization}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                    {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} - {exp.isCurrent ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString() : '')}
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '10px' }}>{exp.description}</p>
                                            </div>
                                        ))
                                    ) : <p style={{ color: '#94a3b8' }}>No work experience listed.</p>}
                                </div>

                                {/* Education Section */}
                                <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Education & Certifications</h3>
                                    {lawyer.qualifications && lawyer.qualifications.length > 0 ? (
                                        lawyer.qualifications.map((qual, idx) => (
                                            <div key={idx} style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 5px 0' }}>{qual.degree}</h4>
                                                    <div style={{ color: '#64748b' }}>{qual.institution}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Class of {qual.year}</div>
                                                </div>
                                                {qual.certificateFile && (
                                                    <span style={{
                                                        background: '#f1f8e9', color: '#689f38', padding: '4px 12px',
                                                        borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700'
                                                    }}>
                                                        ✓ Verified Certificate
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : <p style={{ color: '#94a3b8' }}>No qualifications listed.</p>}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="right-column">
                        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h4 style={{ marginTop: 0, borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', color: '#1e293b' }}>Professional Stats</h4>
                            <div style={{ padding: '15px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#64748b' }}>Experience</span>
                                    <span style={{ fontWeight: '700' }}>{lawyer.professionalInfo?.yearsOfExperience || 0} Years</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#64748b' }}>Bar Registration</span>
                                    <span style={{ fontWeight: '700' }}>{lawyer.barNumber || lawyer.professionalInfo?.barRegistrationNumber || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Status</span>
                                    <span style={{ color: '#4caf50', fontWeight: '800' }}>Active ✅</span>
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

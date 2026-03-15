import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/Communication.css';

const CommunicationPage = () => {
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const type = localStorage.getItem('userType') || (localStorage.getItem('lawyerToken') ? 'lawyer' : 'client');
        setUserType(type);

        const info = type === 'lawyer'
            ? JSON.parse(localStorage.getItem('lawyerInfo') || '{}')
            : JSON.parse(localStorage.getItem('clientInfo') || '{}');
        setCurrentUser(info);

        const loadContacts = async () => {
            try {
                const data = await authService.getChatContacts();
                if (data.success) {
                    setContacts(data.contacts);
                }
            } catch (error) {
                console.error('Failed to load contacts:', error);
            } finally {
                setLoading(false);
            }
        };

        loadContacts();

        // Polling for new messages
        const interval = setInterval(() => {
            if (selectedContact) {
                fetchMessages(selectedContact.id);
            }
            loadContacts();
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedContact]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async (contactId) => {
        try {
            const data = await authService.getMessages(contactId);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        fetchMessages(contact.id);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        try {
            const data = await authService.sendMessage({
                receiverId: selectedContact.id,
                receiverType: selectedContact.role,
                content: newMessage
            });

            if (data.success) {
                setNewMessage('');
                fetchMessages(selectedContact.id);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!selectedContact || !emailSubject.trim() || !emailBody.trim()) return;

        setSendingEmail(true);
        try {
            // We need the contact's email. Using a fallback pattern based on name if not provided.
            const contactEmail = selectedContact.email || `${selectedContact.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;

            const data = await authService.sendOfficialEmail({
                to: contactEmail,
                subject: emailSubject,
                content: emailBody
            });

            if (data.success) {
                alert('Official email sent successfully!');
                setShowEmailModal(false);
                setEmailSubject('');
                setEmailBody('');
            } else {
                alert('Failed to send email: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to send official email:', error);
            alert('An error occurred while sending the email.');
        } finally {
            setSendingEmail(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="chat-loading">Loading Messenger...</div>;

    return (
        <div className="chat-page-container">
            <div className="chat-app">
                {/* Sidebar */}
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <div className="user-profile">
                            <div className="avatar-small">
                                {currentUser?.fullName?.[0] || 'U'}
                            </div>
                            <div className="user-info">
                                <h3>{currentUser?.fullName}</h3>
                                <span>{userType === 'lawyer' ? 'Lawyer Account' : 'Client Account'}</span>
                            </div>
                        </div>
                        <button className="back-btn" onClick={() => navigate(-1)}>✕</button>
                    </div>

                    <div className="search-contacts">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input type="text" placeholder="Search or start new chat" />
                        </div>
                    </div>

                    <div className="contacts-list">
                        {contacts.length === 0 ? (
                            <div className="no-contacts">No contacts found</div>
                        ) : (
                            contacts.map(contact => (
                                <div
                                    key={contact.id}
                                    className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                                    onClick={() => handleSelectContact(contact)}
                                >
                                    <div className="contact-avatar">
                                        {contact.avatar ? (
                                            <img src={contact.avatar} alt={contact.name} />
                                        ) : (
                                            <div className="avatar-placeholder">{contact.name[0]}</div>
                                        )}
                                    </div>
                                    <div className="contact-details">
                                        <div className="contact-top">
                                            <span className="contact-name">{contact.name}</span>
                                            {contact.lastMessage && (
                                                <span className="last-time">{formatTime(contact.lastMessage.createdAt)}</span>
                                            )}
                                        </div>
                                        <div className="contact-bottom">
                                            <span className="last-msg">
                                                {contact.lastMessage ? (
                                                    <>
                                                        {contact.lastMessage.isSender && <span className="sent-tick">✓</span>}
                                                        {contact.lastMessage.content}
                                                    </>
                                                ) : (
                                                    <span className="role-tag">{contact.role}</span>
                                                )}
                                            </span>
                                            {contact.lastMessage && !contact.lastMessage.isRead && !contact.lastMessage.isSender && (
                                                <span className="unread-badge">1</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="chat-main">
                    {selectedContact ? (
                        <>
                            <div className="chat-header">
                                <div className="selected-user">
                                    <div className="avatar-mid">
                                        {selectedContact.avatar ? (
                                            <img src={selectedContact.avatar} alt={selectedContact.name} />
                                        ) : (
                                            <div className="avatar-placeholder">{selectedContact.name[0]}</div>
                                        )}
                                    </div>
                                    <div className="user-meta">
                                        <h4>{selectedContact.name}</h4>
                                        <p>{selectedContact.role} • Online</p>
                                    </div>
                                </div>
                                <div className="header-actions">
                                    <button title="Send Official Email" onClick={() => setShowEmailModal(true)}>📧</button>
                                    <button title="Voice Call">📞</button>
                                    <button title="Video Call">🎥</button>
                                    <button title="Menu">⋮</button>
                                </div>
                            </div>

                            <div className="messages-container">
                                {messages.length === 0 ? (
                                    <div className="empty-chat">
                                        <div className="info-bubble">
                                            Messages are end-to-end encrypted. No one outside of this chat, not even Lawwise, can read them.
                                        </div>
                                        <p>Start a conversation with {selectedContact.name}</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`message-row ${msg.senderId === (currentUser?._id || currentUser?.id) ? 'sent' : 'received'}`}
                                        >
                                            <div className="message-bubble">
                                                <p>{msg.content}</p>
                                                <span className="msg-time">
                                                    {formatTime(msg.createdAt)}
                                                    {msg.senderId === (currentUser?._id || currentUser?.id) && (
                                                        <span className={`tick-status ${msg.isRead ? 'read' : ''}`}>✓✓</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-area" onSubmit={handleSendMessage}>
                                <button type="button" className="emoji-btn">😊</button>
                                <button type="button" className="attach-btn">📎</button>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Type a message"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                                    {newMessage.trim() ? '▶' : '🎤'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="chat-welcome">
                            <div className="welcome-content">
                                <div className="welcome-logo">⚖️</div>
                                <h1>Lawwise Messenger</h1>
                                <p>Send and receive messages without sharing your phone number.</p>
                                <p className="secure-tag">🔒 End-to-end encrypted</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="email-modal-overlay">
                    <div className="email-modal">
                        <div className="email-modal-header">
                            <h3>Send Official Email</h3>
                            <button onClick={() => setShowEmailModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSendEmail} className="email-modal-form">
                            <div className="form-group">
                                <label>To:</label>
                                <input type="text" value={selectedContact.name} disabled />
                            </div>
                            <div className="form-group">
                                <label>Subject:</label>
                                <input
                                    type="text"
                                    placeholder="Enter subject"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Message:</label>
                                <textarea
                                    placeholder="Write your official message here..."
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <div className="email-modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowEmailModal(false)}>Cancel</button>
                                <button type="submit" className="btn-send-email" disabled={sendingEmail}>
                                    {sendingEmail ? 'Sending...' : 'Send Official Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunicationPage;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services/api';
import ClientSidebar from '@/components/ClientSidebar';
import { Search, Mail, Phone, Video, MoreVertical, Send, Smile, Paperclip, ShieldCheck, Users, Briefcase, X, Mic, StopCircle, MessageSquare, Star } from 'lucide-react';
import '@/styles/Communication.css';

// Dynamic import for emoji picker to improve performance
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const ClientCommunicationPage = () => {
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [attachment, setAttachment] = useState(null);
    
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const prevMessagesCountRef = useRef(0);
    const isAtBottomRef = useRef(true);
    const fileInputRef = useRef(null);
    
    // Voice Message states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [volume, setVolume] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const API_BASE = 'http://localhost:5001';

    const scrollToBottom = (instant = true) => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: instant ? 'auto' : 'smooth'
            });
        }
    };

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const info = JSON.parse(localStorage.getItem('clientInfo') || '{}');
            setCurrentUser(info);
        }

        const loadContacts = async () => {
            try {
                const data = await authService.getChatContacts();
                if (data.success) {
                    // Clients only chat with lawyers
                    const lawyers = data.contacts.filter(c => c.role === 'Lawyer' || !c.role);
                    setContacts(lawyers);
                    
                    const contactId = searchParams.get('userId');
                    if (contactId) {
                        const target = lawyers.find(c => c.id.toString() === contactId);
                        if (target) {
                            setSelectedContact(target);
                            fetchMessages(target.id);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load contacts:', error);
            } finally {
                setLoading(false);
            }
        };

        loadContacts();

        const interval = setInterval(() => {
            if (selectedContact) {
                fetchMessages(selectedContact.id);
                authService.markMessagesAsRead(selectedContact.id).catch(() => {});
                loadContacts(); 
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedContact, searchParams]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = lastMessage?.senderId === (currentUser?._id || currentUser?.id);

        if (messages.length > prevMessagesCountRef.current) {
            if (isMyMessage || isAtBottomRef.current) {
                scrollToBottom(true);
            }
        }
        prevMessagesCountRef.current = messages.length;
    }, [messages]);

    const fetchMessages = async (contactId) => {
        try {
            const data = await authService.getMessages(contactId);
            if (data.success) {
                const lastNewMessage = data.messages[data.messages.length - 1];
                const lastOldMessage = messages[messages.length - 1];
                
                if (data.messages.length !== messages.length || 
                    lastNewMessage?._id !== lastOldMessage?._id ||
                    lastNewMessage?.isRead !== lastOldMessage?.isRead) {
                    setMessages(data.messages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSelectContact = (contact) => {
        prevMessagesCountRef.current = 0; 
        isAtBottomRef.current = true;
        setSelectedContact(contact);
        setMessages([]); 
        fetchMessages(contact.id);
        authService.markMessagesAsRead(contact.id).catch(() => {});
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !selectedContact) return;

        try {
            let data;
            if (attachment) {
                const formData = new FormData();
                formData.append('receiverId', selectedContact.id);
                formData.append('receiverModel', 'Lawyer');
                formData.append('content', newMessage);
                formData.append('chatAttachment', attachment);
                data = await authService.sendMessage(formData);
            } else {
                data = await authService.sendMessage({
                    receiverId: selectedContact.id,
                    receiverModel: 'Lawyer',
                    content: newMessage
                });
            }

            if (data.success) {
                setNewMessage('');
                setAttachment(null);
                setShowEmojiPicker(false);
                fetchMessages(selectedContact.id);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const updateVolume = () => {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setVolume(average);
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size > 1000) {
                    const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
                    sendVoiceMessage(audioFile);
                }
                stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) audioContextRef.current.close();
                cancelAnimationFrame(animationFrameRef.current);
                setVolume(0);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (error) {
            console.error('Mic error:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const sendVoiceMessage = async (audioFile) => {
        try {
            const formData = new FormData();
            formData.append('receiverId', selectedContact.id);
            formData.append('receiverModel', 'Lawyer');
            formData.append('content', 'Voice Message');
            formData.append('chatAttachment', audioFile);
            const data = await authService.sendMessage(formData);
            if (data.success) fetchMessages(selectedContact.id);
        } catch (error) {
            console.error('Voice send error:', error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="chat-loading"><div className="loader"></div></div>;

    return (
        <div className="dashboard-body">
            <ClientSidebar />
            
            <div className="communication-container" style={{ flex: 1, height: '100vh', padding: '0' }}>
                <div className="chat-app" style={{ margin: '0', borderRadius: '0', height: '100%' }}>
                    {/* Sidebar */}
                    <div className="chat-sidebar">
                        <div className="sidebar-header" style={{ padding: '20px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#111' }}>Consultations</h2>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>Securely chat with your legal counsel</p>
                        </div>

                        <div className="search-contacts">
                            <div className="search-box">
                                <Search size={18} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search your lawyers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="contacts-list">
                            {filteredContacts.length === 0 ? (
                                <div className="no-contacts">No lawyers connected yet.</div>
                            ) : (
                                filteredContacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                                        onClick={() => handleSelectContact(contact)}
                                    >
                                        <div className="contact-avatar">
                                            {contact.avatar ? (
                                                <img src={`${API_BASE}/${contact.avatar.replace(/\\/g, '/')}`} alt={contact.name} />
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
                                                            {contact.lastMessage.isSender && (
                                                                <span className={`tick-status-inline ${contact.lastMessage.isRead ? 'read' : contact.lastMessage.isDelivered ? 'delivered' : 'sent'}`}>
                                                                    {contact.lastMessage.isDelivered || contact.lastMessage.isRead ? '✓✓' : '✓'}
                                                                </span>
                                                            )}
                                                            {contact.lastMessage.content}
                                                        </>
                                                    ) : (
                                                        <span className="role-tag">Connected Lawyer</span>
                                                    )}
                                                </span>
                                                {(contact.unreadCount > 0) && (
                                                    <span className="unread-badge">{contact.unreadCount}</span>
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
                                                <img src={`${API_BASE}/${selectedContact.avatar.replace(/\\/g, '/')}`} alt={selectedContact.name} />
                                            ) : (
                                                <div className="avatar-placeholder">{selectedContact.name[0]}</div>
                                            )}
                                        </div>
                                        <div className="user-meta">
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {selectedContact.name} 
                                                <ShieldCheck size={16} color="#0a66c2" />
                                            </h4>
                                            <p>{selectedContact.specialization || 'Lawyer'} • Online</p>
                                        </div>
                                    </div>
                                    <div className="header-actions">
                                        <button title="Voice Call"><Phone size={20} /></button>
                                        <button title="Video Call"><Video size={20} /></button>
                                        <button title="Menu"><MoreVertical size={20} /></button>
                                    </div>
                                </div>

                                <div 
                                    className="messages-container" 
                                    ref={messagesContainerRef}
                                    onScroll={handleScroll}
                                >
                                    {messages.length === 0 ? (
                                        <div className="empty-chat">
                                            <div className="info-bubble">
                                                Legal consultations are end-to-end encrypted.
                                            </div>
                                            <p>Start your consultation with {selectedContact.name}</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isSent = msg.senderId === (currentUser?._id || currentUser?.id);
                                            let tickClass = 'sent';
                                            let tickMark = '✓';
                                            if (isSent) {
                                                if (msg.isRead) { tickClass = 'read'; tickMark = '✓✓'; }
                                                else if (msg.isDelivered) { tickClass = 'delivered'; tickMark = '✓✓'; }
                                            }
                                            return (
                                                <div key={msg._id || index} className={`message-row ${isSent ? 'sent' : 'received'}`}>
                                                    <div className="message-bubble">
                                                        {msg.attachment && (
                                                            <div className="chat-attachment-preview">
                                                                {msg.attachment.fileType.startsWith('image/') ? (
                                                                    <img src={`${API_BASE}/${msg.attachment.fileUrl.replace(/\\/g, '/')}`} alt="attachment" className="chat-img-msg" />
                                                                ) : msg.attachment.fileType.startsWith('audio/') ? (
                                                                    <div className="voice-msg-container">
                                                                        <audio controls className="chat-audio-player" crossOrigin="anonymous">
                                                                            <source src={`${API_BASE}/${msg.attachment.fileUrl.replace(/\\/g, '/')}`} type={msg.attachment.fileType} />
                                                                        </audio>
                                                                    </div>
                                                                ) : (
                                                                    <a href={`${API_BASE}/${msg.attachment.fileUrl.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="chat-file-msg">
                                                                        <Paperclip size={16} /> {msg.attachment.fileName}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        {msg.content && <p>{msg.content}</p>}
                                                        <span className="msg-time">
                                                            {formatTime(msg.createdAt)}
                                                            {isSent && <span className={`tick-status ${tickClass}`}>{tickMark}</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form className="chat-input-area" onSubmit={handleSendMessage}>
                                    {isRecording ? (
                                        <div className="recording-ui" style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                                            <div className="recording-dot" style={{ transform: `scale(${1 + volume/100})` }}></div>
                                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Recording... {formatDuration(recordingTime)}</span>
                                            <button type="button" onClick={stopRecording} className="stop-recording-btn" style={{ marginLeft: 'auto', color: '#ef4444' }}>
                                                <StopCircle size={24} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="input-controls" style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                                                <button type="button" className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                                    <Smile size={22} />
                                                </button>
                                                
                                                {showEmojiPicker && (
                                                    <div className="emoji-popover-full">
                                                        <EmojiPicker onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} />
                                                    </div>
                                                )}

                                                <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()}>
                                                    <Paperclip size={22} />
                                                </button>
                                                <input type="file" ref={fileInputRef} onChange={(e) => setAttachment(e.target.files[0])} style={{ display: 'none' }} />
                                            </div>

                                            {attachment && (
                                                <div className="pending-attachment">
                                                    <span className="attachment-badge">
                                                        {attachment.name} <X size={14} onClick={() => setAttachment(null)} style={{ cursor: 'pointer' }} />
                                                    </span>
                                                </div>
                                            )}

                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    placeholder="Type a message"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                />
                                            </div>

                                            {(!newMessage.trim() && !attachment) ? (
                                                <button type="button" className="voice-btn" onClick={startRecording}>
                                                    <Mic size={22} />
                                                </button>
                                            ) : (
                                                <button type="submit" className="send-btn">
                                                    <Send size={20} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </form>
                            </>
                        ) : (
                            <div className="chat-welcome">
                                <div className="welcome-content">
                                    <div className="welcome-logo">⚖️</div>
                                    <h1>Secure Consultation</h1>
                                    <p>Discuss your case privately with verified legal experts.</p>
                                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
                                        <div style={{ background: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                            <Star size={24} color="#c19651" style={{ marginBottom: '10px' }} />
                                            <div style={{ fontWeight: '800' }}>Lawyers</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Verified Experts</div>
                                        </div>
                                    </div>
                                    <p className="secure-tag" style={{ marginTop: '40px' }}>🔒 End-to-end encrypted</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientCommunicationPage;

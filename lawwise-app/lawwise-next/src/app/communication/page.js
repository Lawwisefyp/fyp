'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import { Search, Mail, Phone, Video, MoreVertical, Send, Smile, Paperclip, ShieldCheck, Users, Briefcase, X, Mic, StopCircle } from 'lucide-react';
import '@/styles/Communication.css';

// Dynamic import for emoji picker to improve performance
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const CommunicationPage = () => {
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [activeTab, setActiveTab] = useState('Lawyer'); // 'Lawyer' or 'Client'
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    
    // Emoji & Attachment states
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [attachment, setAttachment] = useState(null);
    
    const hasInitialized = useRef(false);
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
            // If we are within 100px of the bottom, consider it "at bottom"
            isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const type = localStorage.getItem('userType') || 'lawyer';
            setUserType(type);
            const info = type === 'lawyer' ? JSON.parse(localStorage.getItem('lawyerInfo') || '{}') : JSON.parse(localStorage.getItem('clientInfo') || '{}');
            setCurrentUser(info);
        }

        const loadContacts = async (isInitial = false) => {
            try {
                const data = await authService.getChatContacts();
                if (data.success) {
                    setContacts(data.contacts);
                    
                    // Only handle the URL redirect ONCE on first load, never on poll ticks
                    if (isInitial && !hasInitialized.current) {
                        hasInitialized.current = true;
                        const contactId = searchParams.get('userId');
                        if (contactId) {
                            const target = data.contacts.find(c => c.id.toString() === contactId);
                            if (target) {
                                setSelectedContact(target);
                                setActiveTab(target.role);
                                fetchMessages(target.id);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load contacts:', error);
            } finally {
                setLoading(false);
            }
        };

        loadContacts(true);
    }, [searchParams]);

    // Separate polling effect so it doesn't restart when selectedContact changes
    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedContact) {
                fetchMessages(selectedContact.id);
                authService.markMessagesAsRead(selectedContact.id).catch(() => {});
                // Refresh contact list for tick/unread updates only (not initial load)
                authService.getChatContacts().then(data => {
                    if (data.success) setContacts(data.contacts);
                }).catch(() => {});
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedContact]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = lastMessage?.senderId === (currentUser?._id || currentUser?.id);

        // Only scroll if message count increased
        if (messages.length > prevMessagesCountRef.current) {
            // Scroll if I am the sender OR if I was already at the bottom
            if (isMyMessage || isAtBottomRef.current) {
                scrollToBottom(true); // Instant scroll
            }
        }
        prevMessagesCountRef.current = messages.length;
    }, [messages]);

    const fetchMessages = async (contactId) => {
        try {
            const data = await authService.getMessages(contactId);
            if (data.success) {
                // Reliable check: Only update state if message count or last message content/id has changed
                // This prevents constant re-renders and auto-scrolling during polling
                const lastNewMessage = data.messages[data.messages.length - 1];
                const lastOldMessage = messages[messages.length - 1];
                
                if (data.messages.length !== messages.length || 
                    lastNewMessage?._id !== lastOldMessage?._id ||
                    lastNewMessage?.isRead !== lastOldMessage?.isRead ||
                    lastNewMessage?.isDelivered !== lastOldMessage?.isDelivered) {
                    setMessages(data.messages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSelectContact = (contact) => {
        prevMessagesCountRef.current = 0; 
        isAtBottomRef.current = true; // Force scroll on first load
        setSelectedContact(contact);
        setMessages([]); // Clear previous messages immediately
        fetchMessages(contact.id);
        // Immediately mark incoming messages as read when chat is opened
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
                formData.append('receiverModel', selectedContact.role);
                formData.append('content', newMessage);
                formData.append('chatAttachment', attachment);
                
                data = await authService.sendMessage(formData);
            } else {
                data = await authService.sendMessage({
                    receiverId: selectedContact.id,
                    receiverModel: selectedContact.role,
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

    const handleEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    const handleFileSelect = (e) => {
        if (e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            // Setup Volume Analyzer
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

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus' : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const finalMimeType = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
                
                console.log('Recording stopped. Final Blob size:', audioBlob.size, 'bytes');
                
                if (audioBlob.size > 1000) {
                    // LOCAL TEST: Try to play the audio locally for debugging
                    const audioURL = URL.createObjectURL(audioBlob);
                    const testAudio = new Audio(audioURL);
                    testAudio.play().then(() => {
                        console.log('Local playback started successfully - Audio data is valid.');
                    }).catch(err => {
                        console.error('Local playback failed - The recorded data might be empty or corrupt:', err);
                    });

                    const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: finalMimeType });
                    sendVoiceMessage(audioFile);
                } else {
                    console.error('Recording failed: Audio data is too small (silent).');
                    alert('Recording was too quiet or empty. Please speak louder or check your mic.');
                }
                
                stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) audioContextRef.current.close();
                cancelAnimationFrame(animationFrameRef.current);
                setVolume(0);
            };

            mediaRecorder.start(50); // High frequency capture
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Microphone access denied or not found.');
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
        if (!selectedContact) return;

        try {
            const formData = new FormData();
            formData.append('receiverId', selectedContact.id);
            formData.append('receiverModel', selectedContact.role);
            formData.append('content', 'Voice Message');
            formData.append('chatAttachment', audioFile);
            
            const data = await authService.sendMessage(formData);
            if (data.success) {
                fetchMessages(selectedContact.id);
            }
        } catch (error) {
            console.error('Failed to send voice message:', error);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!selectedContact || !emailSubject.trim() || !emailBody.trim()) return;

        setSendingEmail(true);
        try {
            const contactEmail = selectedContact.email;
            if (!contactEmail) {
                alert('This contact does not have a registered email address on file.');
                setSendingEmail(false);
                return;
            }

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
            }
        } catch (error) {
            console.error('Failed to send official email:', error);
        } finally {
            setSendingEmail(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredContacts = contacts.filter(c => 
        c.role === activeTab && 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="chat-loading"><div className="loader"></div></div>;

    return (
        <div className="dashboard-body">
            <LawyerSidebar />
            
            <div className="communication-container" style={{ flex: 1, height: '100vh', padding: '0' }}>
                <div className="chat-app" style={{ margin: '0', borderRadius: '0', height: '100%' }}>
                    {/* Sidebar */}
                    <div className="chat-sidebar">
                        <div className="sidebar-header" style={{ padding: '20px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#111' }}>Messages</h2>
                            <div className="tab-switcher" style={{ display: 'flex', background: '#f3f2ef', borderRadius: '8px', padding: '4px', marginTop: '15px' }}>
                                <button 
                                    onClick={() => setActiveTab('Lawyer')}
                                    style={{ 
                                        flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                        background: activeTab === 'Lawyer' ? 'white' : 'transparent',
                                        fontWeight: '700', color: activeTab === 'Lawyer' ? '#0a66c2' : '#666',
                                        boxShadow: activeTab === 'Lawyer' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}
                                >
                                    <Briefcase size={16} /> Lawyers
                                </button>
                                <button 
                                    onClick={() => setActiveTab('Client')}
                                    style={{ 
                                        flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                        background: activeTab === 'Client' ? 'white' : 'transparent',
                                        fontWeight: '700', color: activeTab === 'Client' ? '#0a66c2' : '#666',
                                        boxShadow: activeTab === 'Client' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}
                                >
                                    <Users size={16} /> Clients
                                </button>
                            </div>
                        </div>

                        <div className="search-contacts">
                            <div className="search-box">
                                <Search size={18} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder={`Search ${activeTab.toLowerCase()}s...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="contacts-list">
                            {filteredContacts.length === 0 ? (
                                <div className="no-contacts">No {activeTab.toLowerCase()}s found</div>
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
                                                        <span className="role-tag">{contact.specialization || contact.role}</span>
                                                    )}
                                                </span>
                                                {(contact.unreadCount > 0) && (
                                                    <span className="unread-badge">{contact.unreadCount}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )).filter(Boolean)
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
                                                {selectedContact.role === 'Lawyer' && <ShieldCheck size={16} color="#0a66c2" />}
                                            </h4>
                                            <p>{selectedContact.specialization || selectedContact.role} • Online</p>
                                        </div>
                                    </div>
                                    <div className="header-actions">
                                        <button title="Send Official Email" onClick={() => setShowEmailModal(true)}><Mail size={20} /></button>
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
                                                Messages are end-to-end encrypted. No one outside of this chat can read them.
                                            </div>
                                            <p>Start a conversation with {selectedContact.name}</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isSent = msg.senderId === (currentUser?._id || currentUser?.id);
                                            let tickClass = 'sent';      // single grey ✓ = saved to server
                                            let tickMark = '✓';
                                            if (isSent) {
                                                if (msg.isRead) {
                                                    tickClass = 'read';      // double blue ✓✓
                                                    tickMark = '✓✓';
                                                } else if (msg.isDelivered) {
                                                    tickClass = 'delivered'; // double grey ✓✓
                                                    tickMark = '✓✓';
                                                }
                                            }
                                            return (
                                                <div
                                                    key={msg._id || index}
                                                    className={`message-row ${isSent ? 'sent' : 'received'}`}
                                                >
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
                                                                        <div className="voice-actions" style={{ marginTop: '5px' }}>
                                                                            <a href={`${API_BASE}/${msg.attachment.fileUrl.replace(/\\/g, '/')}`} download className="download-voice-link" style={{ fontSize: '11px', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                <Search size={10} /> Download to play offline
                                                                            </a>
                                                                        </div>
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
                                                            {isSent && (
                                                                <span className={`tick-status ${tickClass}`}>{tickMark}</span>
                                                            )}
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
                                            <div 
                                                className="recording-dot" 
                                                style={{ 
                                                    transform: `scale(${1 + volume/100})`,
                                                    boxShadow: `0 0 ${volume/2}px rgba(239, 68, 68, 0.6)`
                                                }}
                                            ></div>
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
                                                        <EmojiPicker 
                                                            onEmojiClick={handleEmojiClick}
                                                            autoFocusSearch={false}
                                                            theme="light"
                                                            width="300px"
                                                            height="400px"
                                                        />
                                                    </div>
                                                )}

                                                <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()}>
                                                    <Paperclip size={22} />
                                                </button>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    onChange={handleFileSelect} 
                                                    style={{ display: 'none' }}
                                                />
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
                                                    onFocus={() => setShowEmojiPicker(false)}
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
                                    <h1>Lawwise Messenger</h1>
                                    <p>Connect with other legal professionals and manage client consultations seamlessly.</p>
                                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
                                        <div style={{ background: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                            <Briefcase size={24} color="#0a66c2" style={{ marginBottom: '10px' }} />
                                            <div style={{ fontWeight: '800' }}>Networking</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Chat with colleagues</div>
                                        </div>
                                        <div style={{ background: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                            <Users size={24} color="#057642" style={{ marginBottom: '10px' }} />
                                            <div style={{ fontWeight: '800' }}>Clients</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Case consultations</div>
                                        </div>
                                    </div>
                                    <p className="secure-tag" style={{ marginTop: '40px' }}>🔒 End-to-end encrypted</p>
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
                                    <input 
                                        type="text" 
                                        value={`${selectedContact.name} (${selectedContact.email || 'No email on file'})`} 
                                        disabled 
                                        style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                                    />
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
        </div>
    );
};

export default CommunicationPage;

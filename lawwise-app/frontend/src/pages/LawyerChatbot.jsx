import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LawyerChatbot.css';

const LawyerChatbot = () => {
    const STORAGE_KEY = 'lawwiseChatSessions';
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        const savedSessions = raw ? JSON.parse(raw) : [];
        setSessions(savedSessions);
        if (savedSessions.length > 0) {
            setCurrentSessionId(savedSessions[savedSessions.length - 1].id);
        } else {
            startNewChat(savedSessions);
        }
    }, []);

    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    useEffect(() => {
        scrollToBottom();
    }, [sessions, currentSessionId, isThinking]);

    const startNewChat = (currentSessions = sessions) => {
        const id = Date.now().toString();
        const newSession = {
            id,
            title: `Chat ${currentSessions.length + 1}`,
            createdAt: new Date().toLocaleString(),
            messages: [{ role: 'bot', text: "Hello! I’m Lawwise, your AI legal assistant. How can I help you today?" }]
        };
        const updatedSessions = [...currentSessions, newSession];
        setSessions(updatedSessions);
        setCurrentSessionId(id);
    };

    const deleteSession = (e, id) => {
        e.stopPropagation();
        const updatedSessions = sessions.filter(s => s.id !== id);
        setSessions(updatedSessions);
        if (currentSessionId === id) {
            if (updatedSessions.length > 0) {
                setCurrentSessionId(updatedSessions[updatedSessions.length - 1].id);
            } else {
                startNewChat([]);
            }
        }
    };

    const currentSession = sessions.find(s => s.id === currentSessionId);

    const sendMessage = async () => {
        if (!input.trim() || isThinking) return;

        const userText = input.trim();
        setInput('');

        // Add user message to state
        const updatedSessions = sessions.map(s => {
            if (s.id === currentSessionId) {
                return { ...s, messages: [...s.messages, { role: 'user', text: userText }] };
            }
            return s;
        });
        setSessions(updatedSessions);
        setIsThinking(true);

        try {
            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText })
            });

            if (!response.ok || !response.body) throw new Error('Failed to connect to chatbot server');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botText = '';

            // We'll update the session messages with an empty bot message first
            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages: [...s.messages, { role: 'bot', text: '' }] };
                }
                return s;
            }));

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                botText += chunk;

                setSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                        const newMessages = [...s.messages];
                        newMessages[newMessages.length - 1] = { role: 'bot', text: botText };
                        return { ...s, messages: newMessages };
                    }
                    return s;
                }));
            }
        } catch (error) {
            console.error(error);
            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages: [...s.messages, { role: 'bot', text: '❌ Error: could not contact chatbot server.' }] };
                }
                return s;
            }));
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="chatbot-page-body">
            <div className="chatbot-main-container">
                {/* Sidebar */}
                <div className="chatbot-sidebar">
                    <div className="sidebar-header">Previous Chats</div>
                    <div className="chat-history-list">
                        {sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>No saved chats</div>
                        ) : (
                            sessions.slice().reverse().map(session => (
                                <div
                                    key={session.id}
                                    className={`history-item ${currentSessionId === session.id ? 'active' : ''}`}
                                    onClick={() => setCurrentSessionId(session.id)}
                                >
                                    <div className="history-item-title">{session.title}</div>
                                    <div className="history-item-date">{session.createdAt}</div>
                                    <button className="delete-session-btn" onClick={(e) => deleteSession(e, session.id)}>🗑</button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="new-chat-container">
                        <button className="btn-new-chat" onClick={() => startNewChat()}>+ New Chat</button>
                        <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <Link to="/lawyer-dashboard" style={{ color: '#4a90e2', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none' }}>← Back to Dashboard</Link>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-content-area">
                    <div className="chat-header">
                        <h2>Lawwise Chatbot</h2>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>Your AI Legal Assistant</div>
                    </div>

                    <div className="chat-messages-container">
                        {currentSession?.messages.map((msg, idx) => (
                            <div key={idx} className={`message-wrap ${msg.role}`}>
                                <div className="message-bubble">{msg.text}</div>
                            </div>
                        ))}
                        {isThinking && !currentSession?.messages[currentSession.messages.length - 1].text && (
                            <div className="message-wrap bot">
                                <div className="message-bubble">thinking... ⏳</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder="Type your question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={isThinking}
                        />
                        <button className="btn-send-chat" onClick={sendMessage} disabled={isThinking || !input.trim()}>
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LawyerChatbot;

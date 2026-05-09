'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Video, Mic, MicOff, VideoOff, PhoneOff, User, Settings, Shield } from 'lucide-react';

const VideoConsultationPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [meetingStarted, setMeetingStarted] = useState(false);

    useEffect(() => {
        // Load Jitsi script
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => startMeeting();
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const startMeeting = () => {
        const domain = 'meet.jit.si';
        const options = {
            roomName: `Lawwise-Consultation-${id}`,
            width: '100%',
            height: '100%',
            parentNode: document.querySelector('#jitsi-container'),
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ],
            },
            configOverwrite: {
                disableDeepLinking: true,
            },
        };
        new window.JitsiMeetExternalAPI(domain, options);
        setMeetingStarted(true);
    };

    return (
        <div style={{ height: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '15px 30px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Video size={20} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Legal Consultation</h2>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Secure End-to-End Encrypted Session</p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.8rem', fontWeight: '700', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                        <Shield size={14} /> SECURE
                    </div>
                    <button 
                        onClick={() => router.back()}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <PhoneOff size={16} /> End Call
                    </button>
                </div>
            </div>

            {/* Video Area */}
            <div id="jitsi-container" style={{ flex: 1, position: 'relative' }}>
                {!meetingStarted && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                        <div className="pulse" style={{ width: '100px', height: '100px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <Video size={40} color="#3b82f6" />
                        </div>
                        <p style={{ color: '#94a3b8' }}>Initializing secure video bridge...</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .pulse {
                    animation: pulse-animation 2s infinite;
                }
                @keyframes pulse-animation {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
            `}</style>
        </div>
    );
};

export default VideoConsultationPage;

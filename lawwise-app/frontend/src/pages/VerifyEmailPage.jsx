import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/LawyerPortal.css'; // Reusing styles for consistency

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const hasCalledVerify = useRef(false);

    const token = searchParams.get('token');
    const type = searchParams.get('type');

    useEffect(() => {
        const verify = async () => {
            if (hasCalledVerify.current) return;
            hasCalledVerify.current = true;

            if (!token || !type) {
                setStatus('error');
                setMessage('Invalid verification link.');
                setLoading(false);
                return;
            }

            try {
                const result = await authService.verifyEmail(token, type);
                if (result.success) {
                    setStatus('success');
                    setMessage(result.message);
                }
            } catch (error) {
                setStatus('error');
                // Improve message: if it fails, it might be already verified or truly expired
                const errorMsg = error.response?.data?.error || 'Verification failed.';
                setMessage(`${errorMsg} You may have already verified your account. Please try logging in.`);
            } finally {
                setLoading(false);
            }
        };

        verify();
    }, [token, type]);

    return (
        <div className="lawyer-portal-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="right-panel" style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', padding: '40px' }}>
                <div className="login-header" style={{ textAlign: 'center' }}>
                    <div className="brand-icon" style={{ margin: '0 auto 20px', background: status === 'success' ? '#10b981' : (status === 'error' ? '#ef4444' : '#c19651'), width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                        {status === 'verifying' && (
                            <div className="loading-spinner" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
                        )}
                        {status === 'success' && (
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        )}
                        {status === 'error' && (
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        )}
                    </div>
                    <h2 className="login-title">
                        {status === 'verifying' ? 'Verifying Email' : (status === 'success' ? 'Email Verified!' : 'Verification Failed')}
                    </h2>
                    <p className="login-subtitle" style={{ marginTop: '10px', fontSize: '16px' }}>{message}</p>
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    {status === 'success' && (
                        <Link to={type === 'lawyer' ? '/lawyer-portal' : '/client-portal'} className="login-btn" style={{ textDecoration: 'none', display: 'block' }}>
                            Go to Login
                        </Link>
                    )}
                    {status === 'error' && (
                        <Link to="/" className="back-btn" style={{ textDecoration: 'none' }}>
                            Return to Homepage
                        </Link>
                    )}
                    {status === 'verifying' && <p>Please wait while we verify your account...</p>}
                </div>
            </div>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
};

export default VerifyEmailPage;

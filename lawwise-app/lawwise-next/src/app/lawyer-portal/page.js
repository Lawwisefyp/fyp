'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/api';
import '@/styles/LawyerPortal.css';

const LawyerPortalPage = () => {
    const [alert, setAlert] = useState({ message: '', type: '' });
    const [view, setView] = useState('login'); // 'login', 'register', 'forgot', 'verify', 'reset'
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Form states
    const [loginData, setLoginData] = useState({ email: '', password: '', remember: false });
    const [registerData, setRegisterData] = useState({
        fullName: '',
        email: '',
        barNumber: '',
        specialization: '',
        password: '',
        confirmPassword: '',
        terms: false,
        otp: ''
    });

    const showAlert = (message, type) => {
        setAlert({ message, type });
        if (type === 'success' && view === 'login') {
            // success alert stays a bit longer before redirect
        } else {
            setTimeout(() => setAlert({ message: '', type: '' }), 5000);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ message: '', type: '' });

        try {
            const result = await authService.login(loginData.email, loginData.password);
            if (result.success) {
                const token = result.token;
                if (loginData.remember) {
                    localStorage.setItem('lawyerToken', token);
                } else {
                    sessionStorage.setItem('lawyerToken', token);
                }
                localStorage.setItem('lawyerInfo', JSON.stringify(result.lawyer));
                localStorage.setItem('userType', 'lawyer');
                showAlert(result.message, 'success');
                setTimeout(() => router.push('/lawyer-dashboard'), 1500);
            }
        } catch (error) {
            showAlert(error.response?.data?.error || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (registerData.password !== registerData.confirmPassword) {
            showAlert('Passwords do not match', 'error');
            return;
        }
        setLoading(true);
        setAlert({ message: '', type: '' });

        try {
            const result = await authService.register({
                fullName: registerData.fullName,
                email: registerData.email,
                password: registerData.password,
                confirmPassword: registerData.confirmPassword,
                barNumber: registerData.barNumber,
                specialization: registerData.specialization
            });

            showAlert(result.message, 'success');
            setRegisterData(prev => ({ ...prev, password: '', confirmPassword: '' })); 
            setTimeout(() => setView('login'), 3000);
        } catch (error) {
            showAlert(error.response?.data?.error || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lawyer-portal-body">
            <div className="login-container">
                <div className="left-panel">
                    <div className="decorative-line"></div>
                    <div className="decorative-line"></div>
                    <div className="brand-content">
                        <div className="brand-icon">
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3L20 9v12a2 2 0 01-2 2H6a2 2 0 01-2-2V9l8-6z" />
                                <path d="M9 21V12h6v9" />
                                <circle cx="12" cy="8" r="1.5" />
                            </svg>
                        </div>
                        <h1 className="brand-title">LAWWISE</h1>
                        <p className="brand-subtitle">
                            Professional Legal Practice Management<br />
                            Secure Access for Legal Professionals
                        </p>
                    </div>
                </div>

                <div className="right-panel">
                    {view === 'login' && (
                        <div id="loginSection">
                            <div className="login-header">
                                <h2 className="login-title">Lawyer Portal</h2>
                                <p className="login-subtitle">Access your legal practice dashboard</p>
                            </div>

                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

                            <form onSubmit={handleLoginSubmit}>
                                <div className="form-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Professional Email"
                                        required
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0110 0v4" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Password"
                                        required
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    />
                                </div>
                                <div className="form-options">
                                    <div className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            className="checkbox"
                                            checked={loginData.remember}
                                            onChange={(e) => setLoginData({ ...loginData, remember: e.target.checked })}
                                        />
                                        <label htmlFor="remember" className="checkbox-label">Remember me</label>
                                    </div>
                                    <a href="#" className="forgot-link" onClick={() => setView('forgot')}>Forgot password?</a>
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Logging in...' : 'Log In to Dashboard'}
                                </button>
                            </form>
                            <div className="signup-link">
                                Don't have a lawyer account? <a onClick={() => setView('register')}>Register Here</a>
                            </div>
                            <div className="divider"><span>OR</span></div>
                            <div style={{ textAlign: 'center' }}>
                                <Link href="/" className="back-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>← Back to Main Screen</Link>
                            </div>
                        </div>
                    )}

                    {view === 'register' && (
                        <div id="registerSection">
                            <div className="login-header">
                                <h2 className="login-title">Create Account</h2>
                                <p className="login-subtitle">Register to access your legal practice dashboard</p>
                            </div>

                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

                            <form onSubmit={handleRegisterSubmit}>
                                <div className="form-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Full Name"
                                        required
                                        value={registerData.fullName}
                                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Professional Email"
                                        required
                                        value={registerData.email}
                                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 7V3" />
                                            <path d="M12 21v-4" />
                                            <path d="M16 11h6" />
                                            <path d="M2 11h6" />
                                            <path d="M6 15l-4 4" />
                                            <path d="M22 19l-4-4" />
                                            <path d="M22 3l-4 4" />
                                            <path d="M6 7l-4-4" />
                                            <circle cx="12" cy="11" r="3" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Bar Registration Number"
                                        required
                                        value={registerData.barNumber}
                                        onChange={(e) => setRegisterData({ ...registerData, barNumber: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 21h18" />
                                            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7l-9-4-9 4z" />
                                            <path d="M9 21V11h6v10" />
                                        </svg>
                                    </div>
                                    <select
                                        className="form-input"
                                        required
                                        style={{ paddingLeft: '65px' }}
                                        value={registerData.specialization}
                                        onChange={(e) => setRegisterData({ ...registerData, specialization: e.target.value })}
                                    >
                                        <option value="">Select Specialization</option>
                                        <option value="Corporate Law">Corporate Law</option>
                                        <option value="Criminal Law">Criminal Law</option>
                                        <option value="Family Law">Family Law</option>
                                        <option value="Tax Law">Tax Law</option>
                                        <option value="Civil Law">Civil Law</option>
                                        <option value="Property Law">Property Law</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0110 0v4" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Password (min 8 characters)"
                                        required
                                        minLength="8"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0110 0v4" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Confirm Password"
                                        required
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <div className="form-options">
                                    <div className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            className="checkbox"
                                            required
                                            checked={registerData.terms}
                                            onChange={(e) => setRegisterData({ ...registerData, terms: e.target.checked })}
                                        />
                                        <label htmlFor="terms" className="checkbox-label">I agree to Terms & Conditions</label>
                                    </div>
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </form>
                            <div className="signup-link">
                                Already have an account? <a onClick={() => setView('login')}>Back to Login</a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LawyerPortalPage;

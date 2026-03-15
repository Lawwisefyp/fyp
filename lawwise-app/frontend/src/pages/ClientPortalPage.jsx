import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/ClientPortal.css';

const ClientPortalPage = () => {
    const [alert, setAlert] = useState({ message: '', type: '' });
    const [view, setView] = useState('login'); // 'login', 'register', 'forgot', 'verify', 'reset'
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Form states
    const [loginData, setLoginData] = useState({ email: '', password: '', remember: false });
    const [registerData, setRegisterData] = useState({
        fullName: '',
        email: '',
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
            const result = await authService.clientLogin(loginData.email, loginData.password);
            if (result.success) {
                const token = result.token;
                if (loginData.remember) {
                    localStorage.setItem('clientToken', token);
                } else {
                    sessionStorage.setItem('clientToken', token);
                }
                localStorage.setItem('clientInfo', JSON.stringify(result.client));
                localStorage.setItem('userType', 'client');
                showAlert('Login successful! Redirecting...', 'success');
                setTimeout(() => navigate('/client-dashboard'), 1500);
            }
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.error === 'Email not verified') {
                showAlert(
                    <span>
                        {error.response.data.message}
                        <button
                            onClick={() => handleResendVerification(loginData.email)}
                            style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginLeft: '5px' }}
                        >
                            Resend Email
                        </button>
                    </span>,
                    'error'
                );
            } else {
                showAlert(error.response?.data?.error || 'Login failed. Please check your credentials.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async (email) => {
        try {
            const result = await authService.resendVerification(email, 'client');
            showAlert(result.message, 'success');
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to resend verification email', 'error');
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
            const result = await authService.clientRegister({
                fullName: registerData.fullName,
                email: registerData.email,
                password: registerData.password
            });

            if (result.success) {
                showAlert(result.message || 'Account created successfully! Please check your email to verify your account.', 'success');
                setRegisterData(prev => ({ ...prev, password: '', confirmPassword: '' })); // clear sensitive data
                setTimeout(() => setView('login'), 3000);
            }
        } catch (error) {
            showAlert(error.response?.data?.error || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authService.forgotPassword(loginData.email, 'client');
            showAlert(res.message, 'success');
            setView('verify');
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to send reset code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authService.verifyOTP(loginData.email, registerData.otp, 'client');
            showAlert(res.message, 'success');
            setView('reset');
        } catch (error) {
            showAlert(error.response?.data?.error || 'Invalid code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (registerData.password !== registerData.confirmPassword) {
            showAlert('Passwords do not match', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await authService.resetPassword(loginData.email, registerData.otp, registerData.password, 'client');
            showAlert(res.message, 'success');
            setTimeout(() => setView('login'), 2000);
        } catch (error) {
            showAlert(error.response?.data?.error || 'Reset failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="client-portal-body">
            <div className="login-container">
                <div className="left-panel">
                    <div className="decorative-line"></div>
                    <div className="decorative-line"></div>
                    <div className="brand-content">
                        <div className="brand-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                        </div>
                        <h1 className="brand-title">LAWWISE</h1>
                        <p className="brand-subtitle">
                            Secure Legal Access for Clients<br />
                            Transparent Case Management
                        </p>
                    </div>
                </div>

                <div className="right-panel">
                    {view === 'login' && (
                        <div id="loginSection">
                            <div className="login-header">
                                <h2 className="login-title">Client Login</h2>
                                <p className="login-subtitle">Access your client dashboard</p>
                            </div>

                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

                            <form onSubmit={handleLoginSubmit}>
                                <div className="form-group">
                                    <div className="input-icon">📧</div>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Email"
                                        required
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">🔒</div>
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
                                    <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); setView('forgot'); }}>Forgot password?</a>
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Logging in...' : 'Log In to Dashboard'}
                                </button>
                            </form>
                            <div className="signup-link">
                                Don't have a client account? <a onClick={() => setView('register')}>Register Here</a>
                            </div>
                            <div className="divider"><span>OR</span></div>
                            <div style={{ textAlign: 'center' }}>
                                <Link to="/" className="back-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>← Back to Main Screen</Link>
                            </div>
                        </div>
                    )}

                    {view === 'register' && (
                        <div id="registerSection">
                            <div className="login-header">
                                <h2 className="login-title">Client Signup</h2>
                                <p className="login-subtitle">Create your client account</p>
                            </div>

                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

                            <form onSubmit={handleRegisterSubmit}>
                                <div className="form-group">
                                    <div className="input-icon">👤</div>
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
                                    <div className="input-icon">📧</div>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Email"
                                        required
                                        value={registerData.email}
                                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">🔒</div>
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
                                    <div className="input-icon">🔒</div>
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

                    {view === 'forgot' && (
                        <div id="forgotSection">
                            <div className="login-header">
                                <h2 className="login-title">Reset Password</h2>
                                <p className="login-subtitle">Enter your email to receive a verification code</p>
                            </div>
                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}
                            <form onSubmit={handleForgotPassword}>
                                <div className="form-group">
                                    <div className="input-icon">📧</div>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Registered Email"
                                        required
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Verification Code'}
                                </button>
                            </form>
                            <div className="signup-link">
                                <a onClick={() => setView('login')}>Back to Login</a>
                            </div>
                        </div>
                    )}

                    {view === 'verify' && (
                        <div id="verifySection">
                            <div className="login-header">
                                <h2 className="login-title">Verify Code</h2>
                                <p className="login-subtitle">Enter the 6-digit code sent to {loginData.email}</p>
                            </div>
                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}
                            <form onSubmit={handleVerifyOTP}>
                                <div className="form-group">
                                    <div className="input-icon">🔢</div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Verification Code"
                                        required
                                        maxLength="6"
                                        value={registerData.otp || ''}
                                        onChange={(e) => setRegisterData({ ...registerData, otp: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </form>
                            <div className="signup-link">
                                <a onClick={() => setView('forgot')}>Resend Code</a>
                            </div>
                        </div>
                    )}

                    {view === 'reset' && (
                        <div id="resetSection">
                            <div className="login-header">
                                <h2 className="login-title">New Password</h2>
                                <p className="login-subtitle">Create a strong new password</p>
                            </div>
                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}
                            <form onSubmit={handleResetPassword}>
                                <div className="form-group">
                                    <div className="input-icon">🔒</div>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="New Password"
                                        required
                                        minLength="8"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">🔒</div>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Confirm New Password"
                                        required
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientPortalPage;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/LawyerPortal.css'; // Reusing the professional styling

const StudentPortalPage = () => {
    const [alert, setAlert] = useState({ message: '', type: '' });
    const [view, setView] = useState('login'); // 'login', 'register', 'forgot', 'verify', 'reset'
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Form states
    const [loginData, setLoginData] = useState({ email: '', password: '', remember: false });
    const [registerData, setRegisterData] = useState({
        fullName: '',
        email: '',
        university: '',
        yearOfStudy: '',
        password: '',
        confirmPassword: '',
        terms: false,
        otp: ''
    });

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: '', type: '' }), 5000);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ message: '', type: '' });

        try {
            const result = await authService.studentLogin(loginData.email, loginData.password);
            if (result.success) {
                const token = result.token;
                if (loginData.remember) {
                    localStorage.setItem('studentToken', token);
                } else {
                    sessionStorage.setItem('studentToken', token);
                }
                localStorage.setItem('studentInfo', JSON.stringify(result.student));
                localStorage.setItem('userType', 'student');
                showAlert(result.message, 'success');
                setTimeout(() => navigate('/student-dashboard'), 1500);
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
            const result = await authService.resendVerification(email, 'student');
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
            const result = await authService.studentRegister({
                fullName: registerData.fullName,
                email: registerData.email,
                password: registerData.password,
                university: registerData.university,
                yearOfStudy: registerData.yearOfStudy
            });

            showAlert(result.message, 'success');
            setTimeout(() => setView('login'), 3000);
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
            const res = await authService.forgotPassword(loginData.email, 'student');
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
            const res = await authService.verifyOTP(loginData.email, registerData.otp, 'student');
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
            const res = await authService.resetPassword(loginData.email, registerData.otp, registerData.password, 'student');
            showAlert(res.message, 'success');
            setTimeout(() => setView('login'), 2000);
        } catch (error) {
            showAlert(error.response?.data?.error || 'Reset failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lawyer-portal-body">
            <div className="login-container">
                <div className="left-panel" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                    <div className="decorative-line"></div>
                    <div className="decorative-line"></div>
                    <div className="brand-content">
                        <div className="brand-icon">
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        </div>
                        <h1 className="brand-title">LAWWISE</h1>
                        <h2 style={{ color: 'white', opacity: 0.9, marginTop: '10px' }}>Student Academy</h2>
                        <p className="brand-subtitle">
                            Tailored Learning & Legal Resources<br />
                            Empowering the Next Generation of Legal Minds
                        </p>
                    </div>
                </div>

                <div className="right-panel">
                    {view === 'login' && (
                        <div id="loginSection">
                            <div className="login-header">
                                <h2 className="login-title">Student Portal</h2>
                                <p className="login-subtitle">Access your personalized learning dashboard</p>
                            </div>

                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

                            <form onSubmit={handleLoginSubmit}>
                                <div className="form-group">
                                    <div className="input-icon">📧</div>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Student Email"
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
                                    {loading ? 'Logging in...' : 'Enter Academy'}
                                </button>
                            </form>
                            <div className="signup-link">
                                Don't have a student account? <a onClick={() => setView('register')}>Register Here</a>
                            </div>
                            <div className="divider"><span>OR</span></div>
                            <div style={{ textAlign: 'center' }}>
                                <Link to="/" className="back-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>← Back home</Link>
                            </div>
                        </div>
                    )}

                    {view === 'register' && (
                        <div id="registerSection">
                            <div className="login-header">
                                <h2 className="login-title">Join the Academy</h2>
                                <p className="login-subtitle">Register to access law resources and quizzes</p>
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
                                        placeholder="Email Address"
                                        required
                                        value={registerData.email}
                                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">🎓</div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="University / College"
                                        required
                                        value={registerData.university}
                                        onChange={(e) => setRegisterData({ ...registerData, university: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="input-icon">📅</div>
                                    <select
                                        className="form-input"
                                        required
                                        style={{ paddingLeft: '55px' }}
                                        value={registerData.yearOfStudy}
                                        onChange={(e) => setRegisterData({ ...registerData, yearOfStudy: e.target.value })}
                                    >
                                        <option value="">Year of Study</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                        <option value="5th Year">5th Year</option>
                                        <option value="LLM">LLM</option>
                                        <option value="Other">Other</option>
                                    </select>
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
                                        <label htmlFor="terms" className="checkbox-label">I agree to the Academy terms</label>
                                    </div>
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? 'Joining...' : 'Register as Student'}
                                </button>
                            </form>
                            <div className="signup-link">
                                Already in the Academy? <a onClick={() => setView('login')}>Back to Login</a>
                            </div>
                        </div>
                    )}

                    {/* Forgot, Verify, Reset sections can be similar to LawyerPortalPage but with student role in API calls */}
                    {view === 'forgot' && (
                        <div id="forgotSection">
                            <div className="login-header">
                                <h2 className="login-title">Reset Password</h2>
                                <p className="login-subtitle">Enter your student email</p>
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
                                <p className="login-subtitle">Enter code sent to {loginData.email}</p>
                            </div>
                            {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}
                            <form onSubmit={handleVerifyOTP}>
                                <div className="form-group">
                                    <div className="input-icon">🔢</div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Reset Code"
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
                                <p className="login-subtitle">Create your new password</p>
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
                                    {loading ? 'Updating...' : 'Set New Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentPortalPage;

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LandingPage = () => {
    const router = useRouter();

    const handlePortalSelect = (portal) => {
        if (portal === 'lawyer') {
            router.push('/lawyer-portal');
        } else if (portal === 'client') {
            router.push('/client-portal');
        } else if (portal === 'student') {
            router.push('/student-portal');
        }
    };

    return (
        <main>
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Smarter Legal Solutions <br /><span className="text-accent">For Modern Practices</span></h1>
                    <p>Empowering lawyers and clients with advanced AI-driven tools, secure document management, and seamless communication.</p>
                    <div className="hero-cta">
                        <Link href="/#portals" className="cta-button">Explore Portals</Link>
                        <Link href="/#features" className="btn-secondary">Learn More</Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features">
                <h2 className="section-title">Why Choose Lawwise?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #6ba3d0, #5a8fc4)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                            </svg>
                        </div>
                        <h3>Case Management</h3>
                        <p>Streamline your workflow with our intuitive case management system. Track deadlines, manage documents, and collaborate efficiently.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #8bb8dc, #6ba3d0)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        </div>
                        <h3>Secure & Compliant</h3>
                        <p>Bank-level encryption and compliance with legal industry standards ensure your data is always protected.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #b8ddc0, #99d4a8)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                            </svg>
                        </div>
                        <h3>Collaboration Tools</h3>
                        <p>Real-time communication between lawyers and clients. Share updates, documents, and messages instantly.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #f7d794, #f5c77e)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                            </svg>
                        </div>
                        <h3>Analytics & Insights</h3>
                        <p>Make data-driven decisions with comprehensive analytics and reporting tools for your legal practice.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #7eaed6, #6ba3d0)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                            </svg>
                        </div>
                        <h3>Document Automation</h3>
                        <p>Generate legal documents quickly with our smart templates and automated workflows.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #9bc4e2, #7eaed6)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                            </svg>
                        </div>
                        <h3>24/7 Support</h3>
                        <p>Our dedicated support team is always available to help you with any questions or issues.</p>
                    </div>
                </div>
            </section>

            {/* Portals Section */}
            <section className="portals" id="portals">
                <h2 className="section-title">Choose Your Portal</h2>
                <div className="portal-grid">
                    <div className="portal-card" onClick={() => handlePortalSelect('lawyer')}>
                        <div className="portal-icon" style={{ background: 'linear-gradient(135deg, #6ba3d0, #5a8fc4)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" />
                            </svg>
                        </div>
                        <h3>Lawyer Portal</h3>
                        <p>Access case management, client communications, and legal research tools</p>
                        <button className="portal-button">Enter Portal</button>
                    </div>

                    <div className="portal-card" onClick={() => handlePortalSelect('client')}>
                        <div className="portal-icon" style={{ background: 'linear-gradient(135deg, #8bb8dc, #6ba3d0)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6H12L10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" />
                            </svg>
                        </div>
                        <h3>Client Portal</h3>
                        <p>Track your cases, communicate with your lawyer, and manage documents</p>
                        <button className="portal-button">Enter Portal</button>
                    </div>

                    <div className="portal-card" onClick={() => handlePortalSelect('student')}>
                        <div className="portal-icon" style={{ background: 'linear-gradient(135deg, #b8ddc0, #99d4a8)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
                            </svg>
                        </div>
                        <h3>Student Portal</h3>
                        <p>Access educational resources, legal databases, and learning materials</p>
                        <button className="portal-button">Enter Portal</button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats" id="about">
                <div className="stats-grid">
                    <div className="stat-item">
                        <h4>10,000+</h4>
                        <p>Active Users</p>
                    </div>
                    <div className="stat-item">
                        <h4>50,000+</h4>
                        <p>Cases Managed</p>
                    </div>
                    <div className="stat-item">
                        <h4>99.9%</h4>
                        <p>Uptime</p>
                    </div>
                    <div className="stat-item">
                        <h4>24/7</h4>
                        <p>Support Available</p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default LandingPage;

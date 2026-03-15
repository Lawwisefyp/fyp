import React from 'react';

const Footer = () => {
    return (
        <footer id="contact" className="site-footer">
            <div className="footer-content">
                <div className="footer-section brand">
                    <h4 className="logo">LAW<span className="text-accent">WISE</span></h4>
                    <p>Elevating legal practice through innovation and accessibility. Professional tools for the modern legal industry.</p>
                </div>
                <div className="footer-section">
                    <h4>Resources</h4>
                    <a href="#features">Key Features</a>
                    <a href="#portals">Service Portals</a>
                    <a href="/search-lawyers">Legal Directory</a>
                </div>
                <div className="footer-section">
                    <h4>Firm</h4>
                    <a href="/about">About Lawwise</a>
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/terms">Terms of Service</a>
                </div>
                <div className="footer-section">
                    <h4>Get In Touch</h4>
                    <p>Email: <span className="text-dim">support@lawwise.com</span></p>
                    <p>Phone: <span className="text-dim">+1 (800) LAW-WISE</span></p>
                    <div className="social-links">
                        {/* Icons can be added here */}
                        <p>Follow us on LinkedIn</p>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Lawwise. Precision in Practice.</p>
            </div>
        </footer>
    );
};

export default Footer;

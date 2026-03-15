import Link from 'next/link';

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
                    <Link href="/#features">Key Features</Link>
                    <Link href="/#portals">Service Portals</Link>
                    <Link href="/search-lawyers">Legal Directory</Link>
                </div>
                <div className="footer-section">
                    <h4>Firm</h4>
                    <Link href="/about">About Lawwise</Link>
                    <Link href="/privacy">Privacy Policy</Link>
                    <Link href="/terms">Terms of Service</Link>
                </div>
                <div className="footer-section">
                    <h4>Get In Touch</h4>
                    <p>Email: <span className="text-dim">support@lawwise.com</span></p>
                    <p>Phone: <span className="text-dim">+1 (800) LAW-WISE</span></p>
                    <div className="social-links">
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

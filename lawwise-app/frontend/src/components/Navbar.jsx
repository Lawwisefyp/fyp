import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span>LAW</span><span className="text-accent">WISE</span>
        </Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/search-lawyers">Find Lawyers</Link></li>
          <li><Link to="/lawyer-portal">Lawyer Portal</Link></li>
          <li><Link to="/client-portal">Client Portal</Link></li>
          <li><Link to="/chatbot" className="btn-accent-nav">Legal AI</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

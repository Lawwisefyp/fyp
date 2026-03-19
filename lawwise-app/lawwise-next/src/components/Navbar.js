import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo">
          <span>LAW</span><span className="text-accent">WISE</span>
        </Link>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/search-lawyers">Find Lawyers</Link></li>
          <li><Link href="/lawyer-portal">Lawyer Portal</Link></li>
          <li><Link href="/client-portal">Client Portal</Link></li>
          <li><Link href="/chatbot">Legal AI</Link></li>
          <li><Link href="/ai-drafting" className="btn-accent-nav">AI Drafting</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

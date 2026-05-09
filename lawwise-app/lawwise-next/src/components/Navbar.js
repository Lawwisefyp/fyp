'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  
  // Define routes where the navbar should be hidden (dashboards, tool routes, and internal portal content)
  // We EXCLUDE the main login portals (/client-portal, /lawyer-portal, /student-portal) so the landing header shows there.
  const isInternalRoute = (
    pathname.startsWith('/lawyer-') || 
    pathname.startsWith('/client-') || 
    pathname.startsWith('/student-') ||
    pathname.startsWith('/search-lawyers') ||
    pathname.startsWith('/lawyer-marketplace') ||
    pathname.startsWith('/lawyer-public-profile') ||
    pathname.startsWith('/my-clients') ||
    pathname.startsWith('/my-calendar') ||
    pathname.startsWith('/case-history') ||
    pathname.startsWith('/communication') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/ai-drafting') ||
    pathname.startsWith('/chatbot') ||
    pathname.startsWith('/digital-guidance') ||
    pathname.startsWith('/law-library') ||
    pathname.startsWith('/networking') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/lawyer-reviews')
  ) && !['/client-portal', '/lawyer-portal', '/student-portal'].includes(pathname);

  if (isInternalRoute) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo">
          <span>LAW</span><span className="text-accent">WISE</span>
        </Link>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/#features">Features</Link></li>
          <li><Link href="/#portals">Portals</Link></li>
          <li><Link href="/#about">About Us</Link></li>
          <li><Link href="/#contact">Contact Us</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

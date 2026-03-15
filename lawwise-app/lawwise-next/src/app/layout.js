import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Lawwise - Legal Services & AI Drafting',
  description: 'A comprehensive legal platform for lawyers, clients, and students.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="page-container">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

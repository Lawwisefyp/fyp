'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Please wait while we verify your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || !type) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}&type=${type}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! You can now log in.');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push(type === 'lawyer' ? '/lawyer-portal' : '/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('A server error occurred. Please try again later.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2.5rem', 
        borderRadius: '1rem', 
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#1e293b', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Email Verification</h1>
        
        {status === 'verifying' && (
          <div style={{ color: '#64748b' }}>
            <p>{message}</p>
            <div style={{ marginTop: '1rem' }} className="animate-pulse">Loading...</div>
          </div>
        )}

        {status === 'success' && (
          <div style={{ color: '#10b981' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <p>{message}</p>
            <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Redirecting to login portal...</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ color: '#ef4444' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <p>{message}</p>
            <Link href="/" style={{ 
              marginTop: '1.5rem', 
              display: 'inline-block',
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Return to Homepage
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

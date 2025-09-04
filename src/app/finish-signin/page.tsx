'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function FinishSignIn() {
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your link...');
  const [error, setError] = useState('');

  useEffect(() => {
    const finishSigningIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email to complete sign-in.');
        }

        if (!email) {
          setError('Could not get email. Please try signing in again.');
          return;
        }

        try {
          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          setMessage('Sign-in successful! Redirecting you to the dashboard...');
          router.push('/dashboard');
        } catch (err) {
          console.error(err);
          setError('Failed to sign in. The link may be invalid or expired.');
        }
      } else {
        setError('This page is only for completing the sign-in process.');
      }
    };

    finishSigningIn();
  }, [router]);

  return (
    <div className="max-w-md mx-auto mt-10 text-center">
      <h1 className="text-2xl font-bold mb-4">Finishing Sign-In</h1>
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
} 
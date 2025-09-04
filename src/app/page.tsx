'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import SignInForm from '@/components/auth/SignInForm';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // If the user is authenticated, show nothing while redirecting.
  // A loading spinner could also be shown here.
  if (user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <SignInForm />
    </main>
  );
}

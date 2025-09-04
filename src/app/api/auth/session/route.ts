import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

// This endpoint will receive an ID token from the client,
// verify it, and set an httpOnly cookie for the session.
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    // Set cookie expiration to 14 days
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ message: 'Failed to create session.' }, { status: 401 });
  }
}

// This endpoint will delete the session cookie on user logout.
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ status: 'success' });
} 
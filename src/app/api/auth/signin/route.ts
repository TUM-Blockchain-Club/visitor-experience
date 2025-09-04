import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/client'; // Import client auth
import { sendSignInLinkToEmail } from 'firebase/auth'; // Import the function to send the link
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = signInSchema.parse(body);

    const actionCodeSettings = {
      // URL to which the user will be redirected after signing in.
      // We will add parameters to complete the authentication process.
      url: `${new URL(request.url).origin}/finish-signin`,
      handleCodeInApp: true,
    };

    // Generate and send the sign-in link
    // This uses the CLIENT SDK, but on the server.
    // This is a legitimate and documented method when you don't have your own mail server.
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // Temporary storage of the email is necessary to associate it with the user
    // when they return from the link. This is usually done in localStorage or a cookie.
    // We will return the email to the client so it can be saved.
    // TODO: It would be more reliable to set a cookie on the server.

    return NextResponse.json({
      message: 'A sign-in link has been sent to your email.',
      emailForVerification: email, // Return email to be saved on the client
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error('Error sending sign-in link:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 
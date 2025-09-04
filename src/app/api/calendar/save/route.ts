import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const saveSchema = z.object({
  selectedEventIds: z.array(z.string()).min(1, { message: 'At least one event must be selected.' }),
});

export async function POST(request: Request) {
  try {
    // 1. Check user authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ message: 'Invalid session.' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // 2. Validate request body
    const body = await request.json();
    const { selectedEventIds } = saveSchema.parse(body);
    
    // 3. Save data to Firestore
    const userSelectionRef = adminDb.collection('user_selections').doc(userId);
    const userSelectionDoc = await userSelectionRef.get();

    const calendarId = userSelectionDoc.exists ? userSelectionDoc.data()?.calendarId : uuidv4();

    await userSelectionRef.set({
      userId,
      selectedEventIds,
      calendarId,
    }, { merge: true });

    return NextResponse.json({ message: 'Calendar saved successfully!', calendarId });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error('Error saving calendar:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
} 
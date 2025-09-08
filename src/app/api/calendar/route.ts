import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase/admin';

// Schemas
const createSchema = z.object({
  selectedEventIds: z.array(z.string()).default([]),
});

const updateSchema = z.object({
  calendarId: z.string().min(1),
  selectedEventIds: z.array(z.string()).default([]),
});

// GET /api/calendar
// Returns the current user's calendar document if it exists (uses ownerUserId index)
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    const userId = session.user.id;

    const snapshot = await adminDb
      .collection('user_selections')
      .where('ownerUserId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ calendar: null });
    }

    const doc = snapshot.docs[0];
    return NextResponse.json({
      calendar: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/calendar
// Creates a new calendar for the current user if none exists yet; otherwise returns existing
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { selectedEventIds } = createSchema.parse(body);

    // Check if calendar already exists
    const existing = await adminDb
      .collection('user_selections')
      .where('ownerUserId', '==', userId)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      return NextResponse.json({
        message: 'Calendar already exists.',
        calendar: { id: doc.id, ...doc.data() },
      }, { status: 200 });
    }

    const calendarId = uuidv4();
    const ref = adminDb.collection('user_selections').doc(calendarId);
    await ref.set({
      calendarId,
      ownerUserId: userId,
      selectedEventIds,
    });

    return NextResponse.json({
      message: 'Calendar created.',
      calendar: { id: calendarId, calendarId, ownerUserId: userId, selectedEventIds },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error('Error creating calendar:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

// PUT /api/calendar
// Updates an existing calendar owned by current user
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { calendarId, selectedEventIds } = updateSchema.parse(body);

    const docRef = adminDb.collection('user_selections').doc(calendarId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Calendar not found.' }, { status: 404 });
    }
    const data = docSnap.data();
    if (data?.ownerUserId !== userId) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    await docRef.update({ selectedEventIds });
    return NextResponse.json({ message: 'Calendar updated.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error('Error updating calendar:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE /api/calendar?calendarId=...
// Deletes a calendar owned by current user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId');
    if (!calendarId) {
      return NextResponse.json({ message: 'calendarId is required' }, { status: 400 });
    }

    const docRef = adminDb.collection('user_selections').doc(calendarId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Calendar not found.' }, { status: 404 });
    }
    const data = docSnap.data();
    if (data?.ownerUserId !== userId) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ message: 'Calendar deleted.' });
  } catch (error) {
    console.error('Error deleting calendar:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}



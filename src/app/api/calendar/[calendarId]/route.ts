import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as ics from 'ics';
import fs from 'node:fs';
import path from 'node:path';
import { Session } from '@/lib/model/session';

type Params = Promise<{ calendarId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { calendarId } = await params;

    const docSnap = await adminDb.collection('user_selections').doc(calendarId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Calendar not found.' }, { status: 404 });
    }

    const userSelection = docSnap.data()!;
    const selectedEventIds = userSelection.selectedEventIds as string[];

    // Load sessions from the cache written at build/dev time
    const sessionsPath = path.join(process.cwd(), 'public', 'sessions.json');
    let allSessions: Session[] = [];
    try {
      const raw = await fs.promises.readFile(sessionsPath, 'utf8');
      allSessions = JSON.parse(raw) as Session[];
    } catch {
      allSessions = [];
    }

    const idSet = new Set<string>(selectedEventIds);
    const selectedEvents = allSessions.filter(ev => idSet.has(ev.documentId));

    const icsEvents = selectedEvents.map(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      
      const startArray: ics.DateArray = [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()];
      const endArray: ics.DateArray = [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()];

      return {
        title: event.title,
        description: event.description || '',
        start: startArray,
        end: endArray,
        calName: 'My Conference Calendar',
      };
    });

    if (icsEvents.length === 0) {
      // Return an empty but valid calendar
      return new Response('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR', {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="calendar.ics"`,
        },
      });
    }

    const { error, value } = ics.createEvents(icsEvents);

    if (error) {
      throw error;
    }

    return new Response(value, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="calendar.ics"`,
      },
    });

  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
} 
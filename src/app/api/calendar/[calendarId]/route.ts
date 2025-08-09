import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { MOCK_EVENTS } from '@/lib/mockEvents'; 
import * as ics from 'ics';

export async function GET(
  request: Request,
  { params }: { params: { calendarId: string } }
) {
  try {
    const calendarId = params.calendarId;

    const querySnapshot = await adminDb.collection('user_selections')
      .where('calendarId', '==', calendarId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json({ message: 'Календарь не найден.' }, { status: 404 });
    }

    const userSelection = querySnapshot.docs[0].data();
    const selectedEventIds = userSelection.selectedEventIds as string[];

    const selectedEvents = MOCK_EVENTS.filter(event => selectedEventIds.includes(event.id));

    const icsEvents = selectedEvents.map(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      
      const startArray: ics.DateArray = [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()];
      const endArray: ics.DateArray = [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()];

      return {
        title: event.title,
        description: event.description,
        start: startArray,
        end: endArray,
        calName: 'Мой Календарь Конференции',
      };
    });

    if (icsEvents.length === 0) {
      // Возвращаем пустой, но валидный календарь
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
    console.error('Ошибка при генерации календаря:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера.' }, { status: 500 });
  }
} 
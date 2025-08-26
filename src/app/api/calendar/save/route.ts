import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const saveSchema = z.object({
  selectedEventIds: z.array(z.string()).min(1, { message: 'Нужно выбрать хотя бы одно событие.' }),
});

export async function POST(request: Request) {
  try {
    // 1. Проверяем аутентификацию пользователя
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Не авторизован.' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ message: 'Невалидная сессия.' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // 2. Валидируем тело запроса
    const body = await request.json();
    const { selectedEventIds } = saveSchema.parse(body);
    
    // 3. Сохраняем данные в Firestore
    const userSelectionRef = adminDb.collection('user_selections').doc(userId);
    const userSelectionDoc = await userSelectionRef.get();

    const calendarId = userSelectionDoc.exists ? userSelectionDoc.data()?.calendarId : uuidv4();

    await userSelectionRef.set({
      userId,
      selectedEventIds,
      calendarId,
    }, { merge: true });

    return NextResponse.json({ message: 'Календарь успешно сохранен!', calendarId });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error('Ошибка при сохранении календаря:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера.' }, { status: 500 });
  }
} 
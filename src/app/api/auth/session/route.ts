import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

// Этот эндпоинт будет принимать ID токен от клиента,
// проверять его и устанавливать httpOnly cookie для сессии.
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    // Устанавливаем срок действия cookie - 14 дней
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });

    cookies().set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Ошибка создания сессии:', error);
    return NextResponse.json({ message: 'Не удалось создать сессию.' }, { status: 401 });
  }
}

// Этот эндпоинт будет удалять cookie сессии при выходе пользователя.
export async function DELETE() {
  cookies().delete('session');
  return NextResponse.json({ status: 'success' });
} 
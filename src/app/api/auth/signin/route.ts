import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { auth } from '@/lib/firebase/client'; // Импортируем клиентский auth
import { sendSignInLinkToEmail } from 'firebase/auth'; // Импортируем функцию для отправки ссылки
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email({ message: 'Неверный формат email' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = signInSchema.parse(body);

    const actionCodeSettings = {
      // URL, на который пользователь будет перенаправлен после входа.
      // Мы добавим параметры, чтобы завершить процесс аутентификации.
      url: `${new URL(request.url).origin}/finish-signin`,
      handleCodeInApp: true,
    };

    // Генерируем и отправляем ссылку для входа
    // Для этого используется КЛИЕНТСКИЙ SDK, но на сервере.
    // Это легальный и документированный способ, когда нет своего почтового сервера.
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // Временное сохранение email необходимо, чтобы связать его с пользователем
    // когда он вернется по ссылке. Обычно это делают в localStorage или cookie.
    // Мы вернем email клиенту, чтобы он его сохранил.
    // TODO: Более надежно было бы установить cookie на сервере.

    return NextResponse.json({
      message: 'Ссылка для входа была отправлена на вашу почту.',
      emailForVerification: email, // Возвращаем email для сохранения на клиенте
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error('Ошибка при отправке ссылки для входа:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 
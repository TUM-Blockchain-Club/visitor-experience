'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function FinishSignIn() {
  const router = useRouter();
  const [message, setMessage] = useState('Проверяем вашу ссылку...');
  const [error, setError] = useState('');

  useEffect(() => {
    const finishSigningIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Пожалуйста, введите ваш email для завершения входа.');
        }

        if (!email) {
          setError('Не удалось получить email. Попробуйте войти снова.');
          return;
        }

        try {
          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          setMessage('Вход выполнен успешно! Перенаправляем вас на дашборд...');
          router.push('/dashboard');
        } catch (err) {
          console.error(err);
          setError('Не удалось войти. Ссылка может быть недействительной или просроченной.');
        }
      } else {
        setError('Эта страница предназначена только для завершения процесса входа.');
      }
    };

    finishSigningIn();
  }, [router]);

  return (
    <div className="max-w-md mx-auto mt-10 text-center">
      <h1 className="text-2xl font-bold mb-4">Завершение входа</h1>
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
} 
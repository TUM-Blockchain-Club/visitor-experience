'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { MOCK_EVENTS, ConferenceEvent } from '@/lib/mockEvents';

function EventCard({ event, onToggle, isSelected }: { event: ConferenceEvent; onToggle: (eventId: string) => void; isSelected: boolean; }) {
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`p-4 border rounded-lg ${isSelected ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </p>
          <p className="text-gray-800 mt-2">{event.description}</p>
        </div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(event.id)}
          className="ml-4 h-6 w-6"
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleToggleEvent = (eventId: string) => {
    setCalendarUrl(null); // Сбрасываем ссылку при изменении выбора
    setSelectedEvents(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(eventId)) {
        newSelection.delete(eventId);
      } else {
        newSelection.add(eventId);
      }
      return newSelection;
    });
  };
  
  const handleSaveCalendar = async () => {
    setLoading(true);
    setError('');
    setCalendarUrl(null);

    try {
      const res = await fetch('/api/calendar/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedEventIds: Array.from(selectedEvents) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Не удалось сохранить календарь.');

      // Формируем новую, правильную ссылку
      const url = `${window.location.origin}/api/calendar/${data.calendarId}`;
      setCalendarUrl(url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Программа конференции</h1>
          <p className="text-gray-600">Вошли как: {user.email}</p>
        </div>
        <div>
          <button
            onClick={handleSaveCalendar}
            disabled={loading || selectedEvents.size === 0}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-4 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Получить ссылку на календарь'}
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Выйти
          </button>
        </div>
      </header>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md my-4">{error}</p>}

      {calendarUrl && (
        <div className="my-4 p-4 bg-blue-100 border border-blue-300 rounded-md">
          <h3 className="font-bold">Ваша персональная ссылка на календарь:</h3>
          <p className="text-sm text-gray-700">Скопируйте эту ссылку и добавьте ее в ваше календарное приложение (Google Calendar, Apple Calendar и т.д.)</p>
          <input
            type="text"
            readOnly
            value={calendarUrl}
            className="mt-2 w-full p-2 border rounded-md bg-gray-50"
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}

      <div className="space-y-4">
        {MOCK_EVENTS.map(event => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={selectedEvents.has(event.id)}
            onToggle={handleToggleEvent}
          />
        ))}
      </div>
    </div>
  );
} 
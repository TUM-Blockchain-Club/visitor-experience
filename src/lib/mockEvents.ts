export interface ConferenceEvent {
  id: string;
  title: string;
  startTime: string; // В формате ISO
  endTime: string;   // В формате ISO
  description: string;
}

export const MOCK_EVENTS: ConferenceEvent[] = [
  {
    id: 'evt-001',
    title: 'Регистрация и утренний кофе',
    startTime: '2025-08-14T09:00:00Z',
    endTime: '2025-08-14T10:00:00Z',
    description: 'Начните день с нами, получите свой бейдж и насладитесь чашечкой кофе.',
  },
  {
    id: 'evt-002',
    title: 'Открытие конференции: Будущее Веб-разработки',
    startTime: '2025-08-14T10:00:00Z',
    endTime: '2025-08-14T11:00:00Z',
    description: 'Ключевой доклад от основателя Vercel о трендах в Next.js и не только.',
  },
  {
    id: 'evt-003',
    title: 'Глубокое погружение в React Server Components',
    startTime: '2025-08-14T11:30:00Z',
    endTime: '2025-08-14T12:30:00Z',
    description: 'Технический доклад о том, как работают и когда стоит использовать RSC.',
  },
  {
    id: 'evt-004',
    title: 'Состояние CSS в 2024 году',
    startTime: '2025-08-14T11:30:00Z',
    endTime: '2025-08-14T12:30:00Z',
    description: 'Параллельный доклад о новых возможностях CSS, которые вы можете использовать уже сегодня.',
  },
  {
    id: 'evt-005',
    title: 'Обед и нетворкинг',
    startTime: '2025-08-14T12:30:00Z',
    endTime: '2025-08-14T14:00:00Z',
    description: 'Время подкрепиться и пообщаться с коллегами и спикерами.',
  },
  {
    id: 'evt-006',
    title: 'Мастер-класс: Создание безопасного API с помощью GraphQL',
    startTime: '2025-08-14T14:00:00Z',
    endTime: '2025-08-14T16:00:00Z',
    description: 'Практический воркшоп по созданию и защите вашего API.',
  },
  {
    id: 'evt-007',
    title: 'Закрытие конференции и афтепати',
    startTime: '2025-08-14T16:30:00Z',
    endTime: '2025-08-14T18:00:00Z',
    description: 'Подведение итогов и неформальное общение.',
  },
]; 
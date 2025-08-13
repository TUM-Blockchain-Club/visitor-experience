export interface ConferenceEvent {
  id: string;
  title: string;
  startTime: string; // ISO format
  endTime: string;   // ISO format
  description: string;
}

export const MOCK_EVENTS: ConferenceEvent[] = [
  {
    id: 'evt-001',
    title: 'Registration and Morning Coffee',
    startTime: '2025-08-14T09:00:00Z',
    endTime: '2025-08-14T10:00:00Z',
    description: 'Start your day with us, get your badge and enjoy a cup of coffee.',
  },
  {
    id: 'evt-002',
    title: 'Conference Opening: The Future of Web Development',
    startTime: '2025-08-14T10:00:00Z',
    endTime: '2025-08-14T11:00:00Z',
    description: 'Keynote from the founder of Vercel on trends in Next.js and beyond.',
  },
  {
    id: 'evt-003',
    title: 'Deep Dive into React Server Components',
    startTime: '2025-08-14T11:30:00Z',
    endTime: '2025-08-14T12:30:00Z',
    description: 'A technical talk on how RSC works and when to use it.',
  },
  {
    id: 'evt-004',
    title: 'The State of CSS in 2024',
    startTime: '2025-08-14T11:30:00Z',
    endTime: '2025-08-14T12:30:00Z',
    description: 'A parallel talk on new CSS features you can use today.',
  },
  {
    id: 'evt-005',
    title: 'Lunch and Networking',
    startTime: '2025-08-14T12:30:00Z',
    endTime: '2025-08-14T14:00:00Z',
    description: 'Time to refuel and chat with colleagues and speakers.',
  },
  {
    id: 'evt-006',
    title: 'Workshop: Building a Secure API with GraphQL',
    startTime: '2025-08-14T14:00:00Z',
    endTime: '2025-08-14T16:00:00Z',
    description: 'A hands-on workshop on creating and securing your API.',
  },
  {
    id: 'evt-007',
    title: 'Conference Closing & Afterparty',
    startTime: '2025-08-14T16:30:00Z',
    endTime: '2025-08-14T18:00:00Z',
    description: 'Wrap-up and informal networking.',
  },
]; 
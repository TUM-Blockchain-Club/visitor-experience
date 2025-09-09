import 'dotenv/config';
import { refreshStrapiCache } from '@/lib/service/strapi';

async function main(): Promise<void> {
  try {
    const summary = await refreshStrapiCache();
    // eslint-disable-next-line no-console
    console.log(`Refreshed cache: ${summary.sessionsCount} sessions, ${summary.speakersCount} speakers`);
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to refresh cache:', err);
    process.exit(1);
  }
}

void main();



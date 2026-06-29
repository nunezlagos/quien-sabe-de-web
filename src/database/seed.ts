import { getDb } from './client';

export const seed = async () => {
  const db = getDb();
  console.log('Seeding database...');
  console.log('Seeding complete.');
  return { message: 'Database initialized (empty)' };
};

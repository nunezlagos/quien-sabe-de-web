import { drizzle } from 'drizzle-orm/d1';
import { users, trades } from './schema';

export const seed = async (dbBinding: any) => {
  const db = drizzle(dbBinding);
  
  console.log('Seeding database...');

  console.log('Seeding complete.');
  return { message: "Database initialized (empty)" };
};

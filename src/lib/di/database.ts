import { getDb } from '../../database/client';
import type { Database } from './types';

export function createDatabase(_context?: unknown): Database {
  return getDb() as unknown as Database;
}

export type { Database };
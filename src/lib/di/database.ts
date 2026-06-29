import { getDb } from '../../database/client';
import { d1 } from '../db/compat';
import type { Database } from './types';

export function createDatabase(_context?: unknown): Database {
  const db = getDb();
  return d1(db) as Database;
}

export type { Database };

import { createDb, type Db } from '@bcip/db';

let _db: Db | null = null;

/** Lazy Drizzle client for server components and actions. */
export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required');
    }
    _db = createDb(url);
  }
  return _db;
}

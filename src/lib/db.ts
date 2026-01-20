
import { Pool } from 'pg';

let pool: Pool;

// This function ensures the pool is created only when it's first needed.
const getPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      // This will now only throw an error at runtime if the variable is missing,
      // not during the build process.
      throw new Error('DATABASE_URL is not set in the environment variables');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
};

// The query function now uses the lazy-loaded pool.
export const query = (text: string, params?: any[]) => {
    const dbPool = getPool();
    return dbPool.query(text, params);
};

import "server-only";
import { db, hasDatabase } from "@/lib/articles/db";

// Every server instance on Vercel has its own memory, so the "use cache"
// wrappers alone let each one call the providers again: on a busy day that
// used up Live-score's daily quota and tripped football-data's limit of 10
// requests a minute, and every page then showed "data unavailable". The
// answers are therefore kept in Postgres, shared by all instances:
// - a fresh copy is returned without calling the provider;
// - a stale copy is refreshed by one instance at a time, at most once a minute;
// - when the provider fails, the last good copy is returned instead.
// Without a database, the provider is called directly as before.

const RETRY_SECONDS = 60;

type Row<T> = { data: T | null; fetched_at: Date | null };

export async function stored<T>(key: string, maxAgeMs: (data: T) => number, fetcher: () => Promise<T>): Promise<T> {
  if (!hasDatabase()) return fetcher();
  let sql;
  let row: Row<T> | undefined;
  try {
    sql = await db();
    [row] = await sql<Row<T>[]>`select data, fetched_at from football_cache where key = ${key}`;
  } catch (err) {
    // The database is down: fall back to the provider.
    console.error(err);
    return fetcher();
  }
  const cached = row?.data ?? null;
  if (cached !== null && row?.fetched_at && Date.now() - row.fetched_at.getTime() < maxAgeMs(cached)) return cached;

  // Claims the refresh: only succeeds if nobody tried in the last minute.
  const claimed = await sql`
    insert into football_cache (key, attempted_at) values (${key}, now())
    on conflict (key) do update set attempted_at = now()
      where football_cache.attempted_at is null
         or football_cache.attempted_at < now() - make_interval(secs => ${RETRY_SECONDS})
    returning key`;
  if (claimed.length === 0) {
    if (cached !== null) return cached;
    throw new Error(`football ${key}: refresh already tried less than ${RETRY_SECONDS}s ago`);
  }

  try {
    const data = await fetcher();
    await sql`update football_cache set data = ${sql.json(data as never)}, fetched_at = now() where key = ${key}`;
    return data;
  } catch (err) {
    if (cached === null) throw err;
    console.error(err);
    return cached;
  }
}

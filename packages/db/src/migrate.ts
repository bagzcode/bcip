import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://bcip:change-me@localhost:5433/bcip';

async function main() {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.join(dirname, '..', 'drizzle');
  await migrate(db, { migrationsFolder });
  await client.end();
  console.log('Migrations applied.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

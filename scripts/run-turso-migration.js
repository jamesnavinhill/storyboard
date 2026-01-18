#!/usr/bin/env node
// Run Turso migration script
// Usage: npx tsx scripts/run-turso-migration.js

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables');
  console.error('Get these from your Vercel project settings -> Environment Variables');
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrationPath = join(process.cwd(), 'server', 'migrations', 'turso', '001_complete_schema.sql');
const sql = readFileSync(migrationPath, 'utf-8');

// Split by semicolons but handle edge cases
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Running ${statements.length} statements...`);

async function runMigration() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.execute(stmt);
      console.log(`✓ Statement ${i + 1}/${statements.length}`);
    } catch (err) {
      console.error(`✗ Statement ${i + 1} failed:`, stmt.substring(0, 80) + '...');
      console.error('  Error:', err.message);
    }
  }
  console.log('Migration complete!');
}

runMigration().catch(console.error);

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

console.log("🔧 Loading db.ts module...");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("🔧 Creating database pool...");
console.log("🔧 DATABASE_URL format:", process.env.DATABASE_URL?.substring(0, 20) + "...");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log("🔧 Creating drizzle instance...");
export const db = drizzle({ client: pool, schema });
console.log("🔧 Database setup complete");

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

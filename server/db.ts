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
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  max: 10
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

// Test the connection immediately
(async () => {
  try {
    console.log('🔧 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    
    // Test if users table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('🔧 Users table exists:', result.rows[0].exists);
    client.release();
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('❌ Full error:', error);
  }
})();
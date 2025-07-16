const { Pool } = require('pg');
require('dotenv/config');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    return;
  }
  
  // Mask the password in the URL for logging
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log('🔗 Connecting to:', maskedUrl);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000, // 10 second timeout
    idleTimeoutMillis: 5000,
    max: 1
  });
  
  try {
    console.log('⏳ Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    console.log('🔍 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    console.log('🔍 Checking if users table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log('📋 Users table exists:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Database schema not initialized - tables are missing');
    }
    
    client.release();
    await pool.end();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('🔍 DNS resolution failed - check hostname in DATABASE_URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Connection refused - check if database server is running');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🔍 Connection timeout - check network connectivity');
    } else if (error.code === '28P01') {
      console.error('🔍 Authentication failed - check username/password');
    } else if (error.code === '3D000') {
      console.error('🔍 Database does not exist - check database name');
    }
    
    await pool.end();
  }
}

testDatabaseConnection().catch(console.error);
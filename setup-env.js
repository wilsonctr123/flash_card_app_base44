const fs = require('fs');
const crypto = require('crypto');

console.log('🔧 Setting up environment file...');

// Check if .env already exists
if (fs.existsSync('.env')) {
  console.log('⚠️  .env file already exists. Please update it manually with your DATABASE_URL.');
  console.log('📋 Example format:');
  console.log('DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"');
  process.exit(0);
}

// Generate a random session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');

// Create .env file with template
const envContent = `# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Session Secret
SESSION_SECRET="${sessionSecret}"

# Development Environment
NODE_ENV=development

# Optional: Custom port (defaults to 3001 in dev, 5000 in prod)
# PORT=3001
`;

fs.writeFileSync('.env', envContent);

console.log('✅ Created .env file with session secret');
console.log('🔧 Please update the DATABASE_URL in .env with your actual database connection string');
console.log('');
console.log('📋 Quick setup options:');
console.log('1. Neon (free): https://neon.tech');
console.log('2. Supabase (free): https://supabase.com');
console.log('3. Local PostgreSQL');
console.log('');
console.log('After setting DATABASE_URL, run: npm run db:push');
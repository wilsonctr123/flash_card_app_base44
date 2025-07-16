# Database Setup Guide

## Option 1: Neon Database (Recommended - Free PostgreSQL)

1. **Create a Neon Account**
   - Go to https://neon.tech
   - Sign up for a free account
   - Create a new project

2. **Get Your Connection String**
   - In your Neon dashboard, go to "Connection Details"
   - Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

3. **Add to Environment**
   - Create a `.env` file in your project root
   - Add your DATABASE_URL:
   ```
   DATABASE_URL="your-neon-connection-string-here"
   ```

## Option 2: Supabase Database (Also Free PostgreSQL)

1. **Create a Supabase Account**
   - Go to https://supabase.com
   - Sign up and create a new project

2. **Get Your Connection String**
   - Go to Settings > Database
   - Copy the "Connection string" under "Connection pooling"
   - It looks like:
   ```
   postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

3. **Add to Environment**
   ```
   DATABASE_URL="your-supabase-connection-string-here"
   ```

## Option 3: Local PostgreSQL (For Development)

1. **Install PostgreSQL locally**
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt install postgresql postgresql-contrib`
   - Windows: Download from postgresql.org

2. **Start PostgreSQL**
   - macOS: `brew services start postgresql`
   - Ubuntu: `sudo systemctl start postgresql`

3. **Create Database**
   ```bash
   createdb memoryace_dev
   ```

4. **Set Environment**
   ```
   DATABASE_URL="postgresql://localhost:5432/memoryace_dev"
   ```

## Next Steps (After Setting Up Database)

1. **Test the connection**
2. **Initialize the database schema**
3. **Start the development server**
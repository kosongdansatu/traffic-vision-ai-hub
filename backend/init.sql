-- Initialize Traffic Vision AI Database

-- Create database if not exists (this is handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS traffic_vision;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin user (will be created by the application)
-- This file is mainly for future database initialization scripts

-- You can add any additional database setup here
-- For example, indexes, triggers, or initial data

-- Example: Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
-- CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
-- CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

-- Example: Create a function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: Tables will be created automatically by SQLAlchemy
-- This file is for additional database setup only

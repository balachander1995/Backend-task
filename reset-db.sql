-- Terminate all connections to backendtask database
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'backendtask'
  AND pid <> pg_backend_pid();

-- Drop the database
DROP DATABASE IF EXISTS backendtask;

-- Create a fresh database
CREATE DATABASE backendtask;

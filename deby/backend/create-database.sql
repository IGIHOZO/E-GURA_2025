-- Create the database for DEBY E-Commerce
CREATE DATABASE deby_ecommerce;

-- Connect to the database
\c deby_ecommerce;

-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Success message
SELECT 'Database deby_ecommerce created successfully!' AS status;

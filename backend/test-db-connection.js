const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'deby_ecommerce',
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        logging: console.log
    }
);

async function testConnection() {
    try {
        console.log('Testing PostgreSQL connection...');
        console.log(`Database: ${process.env.POSTGRES_DB}`);
        console.log(`User: ${process.env.POSTGRES_USER}`);
        console.log(`Host: ${process.env.POSTGRES_HOST}`);
        console.log(`Port: ${process.env.POSTGRES_PORT}`);

        await sequelize.authenticate();
        console.log('✅ Connection successful!');

        // Try to create database if it doesn't exist
        await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.POSTGRES_DB};`);
        console.log('✅ Database ready!');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testConnection();

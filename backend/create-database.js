const { Client } = require('pg');
require('dotenv').config();

const createDatabase = async () => {
    // Connect to the default 'postgres' database first
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '123',
        database: 'postgres' // Connect to default database
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Check if database exists
        const checkDb = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            ['deby_ecommerce']
        );

        if (checkDb.rows.length > 0) {
            console.log('✅ Database "deby_ecommerce" already exists');
        } else {
            // Create the database
            await client.query('CREATE DATABASE deby_ecommerce');
            console.log('✅ Database "deby_ecommerce" created successfully');
        }

        await client.end();
        console.log('✅ All done! Backend should now be able to connect.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
};

createDatabase();

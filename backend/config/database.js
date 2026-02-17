const { Sequelize } = require('sequelize');
require('dotenv').config();

let reconnectInterval = null;
let isReconnecting = false;

// PostgreSQL connection with auto-reconnect
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'deby_ecommerce',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'postgres',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    // Enhanced connection pool settings
    pool: {
      max: 20,              // Maximum connections
      min: 2,               // Minimum connections (keep 2 alive)
      acquire: 60000,       // Maximum time (ms) to get connection
      idle: 10000,          // Time before idle connection released
      evict: 10000,         // Time to run eviction
      handleDisconnects: true // Handle disconnects automatically
    },

    // Retry configuration
    retry: {
      max: 5,               // Maximum retry attempts
      timeout: 3000,        // Timeout between retries
      match: [              // Retry on these errors
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /EHOSTUNREACH/
      ]
    },

    // Connection options
    dialectOptions: {
      connectTimeout: 60000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    },

    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false
    },

    // Benchmark queries in development
    benchmark: process.env.NODE_ENV === 'development'
  }
);

// Test connection with retry
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ PostgreSQL connection established successfully');
      if (isReconnecting) {
        console.log('🔄 Database reconnected successfully!');
        isReconnecting = false;
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
      }
      return true;
    } catch (error) {
      console.error(`❌ Connection attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${(i + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
      }
    }
  }
  return false;
};

// Auto-reconnect function
const autoReconnect = async () => {
  if (isReconnecting) return;

  isReconnecting = true;
  console.log('🔄 Database connection lost. Attempting to reconnect...');

  const connected = await testConnection(5);

  if (!connected) {
    console.log('⏳ Will retry connection every 10 seconds...');
    if (!reconnectInterval) {
      reconnectInterval = setInterval(async () => {
        console.log('🔄 Retrying database connection...');
        const success = await testConnection(1);
        if (success && reconnectInterval) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
      }, 10000);
    }
  }
};

// Handle connection errors
sequelize.beforeConnect((config) => {
  // console.log('🔌 Attempting database connection...');
});

sequelize.afterConnect((connection, config) => {
  // console.log('✅ Connection established');
});

// Monitor connection health (heartbeat every 30 seconds)
let heartbeatInterval = null;

const startHeartbeat = () => {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(async () => {
    try {
      await sequelize.query('SELECT 1');
      // console.log('💓 Database heartbeat: OK');
    } catch (error) {
      console.error('💔 Database heartbeat failed:', error.message);
      autoReconnect();
    }
  }, 30000); // Every 30 seconds
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
};

// Global error handler for database
process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.name && reason.name.includes('Sequelize')) {
    console.error('🔴 Unhandled database error:', reason.message);
    autoReconnect();
  }
});

module.exports = {
  sequelize,
  testConnection,
  autoReconnect,
  startHeartbeat,
  stopHeartbeat
};

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profile: DataTypes.JSONB,
  addresses: DataTypes.JSONB,
  paymentMethods: DataTypes.JSONB,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationToken: DataTypes.STRING,
  verificationExpires: DataTypes.DATE,
  resetPasswordToken: DataTypes.STRING,
  resetPasswordExpires: DataTypes.DATE,
  preferences: DataTypes.JSONB,
  lastLogin: DataTypes.DATE,
  loginCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  socialLogin: DataTypes.JSONB,
  role: {
    type: DataTypes.ENUM('customer', 'admin', 'moderator', 'storekeeper'),
    defaultValue: 'customer'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['phone'] }
  ]
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  // Only hash password if it was actually changed
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const ensureStorekeeperRole = async () => {
  const query = `
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_type t
        WHERE t.typname = 'enum_Users_role'
      ) THEN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'enum_Users_role'
          AND e.enumlabel = 'storekeeper'
        ) THEN
          ALTER TYPE "enum_Users_role" ADD VALUE 'storekeeper';
        END IF;
      END IF;
    END$$;
  `;

  try {
    await sequelize.query(query);
  } catch (error) {
    console.error('Failed to ensure storekeeper role enum:', error.message);
  }
};

setImmediate(() => {
  ensureStorekeeperRole();
});

module.exports = User;

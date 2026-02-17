const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MomoCode = sequelize.define('MomoCode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Display name for the MOMO code (e.g., "Uwase Store Account")'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^250\d{9}$/,
      len: [12, 12]
    },
    comment: 'MOMO phone number in format 250XXXXXXXXX'
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Account holder name'
  },
  description: {
    type: DataTypes.TEXT,
    comment: 'Optional description for the MOMO account'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this MOMO code is active and should be displayed'
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is the primary/default MOMO account'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Order in which to display this MOMO code'
  },
  network: {
    type: DataTypes.ENUM('MTN', 'AIRTEL'),
    defaultValue: 'MTN',
    comment: 'Mobile network provider'
  },
  qrCode: {
    type: DataTypes.TEXT,
    comment: 'Base64 encoded QR code image for easy payment'
  },
  instructions: {
    type: DataTypes.TEXT,
    comment: 'Special instructions for customers using this MOMO code'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['isActive']
    },
    {
      fields: ['isPrimary']
    },
    {
      fields: ['displayOrder']
    },
    {
      unique: true,
      fields: ['phoneNumber'],
      where: {
        isActive: true
      }
    }
  ]
});

// Hook to ensure only one primary MOMO code exists
MomoCode.beforeSave(async (momoCode) => {
  if (momoCode.isPrimary) {
    // Set all other codes to non-primary
    await MomoCode.update(
      { isPrimary: false },
      { 
        where: { 
          id: { [require('sequelize').Op.ne]: momoCode.id },
          isPrimary: true 
        } 
      }
    );
  }
});

module.exports = MomoCode;

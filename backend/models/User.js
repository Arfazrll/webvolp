const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'phone_number'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  displayName: {
    type: DataTypes.STRING(100),
    field: 'display_name'
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'busy'),
    defaultValue: 'offline'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Hook to hash password before save
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Define associations
User.associate = (models) => {
  User.hasMany(models.Token, { foreignKey: 'user_id', as: 'tokens' });
  User.hasOne(models.SipAccount, { foreignKey: 'user_id', as: 'sipAccount' });
  User.hasMany(models.CallHistory, { foreignKey: 'caller_id', as: 'outgoingCalls' });
  User.hasMany(models.CallHistory, { foreignKey: 'callee_id', as: 'incomingCalls' });
  User.hasMany(models.Contact, { foreignKey: 'user_id', as: 'contacts' });
  User.hasMany(models.Contact, { foreignKey: 'contact_user_id', as: 'contactOf' });
  User.hasMany(models.WebRTCSession, { foreignKey: 'user_id', as: 'webRtcSessions' });
  User.hasMany(models.ActiveCall, { foreignKey: 'caller_id', as: 'activeOutgoingCalls' });
  User.hasMany(models.ActiveCall, { foreignKey: 'callee_id', as: 'activeIncomingCalls' });
};

module.exports = User;
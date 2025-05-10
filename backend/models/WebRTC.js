const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WebRTCSession = sequelize.define('WebRTCSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  callId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'call_id'
  },
  sdpOffer: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'sdp_offer'
  },
  sdpAnswer: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'sdp_answer'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'failed', 'closed'),
    defaultValue: 'pending'
  },
  lastUpdate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'last_update',
    defaultValue: DataTypes.NOW
  },
  iceCandidates: {
    type: DataTypes.JSON,
    field: 'ice_candidates',
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'webrtc_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define SIP account model for Kamailio integration
const SipAccount = sequelize.define('SipAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  domain: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ha1: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'MD5(username:domain:password)'
  },
  ha1b: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'MD5(username@domain:domain:password)'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sip_accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define additional models for Kamailio
const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  contactUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'contact_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  favorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'contacts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = { WebRTCSession, SipAccount, Contact };
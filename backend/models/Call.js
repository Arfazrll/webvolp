const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CallHistory = sequelize.define('CallHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  callerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'caller_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  calleeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'callee_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('audio', 'video'),
    defaultValue: 'audio'
  },
  direction: {
    type: DataTypes.ENUM('incoming', 'outgoing'),
    allowNull: false
  },
  result: {
    type: DataTypes.ENUM('completed', 'missed', 'rejected'),
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_time'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Duration in seconds'
  },
  callSid: {
    type: DataTypes.STRING(100),
    field: 'call_sid',
    comment: 'Call session ID from SIP server'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata about the call (quality, network, etc)'
  }
}, {
  tableName: 'call_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define active calls model
const ActiveCall = sequelize.define('ActiveCall', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  callerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'caller_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  calleeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'callee_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('audio', 'video'),
    defaultValue: 'audio'
  },
  status: {
    type: DataTypes.ENUM('calling', 'ringing', 'active', 'ended'),
    defaultValue: 'calling'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time'
  },
  answerTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'answer_time'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_time'
  },
  endReason: {
    type: DataTypes.ENUM('completed', 'missed', 'rejected', 'failed'),
    allowNull: true,
    field: 'end_reason'
  },
  callSid: {
    type: DataTypes.STRING(100),
    field: 'call_sid',
    comment: 'Call session ID from SIP server'
  }
}, {
  tableName: 'active_calls',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = { CallHistory, ActiveCall };
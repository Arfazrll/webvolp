const { sequelize } = require('../config/database');
const User = require('./User');
const Token = require('./Token');
const { CallHistory, ActiveCall } = require('./Call');
const { WebRTCSession, SipAccount, Contact } = require('./WebRTC');

// Hubungkan asosiasi model
const setupAssociations = () => {
  // User associations
  User.hasMany(Token, { foreignKey: 'user_id', as: 'tokens' });
  User.hasOne(SipAccount, { foreignKey: 'user_id', as: 'sipAccount' });
  User.hasMany(CallHistory, { foreignKey: 'caller_id', as: 'outgoingCalls' });
  User.hasMany(CallHistory, { foreignKey: 'callee_id', as: 'incomingCalls' });
  User.hasMany(ActiveCall, { foreignKey: 'caller_id', as: 'activeOutgoingCalls' });
  User.hasMany(ActiveCall, { foreignKey: 'callee_id', as: 'activeIncomingCalls' });
  User.hasMany(WebRTCSession, { foreignKey: 'user_id', as: 'webRtcSessions' });
  User.hasMany(Contact, { foreignKey: 'user_id', as: 'contacts' });
  User.hasMany(Contact, { foreignKey: 'contact_user_id', as: 'contactOf' });

  // Token associations
  Token.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // CallHistory associations
  CallHistory.belongsTo(User, { foreignKey: 'caller_id', as: 'caller' });
  CallHistory.belongsTo(User, { foreignKey: 'callee_id', as: 'callee' });

  // ActiveCall associations
  ActiveCall.belongsTo(User, { foreignKey: 'caller_id', as: 'caller' });
  ActiveCall.belongsTo(User, { foreignKey: 'callee_id', as: 'callee' });

  // WebRTCSession associations
  WebRTCSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // SipAccount associations
  SipAccount.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Contact associations
  Contact.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Contact.belongsTo(User, { foreignKey: 'contact_user_id', as: 'contact' });
};

// Panggil setup asosiasi
setupAssociations();

module.exports = {
  sequelize,
  User,
  Token,
  CallHistory,
  ActiveCall,
  WebRTCSession,
  SipAccount,
  Contact
};
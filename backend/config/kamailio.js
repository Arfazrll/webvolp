require('dotenv').config();

const kamailioConfig = {
  domain: process.env.KAMAILIO_DOMAIN || 'voip-server.example.com',
  wsPort: process.env.KAMAILIO_WS_PORT || '8088',
  wsProtocol: process.env.KAMAILIO_WS_PROTOCOL || 'wss',
  adminUser: process.env.KAMAILIO_ADMIN_USER || 'admin',
  adminPass: process.env.KAMAILIO_ADMIN_PASS || 'admin_password',
  
  // Build WebSocket URI
  getWsUri: function() {
    return `${this.wsProtocol}://${this.domain}:${this.wsPort}/ws`;
  },
  
  // Build SIP URI for user
  getSipUri: function(username) {
    return `sip:${username}@${this.domain}`;
  },
  
  // Build WebRTC configuration for frontend
  getWebRtcConfig: function() {
    const stunServers = (process.env.STUN_SERVERS || '')
      .split(',')
      .filter(Boolean)
      .map(url => ({ urls: url }));
    
    const turnServer = process.env.TURN_SERVER;
    const turnUsername = process.env.TURN_USERNAME;
    const turnCredential = process.env.TURN_CREDENTIAL;
    
    const iceServers = [...stunServers];
    
    if (turnServer && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnServer,
        username: turnUsername,
        credential: turnCredential
      });
    }
    
    return {
      domain: this.domain,
      wsUri: this.getWsUri(),
      iceServers
    };
  }
};

module.exports = kamailioConfig;
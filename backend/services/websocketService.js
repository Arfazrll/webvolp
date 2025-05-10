const { logger } = require('../middleware/logger');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class WebsocketService {
  constructor() {
    this.io = null;
    this.userSocketMap = new Map(); // Mapping dari userId ke socketId
  }

  init(io) {
    this.io = io;
    this.setupSocketEvents();
    console.log('WebSocket service initialized');
  }

  setupSocketEvents() {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    this.io.use(async (socket, next) => {
      try {
        // Check for auth token
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication error'));
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded) {
          return next(new Error('Invalid token'));
        }
        
        // Add user data to socket
        socket.user = {
          id: decoded.id,
          phoneNumber: decoded.phoneNumber
        };
        
        next();
      } catch (error) {
        console.error(`Socket authentication error: ${error.message}`);
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      // Map userId to socketId
      const userId = socket.user?.id;
      if (userId) {
        this.userSocketMap.set(userId, socket.id);
        
        // Join user's room
        socket.join(`user:${userId}`);
        
        // Notify user status change
        this.emitUserStatus(userId, 'online');
      }
      
      // Handle incoming call event
      socket.on('initiateCall', (data) => {
        this.handleInitiateCall(socket, data);
      });
      
      // Handle call answer event
      socket.on('answerCall', (data) => {
        this.handleAnswerCall(socket, data);
      });
      
      // Handle call reject event
      socket.on('rejectCall', (data) => {
        this.handleRejectCall(socket, data);
      });
      
      // Handle call end event
      socket.on('endCall', (data) => {
        this.handleEndCall(socket, data);
      });
      
      // Handle WebRTC signaling
      socket.on('webrtcSignal', (data) => {
        this.handleWebRTCSignal(socket, data);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        if (userId) {
          // Remove from mapping
          this.userSocketMap.delete(userId);
          
          // Notify user status change
          this.emitUserStatus(userId, 'offline');
        }
      });
    });
    
    // Handle SIP events
    this.setupSipEventListener();
  }

  // Listen for SIP events
  setupSipEventListener() {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }
    
    // Create nsp for SIP events
    const sipNsp = this.io.of('/sip');
    
    sipNsp.on('connection', (socket) => {
      console.log(`SIP event listener connected: ${socket.id}`);
      
      socket.on('sipEvent', (event) => {
        this.handleSipEvent(event);
      });
      
      socket.on('disconnect', () => {
        console.log(`SIP event listener disconnected: ${socket.id}`);
      });
    });
  }

  // Handle SIP events
  handleSipEvent(event) {
    try {
      console.log(`Received SIP event: ${event.event}`);
      
      switch (event.event) {
        case 'incomingCall':
          this.handleIncomingCall(event.data);
          break;
        
        case 'callProgress':
          this.handleCallProgress(event.data);
          break;
        
        case 'callAnswered':
          this.handleCallAnswered(event.data);
          break;
        
        case 'callRejected':
          this.handleCallRejected(event.data);
          break;
        
        case 'callEnded':
          this.handleCallEnded(event.data);
          break;
        
        default:
          console.warn(`Unknown SIP event: ${event.event}`);
      }
    } catch (error) {
      console.error(`Error handling SIP event: ${error.message}`);
    }
  }

  // Implementation stubs for event handlers
  handleIncomingCall(data) {
    console.log('Handling incoming call', data);
    // Implementation would be filled in for a real system
  }

  handleCallProgress(data) {
    console.log('Handling call progress', data);
    // Implementation would be filled in for a real system
  }

  handleCallAnswered(data) {
    console.log('Handling call answered', data);
    // Implementation would be filled in for a real system
  }

  handleCallRejected(data) {
    console.log('Handling call rejected', data);
    // Implementation would be filled in for a real system
  }

  handleCallEnded(data) {
    console.log('Handling call ended', data);
    // Implementation would be filled in for a real system
  }

  handleInitiateCall(socket, data) {
    console.log('Handling initiate call', data);
    // Implementation would be filled in for a real system
  }

  handleAnswerCall(socket, data) {
    console.log('Handling answer call', data);
    // Implementation would be filled in for a real system
  }

  handleRejectCall(socket, data) {
    console.log('Handling reject call', data);
    // Implementation would be filled in for a real system
  }

  handleEndCall(socket, data) {
    console.log('Handling end call', data);
    // Implementation would be filled in for a real system
  }

  handleWebRTCSignal(socket, data) {
    console.log('Handling WebRTC signal', data);
    // Implementation would be filled in for a real system
  }

  emitUserStatus(userId, status) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }
    
    this.io.emit('userStatus', {
      userId,
      status
    });
    
    console.log(`Emitted status update for user ${userId}: ${status}`);
  }
}

module.exports = new WebsocketService();
const { logger } = require('../middleware/logger');
const { v4: uuidv4 } = require('uuid');
const io = require('socket.io-client');
const kamailioConfig = require('../config/kamailio');
require('dotenv').config();

class SipService {
  constructor() {
    this.domain = process.env.KAMAILIO_DOMAIN;
    this.wsPort = process.env.KAMAILIO_WS_PORT;
    this.wsProtocol = process.env.KAMAILIO_WS_PROTOCOL;
    this.callRegistry = new Map(); // Menyimpan informasi panggilan aktif
    
    // Connect to WebSocket service for event listener
    this.socketClient = io(`http://localhost:${process.env.PORT || 3001}`);
    this.setupSocketConnection();
  }

  setupSocketConnection() {
    this.socketClient.on('connect', () => {
      logger.info('SIP Service connected to WebSocket service');
    });

    this.socketClient.on('disconnect', () => {
      logger.warn('SIP Service disconnected from WebSocket service');
    });

    this.socketClient.on('error', (error) => {
      logger.error('SIP Service WebSocket error:', error);
    });
  }

  // Memulai panggilan baru
  async initiateCall({ caller, callee, callType }) {
    try {
      logger.info(`Initiating ${callType} call from ${caller} to ${callee}`);
      
      // Generate call SID
      const callSid = uuidv4();
      
      // Simpan informasi panggilan
      this.callRegistry.set(callSid, {
        caller,
        callee,
        callType,
        status: 'calling',
        startTime: new Date()
      });
      
      // Dalam kasus nyata, di sini kita akan membuat request ke Kamailio
      // untuk membuat panggilan baru. Karena ini simulasi, kita akan
      // menggunakan Socket.IO untuk notifikasi ke penerima
      
      // Kirim notifikasi ke penerima panggilan melalui WebSocket
      this.socketClient.emit('sipEvent', {
        event: 'incomingCall',
        data: {
          callSid,
          caller,
          callee,
          callType
        }
      });
      
      // Simulasi delay untuk setup panggilan
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update status panggilan
      this.callRegistry.set(callSid, {
        ...this.callRegistry.get(callSid),
        status: 'ringing'
      });
      
      // Kirim notifikasi pemanggil melalui WebSocket
      this.socketClient.emit('sipEvent', {
        event: 'callProgress',
        data: {
          callSid,
          status: 'ringing'
        }
      });
      
      return {
        callSid,
        status: 'ringing'
      };
    } catch (error) {
      logger.error(`Error initiating call: ${error.message}`);
      throw new Error('Gagal memulai panggilan');
    }
  }

  // Menjawab panggilan masuk
  async answerCall(callSid) {
    try {
      logger.info(`Answering call with SID: ${callSid}`);
      
      // Cek apakah panggilan ada
      const callInfo = this.callRegistry.get(callSid);
      if (!callInfo) {
        throw new Error('Panggilan tidak ditemukan');
      }
      
      // Update status panggilan
      this.callRegistry.set(callSid, {
        ...callInfo,
        status: 'active',
        answerTime: new Date()
      });
      
      // Kirim notifikasi melalui WebSocket
      this.socketClient.emit('sipEvent', {
        event: 'callAnswered',
        data: {
          callSid,
          caller: callInfo.caller,
          callee: callInfo.callee
        }
      });
      
      return {
        callSid,
        status: 'active'
      };
    } catch (error) {
      logger.error(`Error answering call: ${error.message}`);
      throw new Error('Gagal menjawab panggilan');
    }
  }

  // Menolak panggilan masuk
  async rejectCall(callSid) {
    try {
      logger.info(`Rejecting call with SID: ${callSid}`);
      
      // Cek apakah panggilan ada
      const callInfo = this.callRegistry.get(callSid);
      if (!callInfo) {
        throw new Error('Panggilan tidak ditemukan');
      }
      
      // Update status panggilan
      this.callRegistry.set(callSid, {
        ...callInfo,
        status: 'rejected',
        endTime: new Date(),
        endReason: 'rejected'
      });
      
      // Kirim notifikasi melalui WebSocket
      this.socketClient.emit('sipEvent', {
        event: 'callRejected',
        data: {
          callSid,
          caller: callInfo.caller,
          callee: callInfo.callee
        }
      });
      
      // Hapus dari registry setelah beberapa detik
      setTimeout(() => {
        this.callRegistry.delete(callSid);
      }, 5000);
      
      return {
        callSid,
        status: 'rejected'
      };
    } catch (error) {
      logger.error(`Error rejecting call: ${error.message}`);
      throw new Error('Gagal menolak panggilan');
    }
  }

  // Mengakhiri panggilan
  async endCall(callSid) {
    try {
      logger.info(`Ending call with SID: ${callSid}`);
      
      // Cek apakah panggilan ada
      const callInfo = this.callRegistry.get(callSid);
      if (!callInfo) {
        throw new Error('Panggilan tidak ditemukan');
      }
      
      // Update status panggilan
      this.callRegistry.set(callSid, {
        ...callInfo,
        status: 'ended',
        endTime: new Date(),
        endReason: 'completed'
      });
      
      // Hitung durasi jika telah dijawab
      let duration = 0;
      if (callInfo.answerTime) {
        duration = Math.floor((new Date() - callInfo.answerTime) / 1000);
      }
      
      // Kirim notifikasi melalui WebSocket
      this.socketClient.emit('sipEvent', {
        event: 'callEnded',
        data: {
          callSid,
          caller: callInfo.caller,
          callee: callInfo.callee,
          duration
        }
      });
      
      // Hapus dari registry setelah beberapa detik
      setTimeout(() => {
        this.callRegistry.delete(callSid);
      }, 5000);
      
      return {
        callSid,
        status: 'ended',
        duration
      };
    } catch (error) {
      logger.error(`Error ending call: ${error.message}`);
      throw new Error('Gagal mengakhiri panggilan');
    }
  }

  // Mendapatkan status panggilan
  getCallStatus(callSid) {
    try {
      logger.info(`Getting call status for SID: ${callSid}`);
      
      const callInfo = this.callRegistry.get(callSid);
      if (!callInfo) {
        return { found: false };
      }
      
      // Hitung durasi jika telah dijawab
      let duration = 0;
      if (callInfo.answerTime && callInfo.status === 'active') {
        duration = Math.floor((new Date() - callInfo.answerTime) / 1000);
      }
      
      return {
        found: true,
        status: callInfo.status,
        caller: callInfo.caller,
        callee: callInfo.callee,
        callType: callInfo.callType,
        startTime: callInfo.startTime,
        answerTime: callInfo.answerTime,
        endTime: callInfo.endTime,
        duration
      };
    } catch (error) {
      logger.error(`Error getting call status: ${error.message}`);
      throw new Error('Gagal mendapatkan status panggilan');
    }
  }
}

module.exports = new SipService();
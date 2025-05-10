const { logger } = require('../middleware/logger');
require('dotenv').config();

class WebRTCService {
  constructor() {
    this.sessions = new Map(); // Menyimpan informasi sesi WebRTC aktif
  }

  // Generate SDP Answer dari SDP Offer
  async generateSdpAnswer(sdpOffer) {
    try {
      logger.info('Generating SDP Answer');
      
      // Dalam implementasi nyata, kita akan menggunakan WebRTC server
      // untuk membuat SDP Answer. Karena ini simulasi, kita akan
      // mengembalikan SDP Answer placeholder
      
      // Buat SDP Answer placeholder
      // Di dunia nyata, ini akan dihasilkan oleh WebRTC server
      const sdpAnswer = `v=0
o=- ${Date.now()} 1 IN IP4 0.0.0.0
s=-
t=0 0
a=group:BUNDLE audio video
a=msid-semantic: WMS
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${this._randomString(8)}
a=ice-pwd:${this._randomString(24)}
a=fingerprint:sha-256 ${this._randomFingerprint()}
a=setup:active
a=mid:audio
a=sendrecv
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${this._randomString(8)}
a=ice-pwd:${this._randomString(24)}
a=fingerprint:sha-256 ${this._randomFingerprint()}
a=setup:active
a=mid:video
a=sendrecv
a=rtcp-mux
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtcp-fb:96 ccm fir`;
      
      return sdpAnswer;
    } catch (error) {
      logger.error(`Error generating SDP Answer: ${error.message}`);
      throw new Error('Gagal menghasilkan SDP Answer');
    }
  }

  // Tambahkan ICE Candidate
  async addIceCandidate(sessionId, candidate) {
    try {
      logger.info(`Adding ICE candidate for session ${sessionId}`);
      
      // Dalam implementasi nyata, kita akan meneruskan ICE candidate
      // ke WebRTC server. Karena ini simulasi, kita hanya akan
      // menyimpannya di sesi lokal
      
      // Cek apakah sesi ada
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, {
          iceCandidates: []
        });
      }
      
      // Tambahkan kandidat ke sesi
      const session = this.sessions.get(sessionId);
      session.iceCandidates.push(candidate);
      this.sessions.set(sessionId, session);
      
      logger.debug(`ICE candidate added to session ${sessionId}, total candidates: ${session.iceCandidates.length}`);
      
      return true;
    } catch (error) {
      logger.error(`Error adding ICE candidate: ${error.message}`);
      throw new Error('Gagal menambahkan ICE Candidate');
    }
  }

  // Mengakhiri sesi WebRTC
  async endSession(sessionId) {
    try {
      logger.info(`Ending WebRTC session ${sessionId}`);
      
      // Dalam implementasi nyata, kita akan memberi tahu WebRTC server
      // untuk mengakhiri sesi. Karena ini simulasi, kita hanya akan
      // menghapus sesi dari penyimpanan lokal
      
      // Hapus sesi
      this.sessions.delete(sessionId);
      
      logger.debug(`WebRTC session ${sessionId} ended and removed from storage`);
      
      return true;
    } catch (error) {
      logger.error(`Error ending WebRTC session: ${error.message}`);
      throw new Error('Gagal mengakhiri sesi WebRTC');
    }
  }

  // Helper methods untuk menghasilkan data random
  _randomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  _randomFingerprint() {
    let fingerprint = '';
    for (let i = 0; i < 32; i++) {
      fingerprint += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      if (i < 31) fingerprint += ':';
    }
    return fingerprint;
  }
}

module.exports = new WebRTCService();
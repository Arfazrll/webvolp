const { WebRTCSession, User } = require('../models');
const webrtcService = require('../services/webrtcService');
const kamailioConfig = require('../config/kamailio');

// Mendapatkan konfigurasi WebRTC
exports.getConfig = async (req, res, next) => {
  try {
    // Ambil konfigurasi WebRTC dari config kamailio
    const webrtcConfig = kamailioConfig.getWebRtcConfig();
    
    res.status(200).json({
      success: true,
      data: webrtcConfig
    });
  } catch (error) {
    next(error);
  }
};

// Membuat sesi WebRTC baru
exports.createSession = async (req, res, next) => {
  try {
    const { callId, sdpOffer, type } = req.body;
    const userId = req.user.id;
    
    // Validasi masukan
    if (!callId || !sdpOffer || !['offer', 'answer'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'callId, sdpOffer, dan type diperlukan'
      });
    }
    
    // Cek apakah sesi sudah ada
    let session = await WebRTCSession.findOne({
      where: { callId, userId }
    });
    
    // Jika sudah ada, update
    if (session) {
      session.sdpOffer = sdpOffer;
      session.lastUpdate = new Date();
      await session.save();
    } else {
      // Jika belum ada, buat baru
      session = await WebRTCSession.create({
        callId,
        userId,
        sdpOffer,
        sdpAnswer: null,
        status: 'pending',
        lastUpdate: new Date()
      });
    }
    
    // Generate SDP Answer menggunakan service
    const sdpAnswer = await webrtcService.generateSdpAnswer(sdpOffer);
    
    // Update session dengan SDP Answer
    session.sdpAnswer = sdpAnswer;
    session.status = 'active';
    await session.save();
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        sdpAnswer,
        iceServers: kamailioConfig.getWebRtcConfig().iceServers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Menambahkan ICE Candidate
exports.addIceCandidate = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { candidate } = req.body;
    const userId = req.user.id;
    
    // Validasi masukan
    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'ICE Candidate diperlukan'
      });
    }
    
    // Cek apakah sesi ada
    const session = await WebRTCSession.findOne({
      where: { id: sessionId, userId }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesi WebRTC tidak ditemukan'
      });
    }
    
    // Proses ICE Candidate dengan service
    await webrtcService.addIceCandidate(sessionId, candidate);
    
    res.status(200).json({
      success: true,
      message: 'ICE Candidate berhasil ditambahkan'
    });
  } catch (error) {
    next(error);
  }
};

// Mengakhiri sesi WebRTC
exports.endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Cek apakah sesi ada
    const session = await WebRTCSession.findOne({
      where: { id: sessionId, userId }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesi WebRTC tidak ditemukan'
      });
    }
    
    // Update status sesi
    session.status = 'closed';
    await session.save();
    
    // Akhiri sesi di service
    await webrtcService.endSession(sessionId);
    
    res.status(200).json({
      success: true,
      message: 'Sesi WebRTC berhasil diakhiri'
    });
  } catch (error) {
    next(error);
  }
};

// Mendapatkan status sesi WebRTC
exports.getSessionStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Cek apakah sesi ada
    const session = await WebRTCSession.findOne({
      where: { id: sessionId, userId }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesi WebRTC tidak ditemukan'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        callId: session.callId,
        status: session.status,
        lastUpdate: session.lastUpdate
      }
    });
  } catch (error) {
    next(error);
  }
};
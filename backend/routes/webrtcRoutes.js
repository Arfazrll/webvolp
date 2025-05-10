const express = require('express');
const router = express.Router();
const webrtcController = require('../controllers/webrtcController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

// Validasi input
const validateCreateSession = [
  body('callId')
    .notEmpty().withMessage('Call ID diperlukan'),
  body('sdpOffer')
    .isString()
    .notEmpty().withMessage('SDP Offer diperlukan'),
  body('type')
    .isIn(['offer', 'answer']).withMessage('Type harus berupa offer atau answer')
];

const validateIceCandidate = [
  body('candidate')
    .isObject().withMessage('Candidate harus berupa objek')
];

// Route mendapatkan konfigurasi WebRTC
router.get('/config', auth, webrtcController.getConfig);

// Route membuat sesi WebRTC
router.post('/sessions', auth, validateCreateSession, webrtcController.createSession);

// Route menambahkan ICE Candidate
router.post('/sessions/:sessionId/ice-candidates', auth, validateIceCandidate, webrtcController.addIceCandidate);

// Route mengakhiri sesi WebRTC
router.post('/sessions/:sessionId/end', auth, webrtcController.endSession);

// Route mendapatkan status sesi WebRTC
router.get('/sessions/:sessionId', auth, webrtcController.getSessionStatus);

module.exports = router;
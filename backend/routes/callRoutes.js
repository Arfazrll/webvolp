const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const auth = require('../middleware/auth');
const { body, param } = require('express-validator');

// Validasi input
const validateCall = [
  body('phoneNumber')
    .isString()
    .notEmpty().withMessage('Nomor telepon diperlukan'),
  body('callType')
    .isIn(['audio', 'video']).withMessage('Jenis panggilan harus audio atau video')
];

// Route mulai panggilan baru
router.post('/', auth, validateCall, callController.initiateCall);

// Route menjawab panggilan
router.post('/:callId/answer', auth, callController.answerCall);

// Route menolak panggilan
router.post('/:callId/reject', auth, callController.rejectCall);

// Route mengakhiri panggilan
router.post('/:callId/end', auth, callController.endCall);

// Route mendapatkan riwayat panggilan
router.get('/history', auth, callController.getCallHistory);

// Route mendapatkan status panggilan aktif
router.get('/active', auth, callController.getActiveCall);

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

// Validasi input
const validateRegister = [
  body('phoneNumber')
    .isString()
    .notEmpty().withMessage('Nomor telepon diperlukan')
    .matches(/^\+?[0-9]{8,15}$/).withMessage('Format nomor telepon tidak valid'),
  body('password')
    .isString()
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
];

const validateLogin = [
  body('phoneNumber')
    .isString()
    .notEmpty().withMessage('Nomor telepon diperlukan'),
  body('password')
    .isString()
    .notEmpty().withMessage('Password diperlukan')
];

// Route registrasi
router.post('/register', validateRegister, authController.register);

// Route login
router.post('/login', validateLogin, authController.login);

// Route logout (memerlukan autentikasi)
router.post('/logout', auth, authController.logout);

// Route mendapatkan data pengguna (memerlukan autentikasi)
router.get('/me', auth, authController.getMe);

module.exports = router;
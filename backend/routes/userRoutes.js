const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

// Validasi input
const validateProfileUpdate = [
  body('displayName')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 }).withMessage('Nama tampilan harus antara 2-100 karakter')
];

const validatePasswordChange = [
  body('currentPassword')
    .isString()
    .notEmpty().withMessage('Password saat ini diperlukan'),
  body('newPassword')
    .isString()
    .isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter')
];

const validateContactCreate = [
  body('phoneNumber')
    .isString()
    .notEmpty().withMessage('Nomor telepon diperlukan'),
  body('name')
    .optional()
    .isString()
    .isLength({ max: 100 }).withMessage('Nama maksimal 100 karakter'),
  body('favorite')
    .optional()
    .isBoolean().withMessage('Favorite harus berupa boolean')
];

// Route pencarian pengguna
router.get('/', auth, userController.getUsers);

// Route mendapatkan detail pengguna
router.get('/:id', auth, userController.getUserById);

// Route update profil
router.put('/profile', auth, validateProfileUpdate, userController.updateProfile);

// Route ganti password
router.put('/password', auth, validatePasswordChange, userController.changePassword);

// Route update status
router.put('/status', auth, userController.updateStatus);

// Route untuk kontak
router.get('/contacts', auth, userController.getContacts);
router.post('/contacts', auth, validateContactCreate, userController.addContact);
router.put('/contacts/:id', auth, userController.updateContact);
router.delete('/contacts/:id', auth, userController.deleteContact);

module.exports = router;
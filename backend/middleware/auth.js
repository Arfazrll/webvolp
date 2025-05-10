const jwt = require('jsonwebtoken');
const { verifyToken } = require('../config/jwt');
const { User } = require('../models/User');

// Middleware untuk autentikasi JWT
const auth = async (req, res, next) => {
  try {
    // Cek header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Autentikasi diperlukan.'
      });
    }
    
    // Ekstrak token
    const token = authHeader.split(' ')[1];
    
    // Verifikasi token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau kedaluwarsa.'
      });
    }
    
    // Cek apakah pengguna masih ada di database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan.'
      });
    }
    
    // Tambahkan informasi pengguna ke req
    req.user = {
      id: user.id,
      phoneNumber: user.phoneNumber
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Autentikasi gagal.'
    });
  }
};

module.exports = auth;
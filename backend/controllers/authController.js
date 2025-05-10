const { User, SipAccount } = require('../models');
const { generateToken } = require('../config/jwt');
const bcrypt = require('bcrypt');
const kamailioService = require('../services/kamailioService');

// Registrasi pengguna baru
exports.register = async (req, res, next) => {
  try {
    const { phoneNumber, password, displayName } = req.body;

    // Cek apakah pengguna sudah ada
    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nomor telepon sudah terdaftar' 
      });
    }

    // Buat user baru
    const user = await User.create({
      phoneNumber,
      password, // Password akan di-hash oleh hook pada model
      displayName: displayName || `User-${phoneNumber.slice(-4)}`,
      status: 'offline'
    });

    // Buat akun SIP di Kamailio
    const sipAccount = await kamailioService.createSipAccount(phoneNumber, password);
    
    // Simpan info akun SIP ke database
    await SipAccount.create({
      userId: user.id,
      username: phoneNumber,
      domain: process.env.KAMAILIO_DOMAIN || 'voip-server.example.com',
      ha1: sipAccount.ha1,
      ha1b: sipAccount.ha1b
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      phoneNumber: user.phoneNumber
    });

    // Kirim tanggapan
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login pengguna
exports.login = async (req, res, next) => {
  try {
    const { phoneNumber, password } = req.body;

    // Cari pengguna berdasarkan nomor telepon
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Nomor telepon atau password salah' 
      });
    }

    // Verifikasi password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Nomor telepon atau password salah' 
      });
    }

    // Update status user dan waktu login terakhir
    user.status = 'online';
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      id: user.id,
      phoneNumber: user.phoneNumber
    });

    // Ambil konfigurasi WebRTC untuk frontend
    const webrtcConfig = require('../config/kamailio').getWebRtcConfig();

    // Kirim tanggapan
    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
          status: user.status
        },
        token,
        webrtcConfig
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout pengguna
exports.logout = async (req, res, next) => {
  try {
    // Update status user menjadi offline
    const user = await User.findByPk(req.user.id);
    if (user) {
      user.status = 'offline';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    next(error);
  }
};

// Mendapatkan data pengguna yang sedang login
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'phoneNumber', 'displayName', 'status', 'lastLogin', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
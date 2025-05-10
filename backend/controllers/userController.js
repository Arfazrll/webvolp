const { User, Contact } = require('../models');
const { Op } = require('sequelize');

// Mendapatkan daftar pengguna
exports.getUsers = async (req, res, next) => {
  try {
    const { search, limit = 10, offset = 0 } = req.query;
    const currentUserId = req.user.id;

    // Buat query filter
    const whereClause = {
      id: { [Op.ne]: currentUserId } // Exclude current user
    };

    // Tambahkan filter pencarian jika ada
    if (search) {
      whereClause[Op.or] = [
        { phoneNumber: { [Op.like]: `%${search}%` } },
        { displayName: { [Op.like]: `%${search}%` } }
      ];
    }

    // Ambil data pengguna
    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'phoneNumber', 'displayName', 'status', 'lastLogin'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['lastLogin', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: users.count,
      data: users.rows
    });
  } catch (error) {
    next(error);
  }
};

// Mendapatkan detail pengguna berdasarkan ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
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

// Update profil pengguna
exports.updateProfile = async (req, res, next) => {
  try {
    const { displayName } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }

    // Update data
    if (displayName) user.displayName = displayName;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mengubah password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru diperlukan'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }

    // Verifikasi password lama
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password lama tidak sesuai'
      });
    }

    // Update password
    user.password = newPassword; // Password akan di-hash oleh hook pada model
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    next(error);
  }
};

// Mendapatkan daftar kontak pengguna
exports.getContacts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, limit = 50, offset = 0 } = req.query;

    // Buat query filter
    const whereClause = {
      userId
    };

    // Tambahkan filter pencarian jika ada
    if (search) {
      whereClause[Op.or] = [
        { '$contact.phone_number$': { [Op.like]: `%${search}%` } },
        { '$contact.display_name$': { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Query dengan join ke User untuk mendapatkan informasi kontak
    const contacts = await Contact.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'contact',
          attributes: ['id', 'phoneNumber', 'displayName', 'status']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform data untuk menyesuaikan dengan format frontend
    const formattedContacts = contacts.rows.map(contact => ({
      id: contact.id,
      userId: contact.userId,
      contactId: contact.contactUserId,
      name: contact.name || contact.contact.displayName,
      phoneNumber: contact.contact.phoneNumber,
      status: contact.contact.status,
      favorite: contact.favorite
    }));

    res.status(200).json({
      success: true,
      count: contacts.count,
      data: formattedContacts
    });
  } catch (error) {
    next(error);
  }
};

// Menambahkan kontak baru
exports.addContact = async (req, res, next) => {
  try {
    const { phoneNumber, name, favorite = false } = req.body;
    const userId = req.user.id;

    // Cari user berdasarkan nomor telepon
    const contactUser = await User.findOne({
      where: { phoneNumber }
    });

    if (!contactUser) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna dengan nomor telepon tersebut tidak ditemukan'
      });
    }

    // Cek apakah kontak sudah ada
    const existingContact = await Contact.findOne({
      where: {
        userId,
        contactUserId: contactUser.id
      }
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Kontak sudah ada dalam daftar kontak Anda'
      });
    }

    // Buat kontak baru
    const contact = await Contact.create({
      userId,
      contactUserId: contactUser.id,
      name,
      favorite
    });

    res.status(201).json({
      success: true,
      message: 'Kontak berhasil ditambahkan',
      data: {
        id: contact.id,
        userId: contact.userId,
        contactId: contact.contactUserId,
        name: contact.name,
        phoneNumber: contactUser.phoneNumber,
        status: contactUser.status,
        favorite: contact.favorite
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mengupdate kontak
exports.updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, favorite } = req.body;
    const userId = req.user.id;

    // Cari kontak
    const contact = await Contact.findOne({
      where: {
        id,
        userId
      },
      include: [
        {
          model: User,
          as: 'contact',
          attributes: ['id', 'phoneNumber', 'displayName', 'status']
        }
      ]
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Kontak tidak ditemukan'
      });
    }

    // Update data
    if (name !== undefined) contact.name = name;
    if (favorite !== undefined) contact.favorite = favorite;
    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Kontak berhasil diperbarui',
      data: {
        id: contact.id,
        userId: contact.userId,
        contactId: contact.contactUserId,
        name: contact.name,
        phoneNumber: contact.contact.phoneNumber,
        status: contact.contact.status,
        favorite: contact.favorite
      }
    });
  } catch (error) {
    next(error);
  }
};

// Menghapus kontak
exports.deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Cari kontak
    const contact = await Contact.findOne({
      where: {
        id,
        userId
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Kontak tidak ditemukan'
      });
    }

    // Hapus kontak
    await contact.destroy();

    res.status(200).json({
      success: true,
      message: 'Kontak berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

// Update status pengguna
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;

    // Validasi status
    const validStatuses = ['online', 'offline', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }

    // Update status
    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Status berhasil diperbarui',
      data: {
        id: user.id,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};
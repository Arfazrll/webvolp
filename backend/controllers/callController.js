const { CallHistory, ActiveCall, User } = require('../models');
const sipService = require('../services/sipService');
const { Op } = require('sequelize');

// Memulai panggilan baru
exports.initiateCall = async (req, res, next) => {
  try {
    const { phoneNumber, callType } = req.body;
    const callerId = req.user.id;

    // Validasi jenis panggilan
    if (!['audio', 'video'].includes(callType)) {
      return res.status(400).json({
        success: false,
        message: 'Jenis panggilan tidak valid'
      });
    }

    // Cari pengguna yang akan dipanggil berdasarkan nomor telepon
    const calleeUser = await User.findOne({ 
      where: { phoneNumber }
    });

    if (!calleeUser) {
      return res.status(404).json({
        success: false,
        message: 'Nomor telepon tujuan tidak terdaftar'
      });
    }

    // Cek apakah pengguna sedang dalam panggilan aktif
    const existingCall = await ActiveCall.findOne({
      where: {
        [Op.or]: [
          { callerId, status: { [Op.ne]: 'ended' } },
          { calleeId: callerId, status: { [Op.ne]: 'ended' } }
        ]
      }
    });

    if (existingCall) {
      return res.status(400).json({
        success: false,
        message: 'Anda sedang dalam panggilan aktif'
      });
    }

    // Buat entri panggilan aktif
    const activeCall = await ActiveCall.create({
      callerId,
      calleeId: calleeUser.id,
      type: callType,
      status: 'calling',
      startTime: new Date()
    });

    // Kirim sinyal panggilan melalui SIP server ke pengguna tujuan
    const sipResult = await sipService.initiateCall({
      caller: req.user.phoneNumber,
      callee: phoneNumber,
      callType
    });

    // Update callSid dari SIP server
    if (sipResult.callSid) {
      activeCall.callSid = sipResult.callSid;
      await activeCall.save();
    }

    // Kirim respons
    res.status(200).json({
      success: true,
      message: 'Panggilan dimulai',
      data: {
        callId: activeCall.id,
        callSid: activeCall.callSid,
        callee: {
          id: calleeUser.id,
          phoneNumber: calleeUser.phoneNumber,
          displayName: calleeUser.displayName
        },
        type: callType,
        status: 'calling',
        startTime: activeCall.startTime
      }
    });
  } catch (error) {
    next(error);
  }
};

// Menerima panggilan masuk
exports.answerCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    // Cek apakah panggilan ada dan ditujukan untuk pengguna ini
    const activeCall = await ActiveCall.findOne({
      where: {
        id: callId,
        calleeId: userId,
        status: 'ringing'
      }
    });

    if (!activeCall) {
      return res.status(404).json({
        success: false,
        message: 'Panggilan tidak ditemukan atau sudah tidak aktif'
      });
    }

    // Update status panggilan
    activeCall.status = 'active';
    activeCall.answerTime = new Date();
    await activeCall.save();

    // Beritahu SIP server bahwa panggilan telah dijawab
    await sipService.answerCall(activeCall.callSid);

    res.status(200).json({
      success: true,
      message: 'Panggilan diterima',
      data: {
        callId: activeCall.id,
        status: 'active'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Menolak panggilan masuk
exports.rejectCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    // Cek apakah panggilan ada dan ditujukan untuk pengguna ini
    const activeCall = await ActiveCall.findOne({
      where: {
        id: callId,
        calleeId: userId,
        status: 'ringing'
      }
    });

    if (!activeCall) {
      return res.status(404).json({
        success: false,
        message: 'Panggilan tidak ditemukan atau sudah tidak aktif'
      });
    }

    // Update status panggilan
    activeCall.status = 'ended';
    activeCall.endTime = new Date();
    activeCall.endReason = 'rejected';
    await activeCall.save();

    // Catat di riwayat panggilan
    await CallHistory.create({
      callerId: activeCall.callerId,
      calleeId: activeCall.calleeId,
      type: activeCall.type,
      direction: 'incoming',
      result: 'rejected',
      startTime: activeCall.startTime,
      endTime: activeCall.endTime,
      duration: 0,
      callSid: activeCall.callSid
    });

    // Beritahu SIP server bahwa panggilan telah ditolak
    await sipService.rejectCall(activeCall.callSid);

    res.status(200).json({
      success: true,
      message: 'Panggilan ditolak',
      data: {
        callId: activeCall.id,
        status: 'ended',
        endReason: 'rejected'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mengakhiri panggilan aktif
exports.endCall = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    // Cek apakah panggilan ada dan terkait dengan pengguna ini
    const activeCall = await ActiveCall.findOne({
      where: {
        id: callId,
        [Op.or]: [
          { callerId: userId },
          { calleeId: userId }
        ],
        status: {
          [Op.in]: ['calling', 'ringing', 'active']
        }
      }
    });

    if (!activeCall) {
      return res.status(404).json({
        success: false,
        message: 'Panggilan tidak ditemukan atau sudah tidak aktif'
      });
    }

    // Update status panggilan
    activeCall.status = 'ended';
    activeCall.endTime = new Date();
    activeCall.endReason = 'completed';
    await activeCall.save();

    // Hitung durasi panggilan jika panggilan pernah aktif
    let duration = 0;
    if (activeCall.status === 'active' && activeCall.answerTime) {
      duration = Math.floor((new Date() - activeCall.answerTime) / 1000);
    }

    // Catat di riwayat panggilan
    await CallHistory.create({
      callerId: activeCall.callerId,
      calleeId: activeCall.calleeId,
      type: activeCall.type,
      direction: userId === activeCall.callerId ? 'outgoing' : 'incoming',
      result: activeCall.status === 'active' ? 'completed' : 'missed',
      startTime: activeCall.startTime,
      endTime: activeCall.endTime,
      duration,
      callSid: activeCall.callSid
    });

    // Beritahu SIP server untuk mengakhiri panggilan
    await sipService.endCall(activeCall.callSid);

    res.status(200).json({
      success: true,
      message: 'Panggilan diakhiri',
      data: {
        callId: activeCall.id,
        status: 'ended',
        duration
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mendapatkan riwayat panggilan pengguna
exports.getCallHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, type, direction, result } = req.query;

    // Buat query filter
    const whereClause = {
      [Op.or]: [
        { callerId: userId },
        { calleeId: userId }
      ]
    };

    // Tambahkan filter opsional
    if (type) whereClause.type = type;
    if (result) whereClause.result = result;

    // Query dengan join ke User untuk mendapatkan informasi pengguna
    const callHistory = await CallHistory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'caller',
          attributes: ['id', 'phoneNumber', 'displayName']
        },
        {
          model: User,
          as: 'callee',
          attributes: ['id', 'phoneNumber', 'displayName']
        }
      ],
      order: [['startTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform data untuk menyesuaikan dengan format frontend
    const calls = callHistory.rows.map(call => {
      const isCaller = call.callerId === userId;
      return {
        id: call.id,
        type: call.type,
        phoneNumber: isCaller ? call.callee.phoneNumber : call.caller.phoneNumber,
        displayName: isCaller ? call.callee.displayName : call.caller.displayName,
        direction: isCaller ? 'outgoing' : 'incoming',
        result: call.result,
        startTime: call.startTime,
        endTime: call.endTime,
        duration: call.duration
      };
    });

    res.status(200).json({
      success: true,
      count: callHistory.count,
      data: calls
    });
  } catch (error) {
    next(error);
  }
};

// Mendapatkan status panggilan aktif
exports.getActiveCall = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const activeCall = await ActiveCall.findOne({
      where: {
        [Op.or]: [
          { callerId: userId },
          { calleeId: userId }
        ],
        status: {
          [Op.in]: ['calling', 'ringing', 'active']
        }
      },
      include: [
        {
          model: User,
          as: 'caller',
          attributes: ['id', 'phoneNumber', 'displayName']
        },
        {
          model: User,
          as: 'callee',
          attributes: ['id', 'phoneNumber', 'displayName']
        }
      ]
    });

    if (!activeCall) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada panggilan aktif'
      });
    }

    // Format respons berdasarkan apakah pengguna adalah pemanggil atau penerima
    const isCaller = activeCall.callerId === userId;
    const otherParty = isCaller ? activeCall.callee : activeCall.caller;

    res.status(200).json({
      success: true,
      data: {
        callId: activeCall.id,
        callSid: activeCall.callSid,
        type: activeCall.type,
        direction: isCaller ? 'outgoing' : 'incoming',
        status: activeCall.status,
        startTime: activeCall.startTime,
        answerTime: activeCall.answerTime,
        otherParty: {
          id: otherParty.id,
          phoneNumber: otherParty.phoneNumber,
          displayName: otherParty.displayName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
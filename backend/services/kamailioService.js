const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../middleware/logger');
require('dotenv').config();

class KamailioService {
  constructor() {
    this.domain = process.env.KAMAILIO_DOMAIN;
    this.adminUser = process.env.KAMAILIO_ADMIN_USER;
    this.adminPass = process.env.KAMAILIO_ADMIN_PASS;
    this.apiBaseUrl = `http://${this.domain}/api/kamailio`;
  }

  // Membuat hash MD5 untuk autentikasi Kamailio (HA1)
  createHa1(username, domain, password) {
    const ha1 = crypto.createHash('md5').update(`${username}:${domain}:${password}`).digest('hex');
    return ha1;
  }

  // Membuat hash MD5 untuk autentikasi Kamailio alternatif (HA1B)
  createHa1b(username, domain, password) {
    const ha1b = crypto.createHash('md5').update(`${username}@${domain}:${domain}:${password}`).digest('hex');
    return ha1b;
  }

  // Membuat akun SIP di Kamailio
  async createSipAccount(phoneNumber, password) {
    try {
      console.log(`Creating SIP account for ${phoneNumber}`);

      const ha1 = this.createHa1(phoneNumber, this.domain, password);
      const ha1b = this.createHa1b(phoneNumber, this.domain, password);

      // TODO: Implementasi panggilan ke API Kamailio untuk membuat akun SIP
      // Contoh implementasi untuk simulator:
      /*
      const response = await axios.post(`${this.apiBaseUrl}/subscriber`, {
        username: phoneNumber,
        domain: this.domain,
        ha1: ha1,
        ha1b: ha1b
      }, {
        auth: {
          username: this.adminUser,
          password: this.adminPass
        }
      });
      */

      // Untuk simulasi, kita langsung kembalikan hasil
      return { 
        username: phoneNumber,
        domain: this.domain,
        ha1,
        ha1b,
        success: true
      };
    } catch (error) {
      console.error(`Error creating SIP account: ${error.message}`);
      throw new Error('Gagal membuat akun SIP');
    }
  }

  // Menghapus akun SIP di Kamailio
  async deleteSipAccount(phoneNumber) {
    try {
      console.log(`Deleting SIP account for ${phoneNumber}`);

      // TODO: Implementasi panggilan ke API Kamailio untuk menghapus akun SIP
      // Contoh implementasi untuk simulator:
      /*
      const response = await axios.delete(`${this.apiBaseUrl}/subscriber`, {
        data: {
          username: phoneNumber,
          domain: this.domain
        },
        auth: {
          username: this.adminUser,
          password: this.adminPass
        }
      });
      */

      return { success: true };
    } catch (error) {
      console.error(`Error deleting SIP account: ${error.message}`);
      throw new Error('Gagal menghapus akun SIP');
    }
  }

  // Mendapatkan status registrasi SIP
  async getSipRegistration(phoneNumber) {
    try {
      console.log(`Getting SIP registration for ${phoneNumber}`);

      // TODO: Implementasi panggilan ke API Kamailio untuk mendapatkan status registrasi
      // Contoh implementasi untuk simulator:
      /*
      const response = await axios.get(`${this.apiBaseUrl}/registration`, {
        params: {
          username: phoneNumber,
          domain: this.domain
        },
        auth: {
          username: this.adminUser,
          password: this.adminPass
        }
      });
      */

      // Untuk simulasi, kita kembalikan hasil placeholder
      return {
        registered: true,
        contacts: [
          {
            contact: `sip:${phoneNumber}@${this.domain}`,
            expires: 3600,
            q: 1.0,
            userAgent: 'VoIP Web Client',
            received: '192.168.1.100:5060'
          }
        ]
      };
    } catch (error) {
      console.error(`Error getting SIP registration: ${error.message}`);
      throw new Error('Gagal mendapatkan status registrasi SIP');
    }
  }

  // Mengirim pesan SIP OPTIONS untuk memeriksa ketersediaan user
  async checkAvailability(phoneNumber) {
    try {
      console.log(`Checking availability for ${phoneNumber}`);

      // TODO: Implementasi panggilan ke API Kamailio untuk memeriksa ketersediaan
      // Contoh implementasi untuk simulator:
      /*
      const response = await axios.get(`${this.apiBaseUrl}/availability`, {
        params: {
          username: phoneNumber,
          domain: this.domain
        },
        auth: {
          username: this.adminUser,
          password: this.adminPass
        }
      });
      */

      // Untuk simulasi, kita kembalikan hasil random
      const available = Math.random() > 0.2; // 80% chance of being available
      return {
        available,
        status: available ? 'online' : 'offline'
      };
    } catch (error) {
      console.error(`Error checking availability: ${error.message}`);
      throw new Error('Gagal memeriksa ketersediaan pengguna');
    }
  }
}

module.exports = new KamailioService();
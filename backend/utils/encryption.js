const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Hashing password menggunakan bcrypt
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Membandingkan password dengan hash
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Enkripsi simetris menggunakan AES
 */
const encryptAES = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

/**
 * Dekripsi simetris menggunakan AES
 */
const decryptAES = (encryptedText, key) => {
  const iv = Buffer.from(encryptedText.iv, 'hex');
  const encryptedData = Buffer.from(encryptedText.encryptedData, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

/**
 * Menghasilkan token acak
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash MD5 (untuk kompatibilitas dengan Kamailio)
 */
const createMD5Hash = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * Menghasilkan hash HA1 untuk Kamailio
 */
const createHA1 = (username, domain, password) => {
  return createMD5Hash(`${username}:${domain}:${password}`);
};

/**
 * Menghasilkan hash HA1B untuk Kamailio
 */
const createHA1B = (username, domain, password) => {
  return createMD5Hash(`${username}@${domain}:${domain}:${password}`);
};

module.exports = {
  hashPassword,
  comparePassword,
  encryptAES,
  decryptAES,
  generateRandomToken,
  createMD5Hash,
  createHA1,
  createHA1B
};
/**
 * Helper untuk mengkonversi durasi dari milidetik ke format pembacaan manusia
 */
const formatDuration = (durationInSeconds) => {
  if (!durationInSeconds || durationInSeconds <= 0) {
    return '00:00';
  }
  
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Helper untuk memformat nomor telepon
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Bersihkan karakter non-angka
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format dasar: kelompokkan per 4 digit
  const chunks = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    chunks.push(cleaned.slice(i, i + 4));
  }
  
  return chunks.join(' ');
};

/**
 * Helper untuk menghasilkan respons JSON standar
 */
const createResponse = (success, message, data = null, errors = null) => {
  const response = {
    success,
    message
  };
  
  if (data) response.data = data;
  if (errors) response.errors = errors;
  
  return response;
};

/**
 * Helper untuk membuat objek error dengan status code
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Helper untuk parsing query parameters
 */
const parseQueryParams = (query) => {
  const params = {};
  
  // Parse pagination
  params.limit = parseInt(query.limit) || 50;
  params.offset = parseInt(query.offset) || 0;
  
  // Parse sort
  if (query.sort) {
    const [field, order] = query.sort.split(':');
    params.sort = [field, order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'];
  }
  
  // Filter params (saring undefined dan null)
  Object.keys(query).forEach(key => {
    if (
      query[key] !== undefined && 
      query[key] !== null && 
      !['limit', 'offset', 'sort'].includes(key)
    ) {
      params[key] = query[key];
    }
  });
  
  return params;
};

/**
 * Helper untuk memvalidasi nomor telepon
 */
const isValidPhoneNumber = (phoneNumber) => {
  const pattern = /^\+?[0-9]{8,15}$/;
  return pattern.test(phoneNumber);
};

/**
 * Helper untuk menyamarkan nomor telepon untuk keamanan
 */
const maskPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Bersihkan karakter non-angka
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Pertahankan 4 digit pertama dan terakhir, ganti sisanya dengan '*'
  if (cleaned.length <= 8) {
    // Jika nomor telepon pendek, samarkan sebagian
    const visiblePart = Math.floor(cleaned.length / 3);
    return cleaned.slice(0, visiblePart) + 
           '*'.repeat(cleaned.length - visiblePart * 2) + 
           cleaned.slice(-visiblePart);
  } else {
    // Jika nomor telepon panjang, terapkan aturan 4 digit
    return cleaned.slice(0, 4) + 
           '*'.repeat(cleaned.length - 8) + 
           cleaned.slice(-4);
  }
};

/**
 * Helper untuk membatasi penggunaan API (rate limiting)
 */
const createRateLimitKey = (identifier, endpoint) => {
  return `ratelimit:${endpoint}:${identifier}`;
};

module.exports = {
  formatDuration,
  formatPhoneNumber,
  createResponse,
  createError,
  parseQueryParams,
  isValidPhoneNumber,
  maskPhoneNumber,
  createRateLimitKey
};
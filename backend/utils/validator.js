const { body, validationResult } = require('express-validator');

/**
 * Validator for phone numbers
 */
const phoneNumberValidator = () => {
  return body('phoneNumber')
    .isString()
    .notEmpty().withMessage('Nomor telepon diperlukan')
    .matches(/^\+?[0-9]{8,15}$/).withMessage('Format nomor telepon tidak valid');
};

/**
 * Validator for password
 */
const passwordValidator = () => {
  return body('password')
    .isString()
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter');
};

/**
 * Validator for call type
 */
const callTypeValidator = () => {
  return body('callType')
    .isIn(['audio', 'video']).withMessage('Jenis panggilan harus audio atau video');
};

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Custom validation middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    handleValidationErrors(req, res, next);
  };
};

/**
 * Common validation sets
 */
const validations = {
  register: [
    phoneNumberValidator(),
    passwordValidator(),
    body('displayName')
      .optional()
      .isString()
      .isLength({ min: 2, max: 100 }).withMessage('Nama tampilan harus antara 2-100 karakter')
  ],
  
  login: [
    phoneNumberValidator(),
    body('password')
      .isString()
      .notEmpty().withMessage('Password diperlukan')
  ],
  
  initiateCall: [
    body('phoneNumber')
      .isString()
      .notEmpty().withMessage('Nomor telepon diperlukan'),
    callTypeValidator()
  ],
  
  createWebRTCSession: [
    body('callId')
      .notEmpty().withMessage('Call ID diperlukan'),
    body('sdpOffer')
      .isString()
      .notEmpty().withMessage('SDP Offer diperlukan'),
    body('type')
      .isIn(['offer', 'answer']).withMessage('Type harus berupa offer atau answer')
  ]
};

module.exports = {
  validate,
  validations,
  handleValidationErrors,
  phoneNumberValidator,
  passwordValidator,
  callTypeValidator
};
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const callRoutes = require('./routes/callRoutes');
const userRoutes = require('./routes/userRoutes');
const webrtcRoutes = require('./routes/webrtcRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
require('dotenv').config();

// Inisialisasi aplikasi Express
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP untuk pengembangan
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json()); // Body parsing
app.use(express.urlencoded({ extended: true })); // URL-encoded parsing
app.use(morgan('dev')); // HTTP request logging
app.use(logger); // Custom logger

// Endpoint publik untuk health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server berjalan dengan baik' });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/users', userRoutes);
app.use('/api/webrtc', webrtcRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Catch-all route untuk 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route tidak ditemukan' });
});

module.exports = app;
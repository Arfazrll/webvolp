const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const { sequelize } = require('./config/database');
const websocketService = require('./services/websocketService');
require('dotenv').config();

// Ambil port dari environment variable atau gunakan default
const PORT = process.env.PORT || 3001;

// Buat HTTP server
const server = http.createServer(app);

// Inisialisasi Socket.IO dengan CORS yang sesuai
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Pasang middleware WebSocket
websocketService.init(io);

// Test koneksi database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync models with database (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Syncing database models...');
      await sequelize.sync({ alter: true });
      console.log('Database sync completed.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Don't exit in production to allow graceful handling
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  }
};

// Run database connection test
testConnection();

// Mulai server
server.listen(PORT, () => {
  console.log(`VoIP App Backend berjalan pada port ${PORT} dalam mode ${process.env.NODE_ENV}`);
  console.log(`CORS diaktifkan untuk origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Dalam production, pertimbangkan untuk tidak langsung keluar
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Dalam production, pertimbangkan untuk tidak langsung keluar
  // process.exit(1);
});
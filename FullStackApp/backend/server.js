require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`[server] API running on port ${PORT}`);
      console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const shutdown = (signal) => {
      console.log(`[server] Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('[server] HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[server] Failed to start server:', error);
    process.exit(1);
  }
}

start();
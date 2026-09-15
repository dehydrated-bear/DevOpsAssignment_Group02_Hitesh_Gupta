const { Router } = require('express');
const mongoose = require('mongoose');

const router = Router();

router.get('/', async (_req, res) => {
  const dbState = [
    'disconnected',
    'connected',
    'connecting',
    'disconnecting'
  ][mongoose.connection.readyState];

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbState,
    memory: process.memoryUsage().rss
  });
});

module.exports = router;
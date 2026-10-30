const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    message: dbStatus === 'connected' 
      ? 'Backend API and Database are active and connected! 🚀' 
      : 'Backend is running, but MongoDB is DISCONNECTED. Check MONGO_URI and Atlas credentials! ⚠️',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;


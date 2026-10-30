const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const financeRoutes = require('./financeRoutes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/finance', financeRoutes);

module.exports = router;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Security Headers with Helmet
app.use(helmet());

// Enable CORS for mobile development & local IP
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;

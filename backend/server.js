const path = require('path');
// Load environment variables directly from backend/src/.env
require('dotenv').config({ path: path.resolve(__dirname, 'src', '.env') });
require('dotenv').config(); // fallback

const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Backend Server running on port ${PORT}`);
  console.log(`📡 Local: http://localhost:${PORT}`);
  console.log(`📱 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🍃 Database: MongoDB (${process.env.MONGO_URI || 'default local'})`);
  console.log(`=========================================`);
});

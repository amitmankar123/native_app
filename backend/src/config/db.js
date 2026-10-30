const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/Expense_tracker';
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.log(`ℹ️ Please verify your MONGO_URI in backend/src/.env`);
  }
};

module.exports = {
  connectDB,
  mongoose,
};

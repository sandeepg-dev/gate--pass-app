/**
 * MongoDB Database Connection Manager
 */
const mongoose = require('mongoose');

const DEFAULT_MONGO_URI = "mongodb+srv://admin:AdminPass123@cluster0.gpgplkf.mongodb.net/gatepass?retryWrites=true&w=majority";

const connectDB = async () => {
  const uri = process.env.MONGO_URI || DEFAULT_MONGO_URI;

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Failure:', err.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
});

module.exports = connectDB;

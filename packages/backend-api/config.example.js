module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/call-a-technician',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  MARKETING_ORIGIN: process.env.MARKETING_ORIGIN || 'http://localhost:5174',
  ALWAYS_OPEN: process.env.ALWAYS_OPEN !== 'false',
  ENFORCE_SAME_DAY: process.env.ENFORCE_SAME_DAY === 'true'
};


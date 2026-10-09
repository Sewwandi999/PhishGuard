
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Local antivirus/proxy HTTPS intercept can block google-auth-library
// from fetching Google's signing certificates.
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Import routes
const authRoutes = require('./src/routes/auth');
const scanRoutes = require('./src/routes/scan');
const datasetRoutes = require('./src/routes/dataset');
const reportRoutes = require('./src/routes/reports');
const adminRoutes = require('./src/routes/admin');
const chatbotRoutes = require('./src/routes/chatbot');
const { requireDatabase } = require('./src/middleware/database');


// Initialize Express app
const app = express();

// Middleware — browsers send Origin; mobile apps often omit it (allowed).
const parseAllowedOrigins = () => {
  const raw =
    process.env.ALLOWED_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173,http://localhost:3000';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (parseAllowedOrigins().includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected:', mongoose.connection.name))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/scan', requireDatabase, scanRoutes);
app.use('/api/dataset', requireDatabase, datasetRoutes);
app.use('/api/reports', requireDatabase, reportRoutes);
app.use('/api/admin', requireDatabase, adminRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Phishing Detection API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
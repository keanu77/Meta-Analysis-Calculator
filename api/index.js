// Meta Analysis Calculator API Server
const express = require('express');
const cors = require('cors');
const { connect } = require('@planetscale/database');

const authRoutes = require('./routes/auth');
const calculationRoutes = require('./routes/calculations');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// 資料庫連接
const config = {
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  fetch: (url, init) => {
    delete init['cache'];
    return fetch(url, init);
  },
};

global.db = connect(config);

// 中間件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'meta-calculator-api'
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/users', userRoutes);

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 Meta Calculator API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
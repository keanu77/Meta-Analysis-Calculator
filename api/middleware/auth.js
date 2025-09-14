// JWT 認證中間件
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// JWT Token 驗證中間件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  });
};

// 可選的認證中間件（不強制要求登入）
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

// 生成 JWT Token
const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: '24h',
    issuer: 'meta-calculator-api'
  };

  return jwt.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
};

// 驗證 Token 是否有效
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 請求驗證 Schema
const authSchemas = {
  login: z.object({
    email: z.string().email('請輸入有效的電子郵件地址'),
    password: z.string().min(6, '密碼至少需要6個字符')
  }),

  register: z.object({
    email: z.string().email('請輸入有效的電子郵件地址'),
    password: z.string().min(6, '密碼至少需要6個字符'),
    username: z.string().min(2, '用戶名至少需要2個字符').max(50, '用戶名不能超過50個字符'),
    registrationCode: z.string().min(1, '註冊碼為必填項')
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, '請輸入當前密碼'),
    newPassword: z.string().min(6, '新密碼至少需要6個字符')
  })
};

// 驗證請求數據的中間件
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      req.validatedData = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: '請求數據驗證失敗',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken,
  authSchemas,
  validateRequest
};
// 認證相關路由
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const {
  generateToken,
  authenticateToken,
  authSchemas,
  validateRequest
} = require('../middleware/auth');

const router = express.Router();

// 用戶註冊
router.post('/register', validateRequest(authSchemas.register), async (req, res) => {
  try {
    const { email, password, username, registrationCode } = req.validatedData;

    // 驗證註冊碼並檢查使用上限
    const registrationCodeCheck = await global.db.execute(
      `SELECT id, code, max_uses, current_uses, is_active, expires_at
       FROM registration_codes
       WHERE code = ? AND is_active = TRUE`,
      [registrationCode]
    );

    if (registrationCodeCheck.rows.length === 0) {
      return res.status(400).json({
        error: '無效的註冊碼',
        code: 'INVALID_REGISTRATION_CODE'
      });
    }

    const codeInfo = registrationCodeCheck.rows[0];

    // 檢查是否已到期
    if (codeInfo.expires_at && new Date() > new Date(codeInfo.expires_at)) {
      return res.status(400).json({
        error: '註冊碼已過期',
        code: 'REGISTRATION_CODE_EXPIRED'
      });
    }

    // 檢查使用次數是否已達上限 (max_uses = 0 表示無限制)
    if (codeInfo.max_uses > 0 && codeInfo.current_uses >= codeInfo.max_uses) {
      return res.status(400).json({
        error: '註冊碼使用人數已達上限',
        code: 'REGISTRATION_CODE_LIMIT_REACHED'
      });
    }

    // 檢查用戶是否已存在
    const existingUser = await global.db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: '此電子郵件已被註冊',
        code: 'EMAIL_EXISTS'
      });
    }

    // 加密密碼
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 創建新用戶
    const userId = uuidv4();
    const profileId = uuidv4();

    await global.db.execute(
      `INSERT INTO users (id, email, password_hash, username, registration_code, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, email, passwordHash, username, registrationCode]
    );

    // 創建用戶個人資料
    await global.db.execute(
      `INSERT INTO user_profiles (id, user_id, created_at)
       VALUES (?, ?, NOW())`,
      [profileId, userId]
    );

    // 創建默認設定
    const settingsId = uuidv4();
    await global.db.execute(
      `INSERT INTO user_settings (id, user_id, created_at)
       VALUES (?, ?, NOW())`,
      [settingsId, userId]
    );

    // 更新註冊碼使用次數
    await global.db.execute(
      `UPDATE registration_codes
       SET current_uses = current_uses + 1, updated_at = NOW()
       WHERE code = ?`,
      [registrationCode]
    );

    // 生成 JWT Token
    const token = generateToken({
      userId,
      email,
      username,
      type: 'access'
    });

    res.status(201).json({
      message: '註冊成功',
      user: {
        id: userId,
        email,
        username,
        subscriptionPlan: 'FREE'
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: '註冊過程中發生錯誤',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// 用戶登入
router.post('/login', validateRequest(authSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // 查找用戶
    const userResult = await global.db.execute(
      'SELECT id, email, password_hash, username, subscription_plan, is_active FROM users WHERE email = ?',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: '電子郵件或密碼錯誤',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // 檢查帳號是否啟用
    if (!user.is_active) {
      return res.status(401).json({
        error: '帳號已被停用',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 驗證密碼
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        error: '電子郵件或密碼錯誤',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // 更新最後登入時間
    await global.db.execute(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // 生成 JWT Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      type: 'access'
    });

    res.json({
      message: '登入成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionPlan: user.subscription_plan
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: '登入過程中發生錯誤',
      code: 'LOGIN_ERROR'
    });
  }
});

// 驗證 Token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 從資料庫獲取最新用戶資料
    const userResult = await global.db.execute(
      'SELECT id, email, username, subscription_plan, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        error: 'Token 無效或帳號已被停用',
        code: 'INVALID_TOKEN'
      });
    }

    const user = userResult.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionPlan: user.subscription_plan
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Token 驗證過程中發生錯誤',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// 登出 (客戶端處理，伺服器端記錄)
router.post('/logout', authenticateToken, async (req, res) => {
  // 在實際應用中，您可能會將Token加入黑名單
  // 目前只是簡單記錄
  res.json({
    message: '成功登出'
  });
});

// 修改密碼
router.post('/change-password',
  authenticateToken,
  validateRequest(authSchemas.changePassword),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.validatedData;

      // 獲取當前密碼Hash
      const userResult = await global.db.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: '用戶不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      // 驗證當前密碼
      const passwordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!passwordValid) {
        return res.status(400).json({
          error: '當前密碼錯誤',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // 加密新密碼
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // 更新密碼
      await global.db.execute(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [newPasswordHash, userId]
      );

      res.json({
        message: '密碼修改成功'
      });

    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: '密碼修改過程中發生錯誤',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    }
  }
);

module.exports = router;
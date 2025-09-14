// 用戶相關路由
const express = require('express');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, validateRequest } = require('../middleware/auth');

const router = express.Router();

// 驗證 Schema
const userSchemas = {
  updateProfile: z.object({
    username: z.string().min(2, '用戶名至少需要2個字符').max(50, '用戶名不能超過50個字符').optional(),
    institution: z.string().max(200, '機構名稱不能超過200個字符').optional(),
    department: z.string().max(200, '部門名稱不能超過200個字符').optional(),
    researchField: z.string().max(200, '研究領域不能超過200個字符').optional(),
    bio: z.string().max(1000, '個人簡介不能超過1000個字符').optional()
  }),

  updateSettings: z.object({
    language: z.enum(['zh-TW', 'zh-CN', 'en-US']).optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    decimalPlaces: z.number().int().min(2).max(10).optional(),
    autoSave: z.boolean().optional(),
    emailNotifications: z.boolean().optional()
  })
};

// 獲取用戶個人資料
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const profileResult = await global.db.execute(
      `SELECT u.id, u.email, u.username, u.subscription_plan, u.created_at, u.last_login_at,
              p.institution, p.department, p.research_field, p.avatar_url, p.bio
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        error: '用戶不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    const profile = profileResult.rows[0];

    // 獲取統計資料
    const statsResult = await global.db.execute(
      `SELECT
         COUNT(*) as total_calculations,
         COUNT(CASE WHEN is_favorite = TRUE THEN 1 END) as favorite_calculations,
         COUNT(DISTINCT calculation_type) as calculation_types_used,
         MAX(created_at) as last_calculation_date
       FROM calculations
       WHERE user_id = ?`,
      [userId]
    );

    const stats = statsResult.rows[0];

    res.json({
      profile: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        subscriptionPlan: profile.subscription_plan,
        createdAt: profile.created_at,
        lastLoginAt: profile.last_login_at,
        institution: profile.institution,
        department: profile.department,
        researchField: profile.research_field,
        avatarUrl: profile.avatar_url,
        bio: profile.bio
      },
      statistics: {
        totalCalculations: parseInt(stats.total_calculations),
        favoriteCalculations: parseInt(stats.favorite_calculations),
        calculationTypesUsed: parseInt(stats.calculation_types_used),
        lastCalculationDate: stats.last_calculation_date
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: '獲取個人資料時發生錯誤',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

// 更新用戶個人資料
router.put('/profile', authenticateToken, validateRequest(userSchemas.updateProfile), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, institution, department, researchField, bio } = req.validatedData;

    const userUpdates = [];
    const userParams = [];
    const profileUpdates = [];
    const profileParams = [];

    // 準備用戶表更新
    if (username !== undefined) {
      userUpdates.push('username = ?');
      userParams.push(username);
    }

    // 準備個人資料表更新
    if (institution !== undefined) {
      profileUpdates.push('institution = ?');
      profileParams.push(institution);
    }

    if (department !== undefined) {
      profileUpdates.push('department = ?');
      profileParams.push(department);
    }

    if (researchField !== undefined) {
      profileUpdates.push('research_field = ?');
      profileParams.push(researchField);
    }

    if (bio !== undefined) {
      profileUpdates.push('bio = ?');
      profileParams.push(bio);
    }

    // 更新用戶表
    if (userUpdates.length > 0) {
      userUpdates.push('updated_at = NOW()');
      userParams.push(userId);

      await global.db.execute(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userParams
      );
    }

    // 更新個人資料表
    if (profileUpdates.length > 0) {
      profileUpdates.push('updated_at = NOW()');
      profileParams.push(userId);

      await global.db.execute(
        `UPDATE user_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
        profileParams
      );
    }

    res.json({
      message: '個人資料已更新'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: '更新個人資料時發生錯誤',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

// 獲取用戶設定
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const settingsResult = await global.db.execute(
      'SELECT language, theme, decimal_places, auto_save, email_notifications, settings_json FROM user_settings WHERE user_id = ?',
      [userId]
    );

    if (settingsResult.rows.length === 0) {
      // 創建默認設定
      const settingsId = uuidv4();
      await global.db.execute(
        `INSERT INTO user_settings (id, user_id, created_at) VALUES (?, ?, NOW())`,
        [settingsId, userId]
      );

      return res.json({
        settings: {
          language: 'zh-TW',
          theme: 'light',
          decimalPlaces: 4,
          autoSave: true,
          emailNotifications: true
        }
      });
    }

    const settings = settingsResult.rows[0];
    let customSettings = {};

    try {
      customSettings = settings.settings_json ? JSON.parse(settings.settings_json) : {};
    } catch (e) {
      console.warn('Failed to parse custom settings JSON');
    }

    res.json({
      settings: {
        language: settings.language,
        theme: settings.theme,
        decimalPlaces: settings.decimal_places,
        autoSave: !!settings.auto_save,
        emailNotifications: !!settings.email_notifications,
        ...customSettings
      }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: '獲取設定時發生錯誤',
      code: 'GET_SETTINGS_ERROR'
    });
  }
});

// 更新用戶設定
router.put('/settings', authenticateToken, validateRequest(userSchemas.updateSettings), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { language, theme, decimalPlaces, autoSave, emailNotifications } = req.validatedData;

    const updates = [];
    const params = [];

    if (language !== undefined) {
      updates.push('language = ?');
      params.push(language);
    }

    if (theme !== undefined) {
      updates.push('theme = ?');
      params.push(theme);
    }

    if (decimalPlaces !== undefined) {
      updates.push('decimal_places = ?');
      params.push(decimalPlaces);
    }

    if (autoSave !== undefined) {
      updates.push('auto_save = ?');
      params.push(autoSave);
    }

    if (emailNotifications !== undefined) {
      updates.push('email_notifications = ?');
      params.push(emailNotifications);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: '沒有提供要更新的設定',
        code: 'NO_SETTINGS_TO_UPDATE'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(userId);

    await global.db.execute(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    res.json({
      message: '設定已更新'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: '更新設定時發生錯誤',
      code: 'UPDATE_SETTINGS_ERROR'
    });
  }
});

// 獲取用戶統計資料
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 基本統計
    const basicStats = await global.db.execute(
      `SELECT
         COUNT(*) as total_calculations,
         COUNT(CASE WHEN is_favorite = TRUE THEN 1 END) as favorite_calculations,
         COUNT(DISTINCT calculation_type) as calculation_types_used,
         MAX(created_at) as last_calculation_date,
         MIN(created_at) as first_calculation_date
       FROM calculations
       WHERE user_id = ?`,
      [userId]
    );

    // 按類型統計
    const typeStats = await global.db.execute(
      `SELECT calculation_type, COUNT(*) as count
       FROM calculations
       WHERE user_id = ?
       GROUP BY calculation_type
       ORDER BY count DESC`,
      [userId]
    );

    // 按日期統計（最近30天）
    const dateStats = await global.db.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM calculations
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userId]
    );

    // 資料夾統計
    const folderStats = await global.db.execute(
      `SELECT COUNT(*) as total_folders
       FROM calculation_folders
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      basicStatistics: basicStats.rows[0],
      calculationsByType: typeStats.rows,
      calculationsByDate: dateStats.rows,
      folderStatistics: folderStats.rows[0]
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      error: '獲取統計資料時發生錯誤',
      code: 'GET_STATISTICS_ERROR'
    });
  }
});

// 刪除帳號
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        error: '請提供密碼以確認刪除',
        code: 'PASSWORD_REQUIRED'
      });
    }

    // 驗證密碼
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

    const bcrypt = require('bcryptjs');
    const passwordValid = await bcrypt.compare(confirmPassword, userResult.rows[0].password_hash);

    if (!passwordValid) {
      return res.status(400).json({
        error: '密碼錯誤',
        code: 'INVALID_PASSWORD'
      });
    }

    // 刪除用戶（級聯刪除會自動處理相關資料）
    await global.db.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      message: '帳號已成功刪除'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: '刪除帳號時發生錯誤',
      code: 'DELETE_ACCOUNT_ERROR'
    });
  }
});

module.exports = router;
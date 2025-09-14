// 計算相關路由
const express = require('express');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, optionalAuth, validateRequest } = require('../middleware/auth');

const router = express.Router();

// 驗證 Schema
const calculationSchemas = {
  create: z.object({
    calculationType: z.string().min(1, '計算類型為必填項'),
    inputData: z.object({}).passthrough(), // 允許任意輸入數據結構
    results: z.object({}).passthrough(), // 允許任意結果數據結構
    title: z.string().optional(),
    notes: z.string().optional()
  }),

  update: z.object({
    title: z.string().optional(),
    notes: z.string().optional(),
    isFavorite: z.boolean().optional()
  }),

  folder: z.object({
    folderName: z.string().min(1, '資料夾名稱為必填項').max(100, '資料夾名稱不能超過100個字符'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '請提供有效的顏色代碼').optional()
  })
};

// 儲存計算結果
router.post('/', authenticateToken, validateRequest(calculationSchemas.create), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { calculationType, inputData, results, title, notes } = req.validatedData;

    const calculationId = uuidv4();

    await global.db.execute(
      `INSERT INTO calculations (id, user_id, calculation_type, input_data, results, title, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        calculationId,
        userId,
        calculationType,
        JSON.stringify(inputData),
        JSON.stringify(results),
        title || null,
        notes || null
      ]
    );

    // 更新使用統計
    const today = new Date().toISOString().split('T')[0];
    await global.db.execute(
      `INSERT INTO usage_statistics (id, user_id, calculation_type, date, calculation_count, created_at)
       VALUES (?, ?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE calculation_count = calculation_count + 1`,
      [uuidv4(), userId, calculationType, today]
    );

    res.status(201).json({
      message: '計算結果已儲存',
      calculationId
    });

  } catch (error) {
    console.error('Save calculation error:', error);
    res.status(500).json({
      error: '儲存計算結果時發生錯誤',
      code: 'SAVE_CALCULATION_ERROR'
    });
  }
});

// 獲取用戶的計算歷史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const calculationType = req.query.type;
    const favorite = req.query.favorite === 'true';

    const offset = (page - 1) * limit;

    // 構建查詢條件
    let whereClause = 'WHERE user_id = ?';
    let queryParams = [userId];

    if (calculationType) {
      whereClause += ' AND calculation_type = ?';
      queryParams.push(calculationType);
    }

    if (favorite) {
      whereClause += ' AND is_favorite = TRUE';
    }

    // 獲取計算歷史
    const calculations = await global.db.execute(
      `SELECT id, calculation_type, title, notes, is_favorite, created_at, updated_at
       FROM calculations
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // 獲取總數
    const countResult = await global.db.execute(
      `SELECT COUNT(*) as total FROM calculations ${whereClause}`,
      queryParams
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      calculations: calculations.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });

  } catch (error) {
    console.error('Get calculation history error:', error);
    res.status(500).json({
      error: '獲取計算歷史時發生錯誤',
      code: 'GET_HISTORY_ERROR'
    });
  }
});

// 獲取特定計算的詳細資料
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const calculationId = req.params.id;

    const result = await global.db.execute(
      `SELECT id, calculation_type, input_data, results, title, notes, is_favorite, created_at, updated_at
       FROM calculations
       WHERE id = ? AND user_id = ?`,
      [calculationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: '計算記錄不存在',
        code: 'CALCULATION_NOT_FOUND'
      });
    }

    const calculation = result.rows[0];
    calculation.input_data = JSON.parse(calculation.input_data);
    calculation.results = JSON.parse(calculation.results);

    res.json(calculation);

  } catch (error) {
    console.error('Get calculation detail error:', error);
    res.status(500).json({
      error: '獲取計算詳細資料時發生錯誤',
      code: 'GET_CALCULATION_ERROR'
    });
  }
});

// 更新計算記錄
router.put('/:id', authenticateToken, validateRequest(calculationSchemas.update), async (req, res) => {
  try {
    const userId = req.user.userId;
    const calculationId = req.params.id;
    const { title, notes, isFavorite } = req.validatedData;

    // 檢查計算記錄是否存在
    const existingCalc = await global.db.execute(
      'SELECT id FROM calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );

    if (existingCalc.rows.length === 0) {
      return res.status(404).json({
        error: '計算記錄不存在',
        code: 'CALCULATION_NOT_FOUND'
      });
    }

    // 構建更新語句
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (isFavorite !== undefined) {
      updates.push('is_favorite = ?');
      params.push(isFavorite);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: '沒有提供要更新的欄位',
        code: 'NO_UPDATE_FIELDS'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(calculationId, userId);

    await global.db.execute(
      `UPDATE calculations SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    res.json({
      message: '計算記錄已更新'
    });

  } catch (error) {
    console.error('Update calculation error:', error);
    res.status(500).json({
      error: '更新計算記錄時發生錯誤',
      code: 'UPDATE_CALCULATION_ERROR'
    });
  }
});

// 刪除計算記錄
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const calculationId = req.params.id;

    const result = await global.db.execute(
      'DELETE FROM calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: '計算記錄不存在',
        code: 'CALCULATION_NOT_FOUND'
      });
    }

    res.json({
      message: '計算記錄已刪除'
    });

  } catch (error) {
    console.error('Delete calculation error:', error);
    res.status(500).json({
      error: '刪除計算記錄時發生錯誤',
      code: 'DELETE_CALCULATION_ERROR'
    });
  }
});

// 創建資料夾
router.post('/folders', authenticateToken, validateRequest(calculationSchemas.folder), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folderName, color } = req.validatedData;

    const folderId = uuidv4();

    await global.db.execute(
      `INSERT INTO calculation_folders (id, user_id, folder_name, color, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [folderId, userId, folderName, color || '#3B82F6']
    );

    res.status(201).json({
      message: '資料夾已創建',
      folderId
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: '資料夾名稱已存在',
        code: 'FOLDER_NAME_EXISTS'
      });
    }

    console.error('Create folder error:', error);
    res.status(500).json({
      error: '創建資料夾時發生錯誤',
      code: 'CREATE_FOLDER_ERROR'
    });
  }
});

// 獲取用戶的資料夾列表
router.get('/folders/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const folders = await global.db.execute(
      `SELECT f.id, f.folder_name, f.color, f.created_at,
              COUNT(fi.calculation_id) as calculation_count
       FROM calculation_folders f
       LEFT JOIN calculation_folder_items fi ON f.id = fi.folder_id
       WHERE f.user_id = ?
       GROUP BY f.id, f.folder_name, f.color, f.created_at
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({
      folders: folders.rows
    });

  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({
      error: '獲取資料夾列表時發生錯誤',
      code: 'GET_FOLDERS_ERROR'
    });
  }
});

// 將計算加入資料夾
router.post('/folders/:folderId/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const folderId = req.params.folderId;
    const { calculationId } = req.body;

    if (!calculationId) {
      return res.status(400).json({
        error: '計算ID為必填項',
        code: 'MISSING_CALCULATION_ID'
      });
    }

    // 檢查資料夾是否屬於當前用戶
    const folderCheck = await global.db.execute(
      'SELECT id FROM calculation_folders WHERE id = ? AND user_id = ?',
      [folderId, userId]
    );

    if (folderCheck.rows.length === 0) {
      return res.status(404).json({
        error: '資料夾不存在',
        code: 'FOLDER_NOT_FOUND'
      });
    }

    // 檢查計算記錄是否屬於當前用戶
    const calcCheck = await global.db.execute(
      'SELECT id FROM calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );

    if (calcCheck.rows.length === 0) {
      return res.status(404).json({
        error: '計算記錄不存在',
        code: 'CALCULATION_NOT_FOUND'
      });
    }

    // 加入資料夾
    const itemId = uuidv4();
    await global.db.execute(
      'INSERT INTO calculation_folder_items (id, folder_id, calculation_id, created_at) VALUES (?, ?, ?, NOW())',
      [itemId, folderId, calculationId]
    );

    res.json({
      message: '已加入資料夾'
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: '該計算已在此資料夾中',
        code: 'CALCULATION_ALREADY_IN_FOLDER'
      });
    }

    console.error('Add to folder error:', error);
    res.status(500).json({
      error: '加入資料夾時發生錯誤',
      code: 'ADD_TO_FOLDER_ERROR'
    });
  }
});

module.exports = router;
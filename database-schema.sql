-- Meta Analysis Calculator Database Schema
-- 適用於 PlanetScale / MySQL

-- 用戶表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    registration_code VARCHAR(50),
    subscription_plan ENUM('FREE', 'PREMIUM') DEFAULT 'FREE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 用戶個人資料表
CREATE TABLE user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    institution VARCHAR(200),
    department VARCHAR(200),
    research_field VARCHAR(200),
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 計算歷史表
CREATE TABLE calculations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    calculation_type VARCHAR(100) NOT NULL, -- 'effect_size', 'confidence_interval', etc.
    input_data JSON NOT NULL, -- 儲存輸入參數
    results JSON NOT NULL, -- 儲存計算結果
    title VARCHAR(200), -- 用戶自定義標題
    notes TEXT, -- 用戶註記
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_calculations (user_id, created_at DESC),
    INDEX idx_calculation_type (calculation_type)
);

-- 計算收藏夾/資料夾表
CREATE TABLE calculation_folders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    folder_name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 資料夾顏色
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_folder (user_id, folder_name)
);

-- 計算與資料夾的關聯表
CREATE TABLE calculation_folder_items (
    id VARCHAR(36) PRIMARY KEY,
    folder_id VARCHAR(36) NOT NULL,
    calculation_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES calculation_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (calculation_id) REFERENCES calculations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_folder_calculation (folder_id, calculation_id)
);

-- 用戶設定表
CREATE TABLE user_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    language VARCHAR(10) DEFAULT 'zh-TW',
    theme VARCHAR(20) DEFAULT 'light',
    decimal_places INT DEFAULT 4,
    auto_save BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    settings_json JSON, -- 其他自定義設定
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 系統使用統計表（可選）
CREATE TABLE usage_statistics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    calculation_type VARCHAR(100),
    calculation_count INT DEFAULT 1,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_date_type (user_id, date, calculation_type)
);

-- 建立索引以提高查詢效能
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active, created_at);
CREATE INDEX idx_calculations_user_date ON calculations(user_id, created_at DESC);
CREATE INDEX idx_calculations_favorite ON calculations(user_id, is_favorite, created_at DESC);
CREATE INDEX idx_usage_stats_date ON usage_statistics(date);
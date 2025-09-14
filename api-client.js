// API 客戶端 - 連接前端與後端服務
console.log('載入 API 客戶端...');

class ApiClient {
    constructor() {
        this.baseURL = this.getApiBaseUrl();
        this.token = this.getStoredToken();
    }

    // 根據環境決定API基礎URL
    getApiBaseUrl() {
        // 生產環境：從環境變數或域名判斷
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return `${window.location.protocol}//${window.location.hostname}/api`;
        }

        // 開發環境：本地API服務
        return 'http://localhost:3000/api';
    }

    // 從localStorage獲取Token
    getStoredToken() {
        const auth = localStorage.getItem('meta_calculator_auth') || sessionStorage.getItem('meta_calculator_auth');
        if (auth) {
            try {
                const authData = JSON.parse(auth);
                return authData.token;
            } catch (e) {
                console.warn('無法解析存儲的認證資料');
            }
        }
        return null;
    }

    // 設置認證Token
    setToken(token) {
        this.token = token;
    }

    // 通用HTTP請求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // 添加認證頭
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new ApiError(data.error || 'Request failed', response.status, data.code);
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            // 網路錯誤或其他錯誤
            console.error('API請求錯誤:', error);
            throw new ApiError('網路連接失敗，請檢查網路狀態', 0, 'NETWORK_ERROR');
        }
    }

    // GET 請求
    async get(endpoint, params = {}) {
        const searchParams = new URLSearchParams(params);
        const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;

        return this.request(url, {
            method: 'GET'
        });
    }

    // POST 請求
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT 請求
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE 請求
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ===================
    // 認證相關API
    // ===================

    // 用戶註冊
    async register(userData) {
        const response = await this.post('/auth/register', userData);

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    // 用戶登入
    async login(credentials) {
        const response = await this.post('/auth/login', credentials);

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    // 驗證Token
    async verifyToken() {
        return this.get('/auth/verify');
    }

    // 登出
    async logout() {
        if (this.token) {
            try {
                await this.post('/auth/logout');
            } catch (error) {
                console.warn('登出請求失敗:', error);
            }
        }

        this.token = null;
    }

    // 修改密碼
    async changePassword(passwordData) {
        return this.post('/auth/change-password', passwordData);
    }

    // ===================
    // 計算相關API
    // ===================

    // 儲存計算結果
    async saveCalculation(calculationData) {
        return this.post('/calculations', calculationData);
    }

    // 獲取計算歷史
    async getCalculationHistory(params = {}) {
        return this.get('/calculations/history', params);
    }

    // 獲取計算詳情
    async getCalculation(calculationId) {
        return this.get(`/calculations/${calculationId}`);
    }

    // 更新計算記錄
    async updateCalculation(calculationId, updateData) {
        return this.put(`/calculations/${calculationId}`, updateData);
    }

    // 刪除計算記錄
    async deleteCalculation(calculationId) {
        return this.delete(`/calculations/${calculationId}`);
    }

    // 創建資料夾
    async createFolder(folderData) {
        return this.post('/calculations/folders', folderData);
    }

    // 獲取資料夾列表
    async getFolders() {
        return this.get('/calculations/folders/list');
    }

    // 將計算加入資料夾
    async addCalculationToFolder(folderId, calculationId) {
        return this.post(`/calculations/folders/${folderId}/items`, { calculationId });
    }

    // ===================
    // 用戶相關API
    // ===================

    // 獲取用戶個人資料
    async getUserProfile() {
        return this.get('/users/profile');
    }

    // 更新用戶個人資料
    async updateUserProfile(profileData) {
        return this.put('/users/profile', profileData);
    }

    // 獲取用戶設定
    async getUserSettings() {
        return this.get('/users/settings');
    }

    // 更新用戶設定
    async updateUserSettings(settingsData) {
        return this.put('/users/settings', settingsData);
    }

    // 獲取用戶統計資料
    async getUserStatistics() {
        return this.get('/users/statistics');
    }

    // 刪除帳號
    async deleteAccount(confirmPassword) {
        return this.delete('/users/account', { confirmPassword });
    }

    // ===================
    // 健康檢查
    // ===================

    // 檢查API服務狀態
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// 自定義錯誤類別
class ApiError extends Error {
    constructor(message, status = 0, code = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }

    // 判斷是否為認證錯誤
    isAuthError() {
        return this.status === 401 || this.status === 403;
    }

    // 判斷是否為網路錯誤
    isNetworkError() {
        return this.status === 0 || this.code === 'NETWORK_ERROR';
    }

    // 判斷是否為伺服器錯誤
    isServerError() {
        return this.status >= 500;
    }

    // 獲取用戶友好的錯誤訊息
    getUserMessage() {
        if (this.isNetworkError()) {
            return '網路連接失敗，請檢查網路狀態後重試';
        }

        if (this.isServerError()) {
            return '伺服器暫時無法提供服務，請稍後再試';
        }

        if (this.isAuthError()) {
            return '登入狀態已失效，請重新登入';
        }

        // 針對註冊碼相關的錯誤提供友好訊息
        switch (this.code) {
            case 'REGISTRATION_CODE_LIMIT_REACHED':
                return '此註冊碼的使用人數已達上限，請聯絡管理員取得新的註冊碼';
            case 'REGISTRATION_CODE_EXPIRED':
                return '註冊碼已過期，請聯絡管理員取得有效的註冊碼';
            case 'INVALID_REGISTRATION_CODE':
                return '無效的註冊碼，請檢查輸入是否正確';
            case 'EMAIL_EXISTS':
                return '此電子郵件已被註冊，請使用其他郵箱或直接登入';
            default:
                return this.message || '操作失敗，請重試';
        }
    }
}

// 創建全域API客戶端實例
const apiClient = new ApiClient();

// 將API客戶端暴露到全域
window.apiClient = apiClient;
window.ApiError = ApiError;

console.log('API 客戶端已載入');
console.log('API 基礎URL:', apiClient.baseURL);
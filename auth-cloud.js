// 雲端版本的 AuthManager - 整合後端API
console.log('載入雲端 AuthManager...');

const CloudAuthManager = {
    STORAGE_KEY: 'meta_calculator_auth',
    currentUser: null,
    messageTimer: null,
    isOnline: navigator.onLine,

    init() {
        console.log('CloudAuthManager 正在初始化...');

        // 監聽網路狀態
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showMessage('網路連接已恢復', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showMessage('網路連接中斷，部分功能可能無法使用', 'warning');
        });

        this.checkAuthStatus();
        this.setupEventDelegation();
        console.log('CloudAuthManager 初始化完成');
    },

    setupEventDelegation() {
        console.log('CloudAuthManager 事件委派已設定');
    },

    async checkAuthStatus() {
        console.log('檢查認證狀態...');

        const auth = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);

        if (auth) {
            try {
                const authData = JSON.parse(auth);
                apiClient.setToken(authData.token);

                // 如果在線，驗證Token是否有效
                if (this.isOnline) {
                    try {
                        const verifyResult = await apiClient.verifyToken();
                        this.currentUser = { ...authData, ...verifyResult.user };
                        this.updateUIForLoggedIn();
                        this.removeAuthOverlay();
                        console.log('Token驗證成功，用戶已登入:', this.currentUser);
                    } catch (error) {
                        console.error('Token驗證失敗:', error);
                        this.clearAuthData();
                        this.updateUIForLoggedOut();
                    }
                } else {
                    // 離線狀態，使用本地儲存的資料
                    this.currentUser = authData;
                    this.updateUIForLoggedIn();
                    this.removeAuthOverlay();
                    console.log('離線模式，使用本地儲存的用戶資料:', this.currentUser);
                }
            } catch (e) {
                console.error('解析認證資料失敗:', e);
                this.clearAuthData();
                this.updateUIForLoggedOut();
            }
        } else {
            console.log('用戶未登入');
            this.updateUIForLoggedOut();
        }
    },

    clearAuthData() {
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.currentUser = null;
        apiClient.setToken(null);
    },

    showLoginModal() {
        console.log('顯示登入模態視窗');
        this.removeExistingModal();

        const modal = document.createElement('div');
        modal.className = 'auth-modal center-modal';
        modal.id = 'auth-modal';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="auth-modal-content">
                <button class="auth-close-btn" type="button">
                    <i class="fas fa-times"></i>
                </button>

                <div class="auth-header">
                    <h2>登入帳號</h2>
                    <p>登入以存取雲端數據同步</p>
                    ${!this.isOnline ? '<div class="offline-notice">⚠️ 目前離線，登入功能暫不可用</div>' : ''}
                </div>

                <form class="auth-form" id="login-form">
                    <div class="form-group">
                        <label for="login-email">電子郵件</label>
                        <input type="email" id="login-email" placeholder="your@email.com" required ${!this.isOnline ? 'disabled' : ''} />
                    </div>

                    <div class="form-group">
                        <label for="login-password">密碼</label>
                        <input type="password" id="login-password" placeholder="輸入密碼" required ${!this.isOnline ? 'disabled' : ''} />
                    </div>

                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="remember-me" ${!this.isOnline ? 'disabled' : ''} />
                            <span>記住我</span>
                        </label>
                    </div>

                    <button type="submit" class="auth-btn primary" ${!this.isOnline ? 'disabled' : ''}>
                        <i class="fas fa-sign-in-alt"></i> 登入
                    </button>

                    <div class="auth-footer">
                        <p>還沒有帳號？<a href="#" id="switch-to-register">立即註冊</a></p>
                    </div>
                </form>

                <div id="auth-message" class="auth-message" style="display: none;"></div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEventHandlers(modal);
    },

    showRegisterModal() {
        console.log('顯示註冊模態視窗');
        this.removeExistingModal();

        const modal = document.createElement('div');
        modal.className = 'auth-modal center-modal';
        modal.id = 'auth-modal';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="auth-modal-content">
                <button class="auth-close-btn" type="button">
                    <i class="fas fa-times"></i>
                </button>

                <div class="auth-header">
                    <h2>註冊新帳號</h2>
                    <p>建立帳號以享受雲端數據同步功能</p>
                    ${!this.isOnline ? '<div class="offline-notice">⚠️ 目前離線，註冊功能暫不可用</div>' : ''}
                </div>

                <form class="auth-form" id="register-form">
                    <div class="form-group">
                        <label for="register-username">用戶名稱</label>
                        <input type="text" id="register-username" placeholder="輸入用戶名稱" required ${!this.isOnline ? 'disabled' : ''} />
                    </div>

                    <div class="form-group">
                        <label for="register-email">電子郵件</label>
                        <input type="email" id="register-email" placeholder="your@email.com" required ${!this.isOnline ? 'disabled' : ''} />
                    </div>

                    <div class="form-group">
                        <label for="register-password">密碼</label>
                        <input type="password" id="register-password" placeholder="至少6個字符" required ${!this.isOnline ? 'disabled' : ''} />
                    </div>

                    <div class="form-group">
                        <label for="register-code">註冊碼</label>
                        <input type="text" id="register-code" placeholder="請輸入註冊碼" required ${!this.isOnline ? 'disabled' : ''} />
                        <small>有效註冊碼：EBM2025, META2025, RESEARCH2025, ADMIN123</small>
                    </div>

                    <button type="submit" class="auth-btn primary" ${!this.isOnline ? 'disabled' : ''}>
                        <i class="fas fa-user-plus"></i> 註冊
                    </button>

                    <div class="auth-footer">
                        <p>已有帳號？<a href="#" id="switch-to-login">立即登入</a></p>
                    </div>
                </form>

                <div id="auth-message" class="auth-message" style="display: none;"></div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEventHandlers(modal);
    },

    setupModalEventHandlers(modal) {
        // 關閉按鈕
        const closeBtn = modal.querySelector('.auth-close-btn');
        closeBtn?.addEventListener('click', () => this.removeExistingModal());

        // 切換表單
        const switchToRegister = modal.querySelector('#switch-to-register');
        switchToRegister?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterModal();
        });

        const switchToLogin = modal.querySelector('#switch-to-login');
        switchToLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginModal();
        });

        // 表單提交
        const loginForm = modal.querySelector('#login-form');
        loginForm?.addEventListener('submit', (e) => this.handleLogin(e));

        const registerForm = modal.querySelector('#register-form');
        registerForm?.addEventListener('submit', (e) => this.handleRegister(e));

        // 點擊外部關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.removeExistingModal();
            }
        });
    },

    async handleLogin(event) {
        event.preventDefault();

        if (!this.isOnline) {
            this.showAuthMessage('網路連接中斷，無法登入', 'error');
            return;
        }

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!email || !password) {
            this.showAuthMessage('請填寫所有必填欄位', 'error');
            return;
        }

        this.showAuthMessage('正在登入...', 'info');

        try {
            const response = await apiClient.login({ email, password });

            const authData = {
                ...response.user,
                token: response.token,
                loginTime: new Date().toISOString()
            };

            // 儲存認證資料
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem(this.STORAGE_KEY, JSON.stringify(authData));

            this.currentUser = authData;
            this.showAuthMessage(response.message || '登入成功！', 'success');

            setTimeout(() => {
                this.removeExistingModal();
                this.updateUIForLoggedIn();
                this.removeAuthOverlay();
            }, 1500);

        } catch (error) {
            console.error('登入失敗:', error);
            this.showAuthMessage(error.getUserMessage(), 'error');
        }
    },

    async handleRegister(event) {
        event.preventDefault();

        if (!this.isOnline) {
            this.showAuthMessage('網路連接中斷，無法註冊', 'error');
            return;
        }

        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const registrationCode = document.getElementById('register-code').value.trim();

        if (!username || !email || !password || !registrationCode) {
            this.showAuthMessage('請填寫所有必填欄位', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('密碼至少需要6個字符', 'error');
            return;
        }

        this.showAuthMessage('正在註冊...', 'info');

        try {
            const response = await apiClient.register({
                username,
                email,
                password,
                registrationCode
            });

            const authData = {
                ...response.user,
                token: response.token,
                loginTime: new Date().toISOString()
            };

            // 儲存認證資料
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));

            this.currentUser = authData;
            this.showAuthMessage(response.message || '註冊成功！', 'success');

            setTimeout(() => {
                this.removeExistingModal();
                this.updateUIForLoggedIn();
                this.removeAuthOverlay();
            }, 1500);

        } catch (error) {
            console.error('註冊失敗:', error);
            this.showAuthMessage(error.getUserMessage(), 'error');
        }
    },

    async logout() {
        console.log('用戶登出');

        if (this.isOnline && this.currentUser) {
            try {
                await apiClient.logout();
            } catch (error) {
                console.warn('登出請求失敗:', error);
            }
        }

        this.clearAuthData();
        this.updateUIForLoggedOut();
        this.showMessage('已成功登出', 'info');
    },

    // 保留原有的UI更新方法
    updateUIForLoggedIn() {
        console.log('更新UI為已登入狀態');
        const userBtn = document.getElementById('user-btn');
        const loginBtn = document.getElementById('login-btn');

        if (userBtn && this.currentUser) {
            userBtn.style.display = 'flex';
            userBtn.querySelector('span').textContent = this.currentUser.username || this.currentUser.email;
        }

        if (loginBtn) {
            loginBtn.style.display = 'none';
        }

        this.updateCloudSyncStatus();
    },

    updateUIForLoggedOut() {
        console.log('更新UI為未登入狀態');
        const userBtn = document.getElementById('user-btn');
        const loginBtn = document.getElementById('login-btn');

        if (userBtn) {
            userBtn.style.display = 'none';
        }

        if (loginBtn) {
            loginBtn.style.display = 'flex';
        }

        this.updateCloudSyncStatus();
    },

    updateCloudSyncStatus() {
        // 更新雲端同步狀態指示器
        const syncIndicator = document.querySelector('.sync-status');
        if (syncIndicator) {
            if (this.currentUser && this.isOnline) {
                syncIndicator.className = 'sync-status online';
                syncIndicator.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> 已連接';
            } else if (this.currentUser && !this.isOnline) {
                syncIndicator.className = 'sync-status offline';
                syncIndicator.innerHTML = '<i class="fas fa-cloud-off"></i> 離線';
            } else {
                syncIndicator.className = 'sync-status disconnected';
                syncIndicator.innerHTML = '<i class="fas fa-user-slash"></i> 未登入';
            }
        }
    },

    // 其他保留的輔助方法
    removeExistingModal() {
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) {
            existingModal.remove();
        }
    },

    showAuthOverlay() {
        // 可選：顯示登入遮罩
    },

    removeAuthOverlay() {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    showAuthMessage(message, type = 'info') {
        const messageDiv = document.getElementById('auth-message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `auth-message ${type}`;
            messageDiv.style.display = 'block';

            if (this.messageTimer) {
                clearTimeout(this.messageTimer);
            }

            if (type !== 'info') {
                this.messageTimer = setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            }
        }
    },

    showMessage(message, type = 'info') {
        // 全域訊息顯示
        console.log(`[${type.toUpperCase()}] ${message}`);

        // 如果有全域通知系統，在這裡觸發
        if (window.showNotification) {
            window.showNotification(message, type);
        }
    }
};

// 使用雲端版本替代原版本
if (typeof window !== 'undefined') {
    window.AuthManager = CloudAuthManager;
}

console.log('雲端 AuthManager 已載入');
// 混合版認證管理器 - 結合本地功能與註冊碼管理
console.log('載入混合版 AuthManager...');

const HybridAuthManager = {
    STORAGE_KEY: 'meta_calculator_auth',
    USERS_KEY: 'meta_calculator_users',
    CODES_KEY: 'meta_calculator_codes',
    currentUser: null,
    messageTimer: null,

    // 註冊碼配置
    registrationCodes: {
        'EBM2025': {
            description: '實證醫學註冊碼',
            maxUses: 100,
            currentUses: 0,
            isActive: true,
            expiresAt: null // null 表示永不過期
        }
    },

    init() {
        console.log('HybridAuthManager 正在初始化...');
        this.loadRegistrationCodes();
        this.checkAuthStatus();
        this.setupEventDelegation();
        console.log('HybridAuthManager 初始化完成');
    },

    loadRegistrationCodes() {
        const storedCodes = localStorage.getItem(this.CODES_KEY);
        if (storedCodes) {
            try {
                this.registrationCodes = { ...this.registrationCodes, ...JSON.parse(storedCodes) };
            } catch (e) {
                console.warn('載入註冊碼資料失敗，使用預設配置');
            }
        }
        this.saveRegistrationCodes();
    },

    saveRegistrationCodes() {
        localStorage.setItem(this.CODES_KEY, JSON.stringify(this.registrationCodes));
    },

    validateRegistrationCode(code) {
        const codeInfo = this.registrationCodes[code];

        if (!codeInfo || !codeInfo.isActive) {
            return { valid: false, error: '無效的註冊碼' };
        }

        // 檢查是否過期
        if (codeInfo.expiresAt && new Date() > new Date(codeInfo.expiresAt)) {
            return { valid: false, error: '註冊碼已過期' };
        }

        // 檢查使用次數限制
        if (codeInfo.maxUses > 0 && codeInfo.currentUses >= codeInfo.maxUses) {
            return { valid: false, error: '註冊碼使用人數已達上限' };
        }

        return { valid: true, codeInfo };
    },

    incrementCodeUsage(code) {
        if (this.registrationCodes[code]) {
            this.registrationCodes[code].currentUses++;
            this.saveRegistrationCodes();
        }
    },

    setupEventDelegation() {
        console.log('HybridAuthManager 事件委派已設定');
    },

    checkAuthStatus() {
        console.log('檢查認證狀態...');
        const auth = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);

        if (auth) {
            try {
                this.currentUser = JSON.parse(auth);
                console.log('找到已登入用戶:', this.currentUser);
                this.updateUIForLoggedIn();
                this.removeAuthOverlay();
            } catch (e) {
                console.error('解析用戶資料失敗:', e);
                this.updateUIForLoggedOut();
            }
        } else {
            console.log('用戶未登入');
            this.updateUIForLoggedOut();
        }
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
                    <p>登入以存取您的數據</p>
                </div>

                <form class="auth-form" id="login-form">
                    <div class="form-group">
                        <label for="login-email">電子郵件</label>
                        <input type="email" id="login-email" placeholder="your@email.com" required />
                    </div>

                    <div class="form-group">
                        <label for="login-password">密碼</label>
                        <input type="password" id="login-password" placeholder="輸入密碼" required />
                    </div>

                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="remember-me" />
                            <span>記住我</span>
                        </label>
                    </div>

                    <button type="submit" class="auth-btn primary">
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

        const availableCodes = Object.entries(this.registrationCodes)
            .filter(([code, info]) => info.isActive)
            .map(([code, info]) => {
                const remaining = info.maxUses > 0 ? info.maxUses - info.currentUses : '無限制';
                return `${code} (剩餘: ${remaining})`;
            })
            .join(', ');

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
                    <p>建立帳號以享受完整功能</p>
                </div>

                <form class="auth-form" id="register-form">
                    <div class="form-group">
                        <label for="register-username">用戶名稱</label>
                        <input type="text" id="register-username" placeholder="輸入用戶名稱" required />
                    </div>

                    <div class="form-group">
                        <label for="register-email">電子郵件</label>
                        <input type="email" id="register-email" placeholder="your@email.com" required />
                    </div>

                    <div class="form-group">
                        <label for="register-password">密碼</label>
                        <input type="password" id="register-password" placeholder="至少8個字符，需包含英文和數字" required />
                    </div>

                    <div class="form-group">
                        <label for="confirm-password">確認密碼</label>
                        <input type="password" id="confirm-password" placeholder="再次輸入密碼" required />
                    </div>

                    <div class="form-group">
                        <label for="register-code">註冊碼</label>
                        <input type="text" id="register-code" placeholder="請輸入有效的註冊碼" required />
                        <small>可用註冊碼：${availableCodes}</small>
                    </div>

                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="agree-terms" required />
                            <span>我同意服務條款和隱私政策</span>
                        </label>
                    </div>

                    <button type="submit" class="auth-btn primary">
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

    handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('remember-me').checked;

        if (!email || !password) {
            this.showAuthMessage('請填寫所有欄位', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showAuthMessage('請輸入有效的電子郵件格式', 'error');
            return;
        }

        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user || !this.verifyPassword(password, user.password)) {
            this.showAuthMessage('電子郵件或密碼錯誤', 'error');
            return;
        }

        // 登入成功
        this.currentUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            loginTime: new Date().toISOString()
        };

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));

        this.showAuthMessage('登入成功！', 'success');

        setTimeout(() => {
            this.removeExistingModal();
            this.updateUIForLoggedIn();
            this.removeAuthOverlay();
        }, 1500);
    },

    handleRegister(event) {
        event.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim().toLowerCase();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const registrationCode = document.getElementById('register-code').value.trim().toUpperCase();
        const agreeTerms = document.getElementById('agree-terms').checked;

        // 基本驗證
        if (!username || !email || !password || !confirmPassword || !registrationCode) {
            this.showAuthMessage('請填寫所有必填欄位', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showAuthMessage('請輸入有效的電子郵件格式', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showAuthMessage('密碼不匹配', 'error');
            return;
        }

        // 密碼強度驗證
        if (password.length < 8) {
            this.showAuthMessage('密碼至少需要8個字符', 'error');
            return;
        }

        if (!/(?=.*[a-zA-Z])/.test(password)) {
            this.showAuthMessage('密碼必須包含至少一個英文字母', 'error');
            return;
        }

        if (!/(?=.*\d)/.test(password)) {
            this.showAuthMessage('密碼必須包含至少一個數字', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showAuthMessage('請同意服務條款', 'error');
            return;
        }

        // 驗證註冊碼
        const codeValidation = this.validateRegistrationCode(registrationCode);
        if (!codeValidation.valid) {
            this.showAuthMessage(codeValidation.error, 'error');
            return;
        }

        // 檢查用戶是否已存在
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            this.showAuthMessage('此電子郵件已被註冊', 'error');
            return;
        }

        // 建立新用戶
        const newUser = {
            id: Date.now().toString(),
            username: username,
            email: email,
            password: this.hashPassword(password),
            registrationCode: registrationCode,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        // 增加註冊碼使用次數
        this.incrementCodeUsage(registrationCode);

        // 自動登入
        this.currentUser = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));

        this.showAuthMessage('註冊成功！歡迎使用', 'success');

        setTimeout(() => {
            this.removeExistingModal();
            this.updateUIForLoggedIn();
            this.removeAuthOverlay();
        }, 1500);
    },

    logout() {
        console.log('用戶登出');
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.updateUIForLoggedOut();
        this.showMessage('已成功登出', 'info');
    },

    // UI 更新方法
    updateUIForLoggedIn() {
        console.log('更新UI為已登入狀態');
        const statusElem = document.getElementById('subscription-status');
        if (statusElem && this.currentUser) {
            statusElem.innerHTML = `
                <div class="user-controls">
                    <div class="user-menu">
                        <button class="user-menu-btn" onclick="AuthManager.toggleUserDropdown()">
                            <i class="fas fa-user-circle"></i>
                            <span>${this.currentUser.username || this.currentUser.email}</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="user-dropdown" id="user-dropdown" style="display: none;">
                            <a href="#" onclick="AuthManager.showProfile(event)">
                                <i class="fas fa-user"></i> 個人資料
                            </a>
                            <a href="#" onclick="AuthManager.showSettings(event)">
                                <i class="fas fa-cog"></i> 設定
                            </a>
                            <hr>
                            <a href="#" onclick="AuthManager.logout()">
                                <i class="fas fa-sign-out-alt"></i> 登出
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
        this.removeAuthOverlay();
    },

    updateUIForLoggedOut() {
        console.log('更新UI為未登入狀態');
        const statusElem = document.getElementById('subscription-status');
        if (statusElem) {
            statusElem.innerHTML = `
                <button class="login-btn" onclick="AuthManager.showLoginModal()">
                    <i class="fas fa-sign-in-alt"></i> 登入
                </button>
                <button class="register-btn" onclick="AuthManager.showRegisterModal()">
                    <i class="fas fa-user-plus"></i> 註冊
                </button>
            `;
        }
    },

    toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    },

    showProfile(e) {
        e.preventDefault();
        this.toggleUserDropdown();
        if (typeof ProfileManager !== 'undefined' && ProfileManager.showProfileModal) {
            ProfileManager.showProfileModal();
        } else {
            alert('個人資料功能開發中');
        }
    },

    showSettings(e) {
        e.preventDefault();
        this.toggleUserDropdown();
        alert('設定功能開發中');
    },

    // 輔助方法
    removeExistingModal() {
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) {
            existingModal.remove();
        }
    },

    showAuthOverlay() {},

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
        console.log(`[${type.toUpperCase()}] ${message}`);
    },

    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    hashPassword(password) {
        return btoa(password);
    },

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    },

    // 管理功能
    getRegistrationCodeStats() {
        return Object.entries(this.registrationCodes).map(([code, info]) => ({
            code,
            description: info.description,
            maxUses: info.maxUses,
            currentUses: info.currentUses,
            remaining: info.maxUses > 0 ? info.maxUses - info.currentUses : '無限制',
            isActive: info.isActive,
            expiresAt: info.expiresAt
        }));
    }
};

// 使用混合版本 - 確保全域可用
if (typeof window !== 'undefined') {
    window.AuthManager = HybridAuthManager;

    // 等待 DOM 載入後自動初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            HybridAuthManager.init();
        });
    } else {
        HybridAuthManager.init();
    }
}

console.log('混合版 AuthManager 已載入並初始化');
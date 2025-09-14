// 用戶認證管理系統
const AuthManager = {
    STORAGE_KEY: 'meta_calculator_auth',
    USERS_KEY: 'meta_calculator_users',

    // 註冊碼（實際應用中應該從服務器獲取）
    VALID_REGISTRATION_CODES: [
        'EBM2025',
        'META2025',
        'RESEARCH2025',
        'ADMIN123'
    ],

    // 當前用戶
    currentUser: null,

    // 初始化
    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
    },

    // 檢查認證狀態
    checkAuthStatus() {
        const auth = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);
        if (auth) {
            this.currentUser = JSON.parse(auth);
            this.updateUIForLoggedIn();
            this.removeAuthOverlay();
        } else {
            this.updateUIForLoggedOut();
            this.showAuthOverlay();
        }
    },

    // 顯示登入模態
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.id = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <button class="auth-close-btn" onclick="AuthManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>

                <div class="auth-header">
                    <h2 id="auth-title">登入帳號</h2>
                    <p id="auth-subtitle">登入以存取您的數據</p>
                </div>

                <div id="login-form" class="auth-form">
                    <div class="form-group">
                        <label for="login-email">電子郵件</label>
                        <input
                            type="email"
                            id="login-email"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="login-password">密碼</label>
                        <input
                            type="password"
                            id="login-password"
                            placeholder="輸入密碼"
                            required
                        />
                    </div>

                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="remember-me" />
                            <span>記住我</span>
                        </label>
                        <a href="#" class="forgot-password" onclick="AuthManager.showForgotPassword(event)">
                            忘記密碼？
                        </a>
                    </div>

                    <button class="auth-btn primary" onclick="AuthManager.login()">
                        登入
                    </button>

                    <div class="auth-divider">
                        <span>或</span>
                    </div>

                    <button class="auth-btn google" onclick="AuthManager.googleLogin()">
                        <i class="fab fa-google"></i>
                        使用 Google 登入
                    </button>

                    <div class="auth-footer">
                        <p>還沒有帳號？
                            <a href="#" onclick="AuthManager.showRegisterForm(event)">立即註冊</a>
                        </p>
                    </div>
                </div>

                <div id="register-form" class="auth-form" style="display: none;">
                    <div class="form-group">
                        <label for="register-name">姓名 *</label>
                        <input
                            type="text"
                            id="register-name"
                            placeholder="您的姓名"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="register-email">電子郵件 *</label>
                        <input
                            type="email"
                            id="register-email"
                            placeholder="your@email.com"
                            required
                        />
                        <small class="field-hint">將作為登入帳號使用</small>
                    </div>

                    <div class="form-group">
                        <label for="register-password">密碼 *</label>
                        <input
                            type="password"
                            id="register-password"
                            placeholder="至少8個字符"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="confirm-password">確認密碼 *</label>
                        <input
                            type="password"
                            id="confirm-password"
                            placeholder="再次輸入密碼"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="registration-code">註冊碼 *</label>
                        <input
                            type="text"
                            id="registration-code"
                            placeholder="請輸入有效的註冊碼"
                            required
                        />
                        <small class="field-hint">需要有效的註冊碼才能建立帳號</small>
                    </div>

                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="agree-terms" required />
                            <span>我同意<a href="#">服務條款</a>和<a href="#">隱私政策</a></span>
                        </label>
                    </div>

                    <button class="auth-btn primary" onclick="AuthManager.register()">
                        註冊
                    </button>

                    <div class="auth-footer">
                        <p>已有帳號？
                            <a href="#" onclick="AuthManager.showLoginForm(event)">立即登入</a>
                        </p>
                    </div>
                </div>

                <div id="error-message" class="auth-error" style="display: none;"></div>
                <div id="success-message" class="auth-success" style="display: none;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加 ESC 鍵關閉
        document.addEventListener('keydown', this.handleEscKey);

        // 點擊背景關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    },

    // 顯示註冊表單
    showRegisterForm(e) {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('auth-title').textContent = '註冊新帳號';
        document.getElementById('auth-subtitle').textContent = '建立帳號以開始使用';
        this.hideMessages();
    },

    // 顯示登入表單
    showLoginForm(e) {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('auth-title').textContent = '登入帳號';
        document.getElementById('auth-subtitle').textContent = '登入以存取您的訂閱和數據';
        this.hideMessages();
    },

    // 關閉模態
    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.remove();
            document.removeEventListener('keydown', this.handleEscKey);
        }
    },

    // ESC 鍵處理
    handleEscKey(e) {
        if (e.key === 'Escape') {
            AuthManager.closeModal();
        }
    },

    // 登入
    async login() {
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('remember-me').checked;

        if (!email || !password) {
            this.showError('請填寫所有欄位');
            return;
        }

        // 驗證電子郵件格式
        if (!this.isValidEmail(email)) {
            this.showError('請輸入有效的電子郵件地址');
            return;
        }

        // 驗證用戶（使用電子郵件作為登入 ID）
        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            this.showError('此電子郵件尚未註冊');
            return;
        }

        if (!this.verifyPassword(password, user.password)) {
            this.showError('密碼錯誤');
            return;
        }

        // 設置認證
        this.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        if (remember) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
        } else {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
        }

        this.showSuccess('登入成功！');
        setTimeout(() => {
            this.closeModal();
            this.updateUIForLoggedIn();
            location.reload();
        }, 1000);
    },

    // 註冊
    async register() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim().toLowerCase();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const registrationCode = document.getElementById('registration-code').value.trim().toUpperCase();
        const agreeTerms = document.getElementById('agree-terms').checked;

        // 驗證
        if (!name || !email || !password || !confirmPassword || !registrationCode) {
            this.showError('請填寫所有必填欄位');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('密碼不匹配');
            return;
        }

        if (password.length < 8) {
            this.showError('密碼至少需要8個字符');
            return;
        }

        if (!this.VALID_REGISTRATION_CODES.includes(registrationCode)) {
            this.showError('註冊碼無效，請聯繫管理員取得有效的註冊碼');
            return;
        }

        if (!agreeTerms) {
            this.showError('請同意服務條款');
            return;
        }

        // 檢查郵件是否已存在
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            this.showError('此電子郵件已被註冊');
            return;
        }

        // 建立新用戶
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: this.hashPassword(password),
            registrationCode: registrationCode,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        // 自動登入
        this.currentUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));

        this.showSuccess('註冊成功！歡迎使用');
        setTimeout(() => {
            this.closeModal();
            this.updateUIForLoggedIn();
            location.reload();
        }, 1500);
    },

    // Google 登入
    googleLogin() {
        // 模擬 Google OAuth 流程
        this.showSuccess('正在使用 Google 登入...');

        // 模擬成功登入
        setTimeout(() => {
            this.currentUser = {
                id: 'google_' + Date.now(),
                name: 'Google User',
                email: 'user@gmail.com'
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
            this.closeModal();
            this.updateUIForLoggedIn();
            location.reload();
        }, 1500);
    },

    // 登出
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.updateUIForLoggedOut();
        location.reload();
    },

    // 更新UI - 已登入
    updateUIForLoggedIn() {
        const statusElem = document.getElementById('subscription-status');
        if (statusElem && this.currentUser) {
            const userMenu = `
                <div class="user-menu">
                    <button class="user-menu-btn" onclick="AuthManager.toggleUserDropdown()">
                        <i class="fas fa-user-circle"></i>
                        <span>${this.currentUser.name}</span>
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
            `;

            statusElem.innerHTML = userMenu;
        }
        this.removeAuthOverlay();
    },

    // 更新UI - 未登入
    updateUIForLoggedOut() {
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
        this.showAuthOverlay();
    },

    // 顯示註冊模態
    showRegisterModal() {
        this.showLoginModal();
        this.showRegisterForm({ preventDefault: () => {} });
    },

    // 切換用戶下拉選單
    toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    },

    // 顯示個人資料
    showProfile(e) {
        e.preventDefault();
        ProfileManager.showProfileModal();
    },


    // 顯示設定
    showSettings(e) {
        e.preventDefault();
        console.log('顯示設定');
    },

    // 顯示忘記密碼
    showForgotPassword(e) {
        e.preventDefault();
        this.showError('密碼重設功能開發中');
    },

    // 驗證電子郵件格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // 獲取所有用戶
    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    // 密碼哈希（簡單實現）
    hashPassword(password) {
        // 實際應用中應使用真正的加密方法
        return btoa(password);
    },

    // 驗證密碼
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    },

    // 顯示錯誤訊息
    showError(message) {
        const errorElem = document.getElementById('error-message');
        const successElem = document.getElementById('success-message');
        if (errorElem) {
            errorElem.textContent = message;
            errorElem.style.display = 'block';
            successElem.style.display = 'none';
            setTimeout(() => {
                errorElem.style.display = 'none';
            }, 3000);
        }
    },

    // 顯示成功訊息
    showSuccess(message) {
        const successElem = document.getElementById('success-message');
        const errorElem = document.getElementById('error-message');
        if (successElem) {
            successElem.textContent = message;
            successElem.style.display = 'block';
            errorElem.style.display = 'none';
        }
    },

    // 隱藏訊息
    hideMessages() {
        const errorElem = document.getElementById('error-message');
        const successElem = document.getElementById('success-message');
        if (errorElem) errorElem.style.display = 'none';
        if (successElem) successElem.style.display = 'none';
    },

    // 顯示認證遮罩
    showAuthOverlay() {
        const overlay = document.getElementById('auth-overlay');
        const mainContent = document.querySelector('.main-content');
        const navTabs = document.querySelector('.nav-tabs');

        if (overlay) {
            overlay.style.display = 'flex';
        }

        // 添加模糊效果到主要內容
        if (mainContent) {
            mainContent.classList.add('blur-content');
        }
        if (navTabs) {
            navTabs.classList.add('blur-content');
        }
    },

    // 移除認證遮罩
    removeAuthOverlay() {
        const overlay = document.getElementById('auth-overlay');
        const mainContent = document.querySelector('.main-content');
        const navTabs = document.querySelector('.nav-tabs');

        if (overlay) {
            overlay.style.display = 'none';
        }

        // 移除模糊效果
        if (mainContent) {
            mainContent.classList.remove('blur-content');
        }
        if (navTabs) {
            navTabs.classList.remove('blur-content');
        }
    },

    // 設置事件監聽器
    setupEventListeners() {
        // 點擊外部關閉下拉選單
        document.addEventListener('click', (e) => {
            const userMenu = document.querySelector('.user-menu');
            const dropdown = document.getElementById('user-dropdown');
            if (dropdown && !userMenu?.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 確保在其他腳本初始化前先初始化 AuthManager
    setTimeout(() => {
        AuthManager.init();
    }, 100);
});
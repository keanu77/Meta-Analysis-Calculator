// 簡化版 AuthManager 用於測試
const AuthManager = {
    STORAGE_KEY: 'meta_calculator_auth',
    USERS_KEY: 'meta_calculator_users',

    // 註冊碼
    VALID_REGISTRATION_CODES: [
        'EBM2025',
        'META2025',
        'RESEARCH2025',
        'ADMIN123'
    ],

    currentUser: null,

    init() {
        console.log('AuthManager 初始化...');
        this.checkAuthStatus();
        this.setupEventListeners();
    },

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

    showLoginModal() {
        console.log('顯示登入視窗');
        this.createModal('login');
    },

    showRegisterModal() {
        console.log('顯示註冊視窗');
        this.createModal('register');
    },

    createModal(type) {
        // 移除現有模態視窗
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.id = 'auth-modal';

        if (type === 'login') {
            modal.innerHTML = this.getLoginHTML();
        } else {
            modal.innerHTML = this.getRegisterHTML();
        }

        document.body.appendChild(modal);
        this.setupModalEvents(modal);
    },

    getLoginHTML() {
        return `
            <div class="auth-modal-content">
                <button class="auth-close-btn" onclick="AuthManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="auth-header">
                    <h2>登入帳號</h2>
                    <p>登入以存取您的數據</p>
                </div>
                <div class="auth-form">
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
                    <button class="auth-btn primary" onclick="AuthManager.login()">登入</button>
                    <div class="auth-footer">
                        <p>還沒有帳號？<a href="#" onclick="AuthManager.showRegisterModal(); return false;">立即註冊</a></p>
                    </div>
                </div>
                <div id="error-message" class="auth-error" style="display: none;"></div>
                <div id="success-message" class="auth-success" style="display: none;"></div>
            </div>
        `;
    },

    getRegisterHTML() {
        return `
            <div class="auth-modal-content">
                <button class="auth-close-btn" onclick="AuthManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="auth-header">
                    <h2>註冊新帳號</h2>
                    <p>建立帳號以開始使用</p>
                </div>
                <div class="auth-form">
                    <div class="form-group">
                        <label for="register-name">姓名 *</label>
                        <input type="text" id="register-name" placeholder="您的姓名" required />
                    </div>
                    <div class="form-group">
                        <label for="register-email">電子郵件 *</label>
                        <input type="email" id="register-email" placeholder="your@email.com" required />
                        <small class="field-hint">將作為登入帳號使用</small>
                    </div>
                    <div class="form-group">
                        <label for="register-password">密碼 *</label>
                        <input type="password" id="register-password" placeholder="至少8個字符" required />
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">確認密碼 *</label>
                        <input type="password" id="confirm-password" placeholder="再次輸入密碼" required />
                    </div>
                    <div class="form-group">
                        <label for="registration-code">註冊碼 *</label>
                        <input type="text" id="registration-code" placeholder="請輸入有效的註冊碼" required />
                        <small class="field-hint">需要有效的註冊碼才能建立帳號</small>
                    </div>
                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="agree-terms" required />
                            <span>我同意服務條款和隱私政策</span>
                        </label>
                    </div>
                    <button class="auth-btn primary" onclick="AuthManager.register()">註冊</button>
                    <div class="auth-footer">
                        <p>已有帳號？<a href="#" onclick="AuthManager.showLoginModal(); return false;">立即登入</a></p>
                    </div>
                </div>
                <div id="error-message" class="auth-error" style="display: none;"></div>
                <div id="success-message" class="auth-success" style="display: none;"></div>
            </div>
        `;
    },

    setupModalEvents(modal) {
        // ESC 鍵關閉
        document.addEventListener('keydown', this.handleEscKey.bind(this));

        // 點擊背景關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    },

    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.remove();
            document.removeEventListener('keydown', this.handleEscKey);
        }
    },

    handleEscKey(e) {
        if (e.key === 'Escape') {
            this.closeModal();
        }
    },

    async login() {
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showError('請填寫所有欄位');
            return;
        }

        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user || !this.verifyPassword(password, user.password)) {
            this.showError('電子郵件或密碼錯誤');
            return;
        }

        this.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
        this.showSuccess('登入成功！');

        setTimeout(() => {
            this.closeModal();
            this.updateUIForLoggedIn();
            location.reload();
        }, 1000);
    },

    async register() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim().toLowerCase();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const registrationCode = document.getElementById('registration-code').value.trim().toUpperCase();
        const agreeTerms = document.getElementById('agree-terms').checked;

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
            this.showError('註冊碼無效，請聯絡管理員取得有效的註冊碼');
            return;
        }

        if (!agreeTerms) {
            this.showError('請同意服務條款');
            return;
        }

        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            this.showError('此電子郵件已被註冊');
            return;
        }

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

    updateUIForLoggedIn() {
        const statusElem = document.getElementById('subscription-status');
        if (statusElem && this.currentUser) {
            statusElem.innerHTML = `
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
        }
        this.removeAuthOverlay();
    },

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

    showAuthOverlay() {
        const overlay = document.getElementById('auth-overlay');
        const mainContent = document.querySelector('.main-content');
        const navTabs = document.querySelector('.nav-tabs');

        if (overlay) {
            overlay.style.display = 'flex';
        }

        if (mainContent) {
            mainContent.classList.add('blur-content');
        }
        if (navTabs) {
            navTabs.classList.add('blur-content');
        }
    },

    removeAuthOverlay() {
        const overlay = document.getElementById('auth-overlay');
        const mainContent = document.querySelector('.main-content');
        const navTabs = document.querySelector('.nav-tabs');

        if (overlay) {
            overlay.style.display = 'none';
        }

        if (mainContent) {
            mainContent.classList.remove('blur-content');
        }
        if (navTabs) {
            navTabs.classList.remove('blur-content');
        }
    },

    toggleUserDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    },

    showProfile(e) {
        e.preventDefault();
        if (typeof ProfileManager !== 'undefined') {
            ProfileManager.showProfileModal();
        } else {
            alert('個人資料功能開發中');
        }
    },

    showSettings(e) {
        e.preventDefault();
        alert('設定功能開發中');
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.updateUIForLoggedOut();
        location.reload();
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

    showError(message) {
        const errorElem = document.getElementById('error-message');
        const successElem = document.getElementById('success-message');
        if (errorElem) {
            errorElem.textContent = message;
            errorElem.style.display = 'block';
            if (successElem) successElem.style.display = 'none';
            setTimeout(() => {
                errorElem.style.display = 'none';
            }, 3000);
        }
    },

    showSuccess(message) {
        const successElem = document.getElementById('success-message');
        const errorElem = document.getElementById('error-message');
        if (successElem) {
            successElem.textContent = message;
            successElem.style.display = 'block';
            if (errorElem) errorElem.style.display = 'none';
        }
    },

    setupEventListeners() {
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
    console.log('DOM 載入完成，初始化 AuthManager...');
    setTimeout(() => {
        AuthManager.init();
    }, 100);
});
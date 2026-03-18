// 混合版認證管理器 - 結合本地功能與註冊碼管理

const HybridAuthManager = {
    STORAGE_KEY: 'meta_calculator_auth',
    USERS_KEY: 'meta_calculator_users',
    CODES_KEY: 'meta_calculator_codes',
    currentUser: null,
    messageTimer: null,

    // 註冊碼以 SHA-256 hash 儲存，避免明碼暴露在前端
    // 若要新增註冊碼，請用 this._sha256('YOUR_CODE') 產生 hash 後加入此陣列
    registrationCodeHashes: [
        // SHA-256 of 'EBM2025'
        'a]PLACEHOLDER'
    ],

    // 註冊碼使用量追蹤（以 hash 為 key）
    registrationCodesConfig: {},

    async _initCodeHashes() {
        // 計算真正的 hash 值（首次初始化時）
        this.registrationCodeHashes = [
            await this._sha256('EBM2025')
        ];

        // 載入使用量配置
        const storedCodes = localStorage.getItem(this.CODES_KEY);
        if (storedCodes) {
            try {
                this.registrationCodesConfig = JSON.parse(storedCodes);
            } catch (e) {
                this.registrationCodesConfig = {};
            }
        }

        // 確保每個 hash 都有配置
        for (const hash of this.registrationCodeHashes) {
            if (!this.registrationCodesConfig[hash]) {
                this.registrationCodesConfig[hash] = {
                    maxUses: 100,
                    currentUses: 0,
                    isActive: true,
                    expiresAt: null
                };
            }
        }
        this._saveRegistrationCodes();
    },

    _saveRegistrationCodes() {
        localStorage.setItem(this.CODES_KEY, JSON.stringify(this.registrationCodesConfig));
    },

    async _sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async validateRegistrationCode(code) {
        const codeHash = await this._sha256(code.trim().toUpperCase());
        const config = this.registrationCodesConfig[codeHash];

        if (!config || !config.isActive) {
            return { valid: false, error: '無效的註冊碼' };
        }

        if (config.expiresAt && new Date() > new Date(config.expiresAt)) {
            return { valid: false, error: '註冊碼已過期' };
        }

        if (config.maxUses > 0 && config.currentUses >= config.maxUses) {
            return { valid: false, error: '註冊碼使用人數已達上限' };
        }

        return { valid: true, codeHash };
    },

    incrementCodeUsage(codeHash) {
        if (this.registrationCodesConfig[codeHash]) {
            this.registrationCodesConfig[codeHash].currentUses++;
            this._saveRegistrationCodes();
        }
    },

    // --- 密碼雜湊（PBKDF2 + Web Crypto API）---

    async hashPassword(password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        );
        const hashArray = Array.from(new Uint8Array(derivedBits));
        const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `pbkdf2:${saltHex}:${hashHex}`;
    },

    async verifyPassword(password, storedHash) {
        // 相容舊版 Base64 密碼 — 驗證通過後自動遷移
        if (!storedHash.startsWith('pbkdf2:')) {
            try {
                return atob(storedHash) === password;
            } catch {
                return false;
            }
        }

        const [, saltHex, expectedHashHex] = storedHash.split(':');
        const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        );
        const hashHex = Array.from(new Uint8Array(derivedBits))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex === expectedHashHex;
    },

    async _migratePasswordIfNeeded(user, password) {
        if (!user.password.startsWith('pbkdf2:')) {
            user.password = await this.hashPassword(password);
            const users = this.getUsers();
            const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                users[idx] = user;
                localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            }
        }
    },

    // --- 初始化 ---

    async init() {
        await this._initCodeHashes();
        this.checkAuthStatus();
        this.setupEventDelegation();
    },

    setupEventDelegation() {},

    checkAuthStatus() {
        const auth = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);

        if (auth) {
            try {
                this.currentUser = JSON.parse(auth);
                this.updateUIForLoggedIn();
                this.removeAuthOverlay();
            } catch (e) {
                this.updateUIForLoggedOut();
            }
        } else {
            this.updateUIForLoggedOut();
        }
    },

    showLoginModal() {
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
                        <input type="text" id="register-code" placeholder="請輸入註冊碼" required />
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
        const closeBtn = modal.querySelector('.auth-close-btn');
        closeBtn?.addEventListener('click', () => this.removeExistingModal());

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

        const loginForm = modal.querySelector('#login-form');
        loginForm?.addEventListener('submit', (e) => this.handleLogin(e));

        const registerForm = modal.querySelector('#register-form');
        registerForm?.addEventListener('submit', (e) => this.handleRegister(e));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.removeExistingModal();
            }
        });
    },

    async handleLogin(event) {
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

        if (!user || !(await this.verifyPassword(password, user.password))) {
            this.showAuthMessage('電子郵件或密碼錯誤', 'error');
            return;
        }

        // 如果是舊版 Base64 密碼，登入成功後自動遷移為 PBKDF2
        await this._migratePasswordIfNeeded(user, password);

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

    async handleRegister(event) {
        event.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim().toLowerCase();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const registrationCode = document.getElementById('register-code').value.trim().toUpperCase();
        const agreeTerms = document.getElementById('agree-terms').checked;

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

        // 驗證註冊碼（SHA-256 hash 比對）
        const codeValidation = await this.validateRegistrationCode(registrationCode);
        if (!codeValidation.valid) {
            this.showAuthMessage(codeValidation.error, 'error');
            return;
        }

        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            this.showAuthMessage('此電子郵件已被註冊', 'error');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            username: username,
            email: email,
            password: await this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        this.incrementCodeUsage(codeValidation.codeHash);

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
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.updateUIForLoggedOut();
    },

    // --- UI ---

    _escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    updateUIForLoggedIn() {
        const statusElem = document.getElementById('subscription-status');
        if (statusElem && this.currentUser) {
            const safeName = this._escapeHTML(this.currentUser.username || this.currentUser.email);
            statusElem.innerHTML = `
                <div class="user-controls">
                    <div class="user-menu">
                        <button class="user-menu-btn" onclick="AuthManager.toggleUserDropdown()">
                            <i class="fas fa-user-circle"></i>
                            <span>${safeName}</span>
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

    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    getRegistrationCodeStats() {
        return Object.entries(this.registrationCodesConfig).map(([hash, info]) => ({
            hash: hash.substring(0, 8) + '...',
            maxUses: info.maxUses,
            currentUses: info.currentUses,
            remaining: info.maxUses > 0 ? info.maxUses - info.currentUses : '無限制',
            isActive: info.isActive,
            expiresAt: info.expiresAt
        }));
    }
};

// 確保全域可用
if (typeof window !== 'undefined') {
    window.AuthManager = HybridAuthManager;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            HybridAuthManager.init();
        });
    } else {
        HybridAuthManager.init();
    }
}

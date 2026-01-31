// 修復版本的 AuthManager
console.log('載入 AuthManager...');

const AuthManager = {
    STORAGE_KEY: 'meta_calculator_auth',
    USERS_KEY: 'meta_calculator_users',
    VALID_REGISTRATION_CODES: ['EBM2025'],
    currentUser: null,
    messageTimer: null,

    init() {
        console.log('AuthManager 正在初始化...');
        this.checkAuthStatus();
        this.setupEventDelegation();
        console.log('AuthManager 初始化完成');
    },

    setupEventDelegation() {
        // 移除重複的事件委派，改由calculator.js的全域處理器統一處理
        console.log('AuthManager事件委派設定已移除，由calculator.js統一處理');
    },

    checkAuthStatus() {
        console.log('檢查認證狀態...');
        const auth = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);

        console.log('儲存的認證資料:', auth);

        if (auth) {
            try {
                this.currentUser = JSON.parse(auth);
                console.log('找到已登入用戶:', this.currentUser);
                this.updateUIForLoggedIn();
                this.removeAuthOverlay();
            } catch (e) {
                console.error('解析用戶資料失敗:', e);
                this.updateUIForLoggedOut();
                // 不顯示遮罩，讓用戶可以正常使用所有功能
                // this.showAuthOverlay();
            }
        } else {
            console.log('用戶未登入');
            this.updateUIForLoggedOut();
            // 移除自動顯示遮罩，讓用戶可以正常瀏覽頁面
            // this.showAuthOverlay();
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
        console.log('登入模態視窗已建立並顯示');
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
                    <p>建立帳號以開始使用</p>
                </div>

                <form class="auth-form" id="register-form">
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
        console.log('註冊模態視窗已建立並顯示');
    },

    removeExistingModal() {
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) {
            existingModal.remove();
            console.log('已移除現有模態視窗');
        }
    },

    setupModalEventHandlers(modal) {
        console.log('設置模態視窗事件處理器');

        // 關閉按鈕
        const closeBtn = modal.querySelector('.auth-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('點擊關閉按鈕');
                this.closeModal();
            });
        }

        // 點擊背景關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('點擊背景關閉');
                this.closeModal();
            }
        });

        // 防止模態視窗內容點擊事件冒泡
        const modalContent = modal.querySelector('.auth-modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // ESC 鍵關閉
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                console.log('ESC 鍵關閉');
                this.closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 表單提交處理
        const loginForm = modal.querySelector('#login-form');
        const registerForm = modal.querySelector('#register-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('提交登入表單');
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('提交註冊表單');
                this.handleRegister();
            });
        }

        // 切換表單
        const switchToRegister = modal.querySelector('#switch-to-register');
        const switchToLogin = modal.querySelector('#switch-to-login');

        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('切換到註冊表單');
                this.showRegisterModal();
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('切換到登入表單');
                this.showLoginModal();
            });
        }
    },

    closeModal() {
        console.log('關閉模態視窗');
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.remove();
        }
    },

    handleLogin() {
        console.log('處理登入...');

        const email = document.getElementById('login-email')?.value?.trim()?.toLowerCase();
        const password = document.getElementById('login-password')?.value;
        const remember = document.getElementById('remember-me')?.checked;

        if (!email || !password) {
            this.showMessage('請填寫所有欄位', 'error');
            return;
        }

        // 簡單的電子郵件格式驗證
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('請輸入有效的電子郵件格式', 'error');
            return;
        }

        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user || !this.verifyPassword(password, user.password)) {
            this.showMessage('電子郵件或密碼錯誤', 'error');
            return;
        }

        // 登入成功
        this.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));

        this.showMessage('登入成功！', 'success');
        console.log('登入成功，用戶:', this.currentUser);

        setTimeout(() => {
            this.closeModal();
            this.updateUIForLoggedIn();
            this.removeAuthOverlay();
            // Update tab access states after login
            if (typeof updateTabAccessStates === 'function') {
                updateTabAccessStates();
            }
        }, 1000);
    },

    handleRegister() {
        console.log('處理註冊...');

        const name = document.getElementById('register-name')?.value?.trim();
        const email = document.getElementById('register-email')?.value?.trim()?.toLowerCase();
        const password = document.getElementById('register-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        const registrationCode = document.getElementById('registration-code')?.value?.trim()?.toUpperCase();
        const agreeTerms = document.getElementById('agree-terms')?.checked;

        // 驗證
        if (!name || !email || !password || !confirmPassword || !registrationCode) {
            this.showMessage('請填寫所有必填欄位', 'error');
            return;
        }

        // 電子郵件格式驗證
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('請輸入有效的電子郵件格式', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('密碼不匹配', 'error');
            return;
        }

        // 更詳細的密碼強度驗證
        if (password.length < 8) {
            this.showMessage('密碼至少需要8個字符', 'error');
            return;
        }

        if (!/(?=.*[a-zA-Z])/.test(password)) {
            this.showMessage('密碼必須包含至少一個英文字母', 'error');
            return;
        }

        if (!/(?=.*\d)/.test(password)) {
            this.showMessage('密碼必須包含至少一個數字', 'error');
            return;
        }

        if (!this.VALID_REGISTRATION_CODES.includes(registrationCode)) {
            this.showMessage('註冊碼無效，請聯絡管理員取得有效的註冊碼', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showMessage('請同意服務條款', 'error');
            return;
        }

        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            this.showMessage('此電子郵件已被註冊', 'error');
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

        this.showMessage('註冊成功！歡迎使用', 'success');
        console.log('註冊成功，用戶:', this.currentUser);

        setTimeout(() => {
            this.closeModal();
            this.updateUIForLoggedIn();
            this.removeAuthOverlay();
            // Update tab access states after registration
            if (typeof updateTabAccessStates === 'function') {
                updateTabAccessStates();
            }
        }, 1500);
    },

    updateUIForLoggedIn() {
        console.log('更新UI為已登入狀態');
        const statusElem = document.getElementById('subscription-status');
        if (statusElem && this.currentUser) {
            statusElem.innerHTML = `
                <div class="user-controls">
                    <div class="user-menu">
                        <button class="user-menu-btn" onclick="AuthManager.toggleUserDropdown()">
                            <i class="fas fa-user-circle"></i>
                            <span>${this.currentUser.name}</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="user-dropdown" id="user-dropdown" style="display: none;">
                            <a href="#" data-action="show-profile">
                                <i class="fas fa-user"></i> 個人資料
                            </a>
                            <a href="#" data-action="show-settings">
                                <i class="fas fa-cog"></i> 設定
                            </a>
                            <hr>
                            <a href="#" data-action="logout">
                                <i class="fas fa-sign-out-alt"></i> 登出
                            </a>
                        </div>
                    </div>
                    <button class="logout-btn-direct" data-action="logout" onclick="console.log('登出按鈕被點擊'); window.AuthManager && window.AuthManager.logout()" title="登出">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>登出</span>
                    </button>
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
        // 不再自動顯示遮罩，讓用戶可以正常瀏覽頁面
        // this.showAuthOverlay();
    },

    showAuthOverlay() {
        console.log('顯示認證遮罩');
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
        console.log('移除認證遮罩');
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
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    },

    showProfile(e) {
        e.preventDefault();
        // Close the user dropdown
        this.toggleUserDropdown();

        // Show the profile modal using ProfileManager
        if (typeof ProfileManager !== 'undefined' && ProfileManager.showProfileModal) {
            ProfileManager.showProfileModal();
        } else {
            console.error('ProfileManager not available');
        }
    },

    showSettings(e) {
        e.preventDefault();
        alert('設定功能開發中');
    },

    logout() {
        console.log('🚪 logout() 函數被調用');

        // Close the user dropdown first
        try {
            this.toggleUserDropdown();
            console.log('✅ 用戶下拉選單已關閉');
        } catch (e) {
            console.warn('⚠️ 關閉用戶下拉選單時出錯:', e.message);
        }

        // Show confirmation modal
        console.log('🔔 準備顯示登出確認對話框');
        this.showLogoutConfirmation();
    },

    showLogoutConfirmation() {
        console.log('🔔 showLogoutConfirmation 被調用');

        // Remove any existing logout modals first
        const existingModals = document.querySelectorAll('.auth-modal');
        existingModals.forEach(modal => modal.remove());

        const modal = document.createElement('div');
        modal.className = 'auth-modal center-modal';
        modal.id = 'logout-confirmation-modal';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-header">
                    <h2><i class="fas fa-sign-out-alt"></i> 確認登出</h2>
                    <p>您確定要登出嗎？未儲存的資料可能會遺失。</p>
                </div>
                <div class="auth-buttons">
                    <button class="auth-btn primary" onclick="console.log('確定登出被點擊'); AuthManager.performLogout(); this.closest('.auth-modal').remove();">
                        <i class="fas fa-sign-out-alt"></i> 確定登出
                    </button>
                    <button class="auth-btn secondary" onclick="console.log('取消被點擊'); this.closest('.auth-modal').remove();">
                        <i class="fas fa-times"></i> 取消
                    </button>
                </div>
            </div>
        `;

        // Add click to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('點擊背景關閉模態視窗');
                modal.remove();
            }
        });

        console.log('🔔 將模態視窗添加到body');
        document.body.appendChild(modal);

        console.log('🔔 模態視窗已創建，ID:', modal.id);

        // Force a style recalculation
        modal.offsetHeight;
    },

    performLogout() {
        console.log('執行登出');
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_KEY);

        // Show logout success message briefly
        this.showMessage('已成功登出', 'success');

        // Update UI after a short delay
        setTimeout(() => {
            this.updateUIForLoggedOut();
            // Update tab access states after logout
            if (typeof updateTabAccessStates === 'function') {
                updateTabAccessStates();
            }
            // Redirect to guide tab if currently on restricted tab
            if (typeof checkTabAccess === 'function' && typeof currentTab !== 'undefined' && !checkTabAccess(currentTab)) {
                if (typeof switchTab === 'function') {
                    switchTab('module-guide');
                }
            }
        }, 1000);
    },

    showMessage(message, type = 'info') {
        console.log(`訊息 [${type}]: ${message}`);
        const messageElem = document.getElementById('auth-message');
        if (messageElem) {
            messageElem.textContent = message;
            messageElem.className = `auth-message ${type}`;
            messageElem.style.display = 'block';

            // 清除之前的定時器
            if (this.messageTimer) {
                clearTimeout(this.messageTimer);
            }

            // 設定自動隱藏
            if (type === 'success') {
                this.messageTimer = setTimeout(() => {
                    messageElem.style.display = 'none';
                }, 3000);
            } else if (type === 'info') {
                this.messageTimer = setTimeout(() => {
                    messageElem.style.display = 'none';
                }, 5000);
            } else if (type === 'error') {
                // 錯誤訊息保持顯示直到用戶操作
                this.messageTimer = setTimeout(() => {
                    messageElem.style.display = 'none';
                }, 8000);
            }
        }
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
    }
};

// 確保 DOM 載入後初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM 載入完成，初始化 AuthManager');
        AuthManager.init();
    });
} else {
    console.log('DOM 已經載入，立即初始化 AuthManager');
    AuthManager.init();
}

// 全域暴露
if (typeof window !== 'undefined') {
    // 使用更安全的方式暴露到全域
    Object.defineProperty(window, 'AuthManager', {
        value: AuthManager,
        writable: false,
        configurable: false
    });
}
console.log('AuthManager 載入完成並暴露到全域');
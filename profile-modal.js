// 個人資料管理模組
const ProfileManager = {
    // 顯示個人資料模態視窗
    showProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.id = 'profile-modal';
        modal.innerHTML = `
            <div class="profile-modal-content">
                <button class="profile-close-btn" onclick="ProfileManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>

                <div class="profile-header">
                    <i class="fas fa-user-circle profile-avatar"></i>
                    <h2>個人資料</h2>
                    <p>管理您的帳號資訊</p>
                </div>

                <div class="profile-form-container">
                    <form id="profile-form" class="profile-form">
                        <!-- 基本資料區塊 -->
                        <div class="profile-section">
                            <h3><i class="fas fa-user"></i> 基本資料</h3>

                            <div class="form-group">
                                <label for="profile-name">姓名</label>
                                <input
                                    type="text"
                                    id="profile-name"
                                    name="name"
                                    value="${AuthManager.currentUser?.name || ''}"
                                    required
                                />
                            </div>

                            <div class="form-group">
                                <label for="profile-email">電子郵件</label>
                                <input
                                    type="email"
                                    id="profile-email"
                                    name="email"
                                    value="${AuthManager.currentUser?.email || ''}"
                                    required
                                />
                            </div>

                            <div class="form-group">
                                <label>帳號建立時間</label>
                                <input
                                    type="text"
                                    value="${this.formatDate(this.getUserCreatedAt())}"
                                    disabled
                                    class="readonly-input"
                                />
                            </div>
                        </div>

                        <!-- 密碼變更區塊 -->
                        <div class="profile-section">
                            <h3><i class="fas fa-lock"></i> 變更密碼</h3>
                            <p class="section-description">留空表示不變更密碼</p>

                            <div class="form-group">
                                <label for="current-password">目前密碼</label>
                                <div class="password-input-wrapper">
                                    <input
                                        type="password"
                                        id="current-password"
                                        name="currentPassword"
                                        placeholder="輸入目前密碼以變更"
                                    />
                                    <button type="button" class="password-toggle" onclick="ProfileManager.togglePassword('current-password')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="new-password">新密碼</label>
                                <div class="password-input-wrapper">
                                    <input
                                        type="password"
                                        id="new-password"
                                        name="newPassword"
                                        placeholder="至少8個字符"
                                    />
                                    <button type="button" class="password-toggle" onclick="ProfileManager.togglePassword('new-password')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <div class="password-strength" id="password-strength" style="display: none;">
                                    <div class="strength-bar">
                                        <div class="strength-fill"></div>
                                    </div>
                                    <span class="strength-text">密碼強度：弱</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="confirm-new-password">確認新密碼</label>
                                <div class="password-input-wrapper">
                                    <input
                                        type="password"
                                        id="confirm-new-password"
                                        name="confirmNewPassword"
                                        placeholder="再次輸入新密碼"
                                    />
                                    <button type="button" class="password-toggle" onclick="ProfileManager.togglePassword('confirm-new-password')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 操作按鈕 -->
                        <div class="profile-actions">
                            <button type="button" class="btn-secondary" onclick="ProfileManager.closeModal()">
                                <i class="fas fa-times"></i> 取消
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> 儲存變更
                            </button>
                        </div>
                    </form>
                </div>

                <!-- 訊息顯示區 -->
                <div id="profile-message" class="profile-message" style="display: none;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // 設定事件監聽器
        this.setupEventListeners();

        // 添加 ESC 鍵關閉
        document.addEventListener('keydown', this.handleEscKey);

        // 點擊背景關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    },

    // 設定事件監聽器
    setupEventListeners() {
        const form = document.getElementById('profile-form');
        const newPasswordInput = document.getElementById('new-password');

        // 表單提交
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProfileUpdate();
        });

        // 密碼強度檢查
        newPasswordInput.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // 即時驗證
        form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });
    },

    // 處理個人資料更新
    async handleProfileUpdate() {
        const form = document.getElementById('profile-form');
        const formData = new FormData(form);

        const data = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
            confirmNewPassword: formData.get('confirmNewPassword')
        };

        // 驗證資料
        const validation = this.validateProfileData(data);
        if (!validation.valid) {
            this.showMessage(validation.message, 'error');
            return;
        }

        try {
            this.showMessage('正在更新資料...', 'info');

            // 更新基本資料
            await this.updateBasicInfo(data.name, data.email);

            // 如果有輸入新密碼，則更新密碼
            if (data.newPassword) {
                await this.updatePassword(data.currentPassword, data.newPassword);
            }

            this.showMessage('資料更新成功！', 'success');

            // 2秒後關閉模態視窗
            setTimeout(() => {
                this.closeModal();
                // 更新UI顯示的用戶名稱
                AuthManager.updateUIForLoggedIn();
            }, 2000);

        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    },

    // 驗證個人資料資料
    validateProfileData(data) {
        // 基本資料驗證
        if (!data.name || data.name.length < 2) {
            return { valid: false, message: '姓名至少需要2個字符' };
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            return { valid: false, message: '請輸入有效的電子郵件地址' };
        }

        // 密碼變更驗證
        if (data.newPassword || data.currentPassword || data.confirmNewPassword) {
            if (!data.currentPassword) {
                return { valid: false, message: '請輸入目前密碼以變更密碼' };
            }

            if (!data.newPassword) {
                return { valid: false, message: '請輸入新密碼' };
            }

            if (data.newPassword.length < 8) {
                return { valid: false, message: '新密碼至少需要8個字符' };
            }

            if (data.newPassword !== data.confirmNewPassword) {
                return { valid: false, message: '新密碼與確認密碼不匹配' };
            }
        }

        return { valid: true };
    },

    // 更新基本資料
    async updateBasicInfo(name, email) {
        // 檢查郵件是否已被其他用戶使用
        const users = this.getUsers();
        const existingUser = users.find(u => u.email === email && u.id !== AuthManager.currentUser.id);

        if (existingUser) {
            throw new Error('此電子郵件已被其他用戶使用');
        }

        // 更新用戶資料
        const userIndex = users.findIndex(u => u.id === AuthManager.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].name = name;
            users[userIndex].email = email;
            users[userIndex].updatedAt = new Date().toISOString();

            localStorage.setItem(AuthManager.USERS_KEY, JSON.stringify(users));

            // 更新當前用戶快取
            AuthManager.currentUser.name = name;
            AuthManager.currentUser.email = email;
            localStorage.setItem(AuthManager.STORAGE_KEY, JSON.stringify(AuthManager.currentUser));
        }
    },

    // 更新密碼
    async updatePassword(currentPassword, newPassword) {
        const users = this.getUsers();
        const user = users.find(u => u.id === AuthManager.currentUser.id);

        if (!user) {
            throw new Error('找不到用戶資料');
        }

        // 驗證目前密碼
        if (!AuthManager.verifyPassword(currentPassword, user.password)) {
            throw new Error('目前密碼錯誤');
        }

        // 更新密碼
        const userIndex = users.findIndex(u => u.id === AuthManager.currentUser.id);
        users[userIndex].password = AuthManager.hashPassword(newPassword);
        users[userIndex].updatedAt = new Date().toISOString();

        localStorage.setItem(AuthManager.USERS_KEY, JSON.stringify(users));
    },

    // 檢查密碼強度
    checkPasswordStrength(password) {
        const strengthElement = document.getElementById('password-strength');
        const fillElement = strengthElement.querySelector('.strength-fill');
        const textElement = strengthElement.querySelector('.strength-text');

        if (!password) {
            strengthElement.style.display = 'none';
            return;
        }

        strengthElement.style.display = 'block';

        let strength = 0;
        let strengthText = '弱';
        let strengthColor = '#ef4444';

        // 檢查密碼複雜度
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        switch (strength) {
            case 0:
            case 1:
                strengthText = '很弱';
                strengthColor = '#ef4444';
                break;
            case 2:
                strengthText = '弱';
                strengthColor = '#f59e0b';
                break;
            case 3:
                strengthText = '中等';
                strengthColor = '#eab308';
                break;
            case 4:
                strengthText = '強';
                strengthColor = '#22c55e';
                break;
            case 5:
                strengthText = '很強';
                strengthColor = '#16a34a';
                break;
        }

        fillElement.style.width = `${(strength / 5) * 100}%`;
        fillElement.style.backgroundColor = strengthColor;
        textElement.textContent = `密碼強度：${strengthText}`;
        textElement.style.color = strengthColor;
    },

    // 切換密碼顯示
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const toggle = input.parentElement.querySelector('.password-toggle i');

        if (input.type === 'password') {
            input.type = 'text';
            toggle.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            toggle.className = 'fas fa-eye';
        }
    },

    // 驗證欄位
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch (field.name) {
            case 'name':
                isValid = value.length >= 2;
                message = isValid ? '' : '姓名至少需要2個字符';
                break;
            case 'email':
                isValid = this.isValidEmail(value);
                message = isValid ? '' : '請輸入有效的電子郵件地址';
                break;
            case 'newPassword':
                if (value) {
                    isValid = value.length >= 8;
                    message = isValid ? '' : '密碼至少需要8個字符';
                }
                break;
            case 'confirmNewPassword':
                const newPassword = document.getElementById('new-password').value;
                if (value || newPassword) {
                    isValid = value === newPassword;
                    message = isValid ? '' : '密碼不匹配';
                }
                break;
        }

        // 顯示驗證結果
        this.showFieldValidation(field, isValid, message);
        return isValid;
    },

    // 顯示欄位驗證結果
    showFieldValidation(field, isValid, message) {
        field.classList.remove('field-valid', 'field-invalid');

        // 移除舊的錯誤訊息
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (field.value.trim() === '') {
            return; // 空值不顯示驗證狀態
        }

        if (isValid) {
            field.classList.add('field-valid');
        } else {
            field.classList.add('field-invalid');

            // 顯示錯誤訊息
            if (message) {
                const errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.textContent = message;
                field.parentElement.appendChild(errorElement);
            }
        }
    },

    // 驗證電子郵件格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '未知';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '未知';
        }
    },

    // 獲取用戶創建時間
    getUserCreatedAt() {
        if (AuthManager.currentUser?.createdAt) {
            return AuthManager.currentUser.createdAt;
        }

        // 如果當前用戶沒有創建時間，從完整用戶列表中查找
        const users = this.getUsers();
        const user = users.find(u => u.id === AuthManager.currentUser?.id);

        return user?.createdAt || null;
    },

    // 顯示訊息
    showMessage(message, type = 'info') {
        const messageElement = document.getElementById('profile-message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `profile-message ${type}`;
            messageElement.style.display = 'block';

            // 自動隱藏成功訊息
            if (type === 'success') {
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 3000);
            }
        }
    },

    // 獲取所有用戶
    getUsers() {
        const users = localStorage.getItem(AuthManager.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    // 關閉模態視窗
    closeModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.remove();
            document.removeEventListener('keydown', this.handleEscKey);
        }
    },

    // ESC 鍵處理
    handleEscKey(e) {
        if (e.key === 'Escape') {
            ProfileManager.closeModal();
        }
    }
};
// Firebase 認證管理器
import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

console.log('載入 Firebase AuthManager...');

const FirebaseAuthManager = {
  VALID_REGISTRATION_CODES: ['EBM2025', 'META2025', 'RESEARCH2025', 'ADMIN123'],
  currentUser: null,
  messageTimer: null,
  unsubscribeAuth: null,

  init() {
    console.log('FirebaseAuthManager 正在初始化...');
    this.setupAuthStateListener();
    this.setupEventDelegation();
    console.log('FirebaseAuthManager 初始化完成');
  },

  setupAuthStateListener() {
    // 監聽認證狀態變化
    this.unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('用戶已登入:', user.uid);
        await this.handleUserLogin(user);
      } else {
        console.log('用戶未登入');
        this.handleUserLogout();
      }
    });
  },

  async handleUserLogin(user) {
    try {
      // 從 Firestore 獲取用戶完整資料
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || userData.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          ...userData
        };

        // 更新最後登入時間
        await updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: serverTimestamp()
        });
      } else {
        // 如果用戶文檔不存在，創建基本資料
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL
        };
      }

      this.updateUIForLoggedIn();
      this.removeAuthOverlay();

    } catch (error) {
      console.error('處理用戶登入時發生錯誤:', error);
      this.showMessage('載入用戶資料時發生錯誤', 'error');
    }
  },

  handleUserLogout() {
    this.currentUser = null;
    this.updateUIForLoggedOut();
  },

  setupEventDelegation() {
    console.log('FirebaseAuthManager 事件委派已設定');
  },

  showLoginModal() {
    console.log('顯示 Firebase 登入模態視窗');
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
          <p>使用 Firebase 安全認證</p>
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
    console.log('顯示 Firebase 註冊模態視窗');
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
          <p>建立帳號享受雲端同步功能</p>
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
            <input type="password" id="register-password" placeholder="至少6個字符" required />
          </div>

          <div class="form-group">
            <label for="register-code">註冊碼</label>
            <input type="text" id="register-code" placeholder="請輸入註冊碼" required />
            <small>有效註冊碼：EBM2025, META2025, RESEARCH2025, ADMIN123</small>
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

  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      this.showAuthMessage('請填寫所有必填欄位', 'error');
      return;
    }

    this.showAuthMessage('正在登入...', 'info');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase 登入成功:', userCredential.user);

      this.showAuthMessage('登入成功！', 'success');

      setTimeout(() => {
        this.removeExistingModal();
      }, 1500);

    } catch (error) {
      console.error('Firebase 登入失敗:', error);

      let errorMessage = '登入失敗';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '找不到此電子郵件對應的帳號';
          break;
        case 'auth/wrong-password':
          errorMessage = '密碼錯誤';
          break;
        case 'auth/invalid-email':
          errorMessage = '電子郵件格式不正確';
          break;
        case 'auth/too-many-requests':
          errorMessage = '登入嘗試次數過多，請稍後再試';
          break;
        default:
          errorMessage = error.message || '登入時發生未知錯誤';
      }

      this.showAuthMessage(errorMessage, 'error');
    }
  },

  async handleRegister(event) {
    event.preventDefault();

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

    if (!this.VALID_REGISTRATION_CODES.includes(registrationCode)) {
      this.showAuthMessage('無效的註冊碼', 'error');
      return;
    }

    this.showAuthMessage('正在註冊...', 'info');

    try {
      // 檢查註冊碼是否已被使用（可選）
      // const existingUser = await this.checkRegistrationCodeUsage(registrationCode);

      // 創建 Firebase 用戶
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 更新用戶顯示名稱
      await updateProfile(user, {
        displayName: username
      });

      // 在 Firestore 中創建用戶文檔
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        displayName: username,
        profile: {
          institution: '',
          department: '',
          researchField: '',
          bio: ''
        },
        settings: {
          language: 'zh-TW',
          theme: 'light',
          decimalPlaces: 4,
          autoSave: true,
          emailNotifications: true
        },
        subscription: {
          plan: 'FREE',
          registrationCode: registrationCode,
          startDate: serverTimestamp()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      console.log('Firebase 註冊成功:', user);
      this.showAuthMessage('註冊成功！歡迎加入！', 'success');

      setTimeout(() => {
        this.removeExistingModal();
      }, 1500);

    } catch (error) {
      console.error('Firebase 註冊失敗:', error);

      let errorMessage = '註冊失敗';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '此電子郵件已被註冊';
          break;
        case 'auth/invalid-email':
          errorMessage = '電子郵件格式不正確';
          break;
        case 'auth/weak-password':
          errorMessage = '密碼強度太弱，請使用更複雜的密碼';
          break;
        default:
          errorMessage = error.message || '註冊時發生未知錯誤';
      }

      this.showAuthMessage(errorMessage, 'error');
    }
  },

  async logout() {
    console.log('Firebase 用戶登出');

    try {
      await signOut(auth);
      this.showMessage('已成功登出', 'info');
    } catch (error) {
      console.error('登出時發生錯誤:', error);
      this.showMessage('登出時發生錯誤', 'error');
    }
  },

  async changePassword(currentPassword, newPassword) {
    if (!this.currentUser) {
      throw new Error('用戶未登入');
    }

    try {
      // 重新認證用戶
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 更新密碼
      await updatePassword(auth.currentUser, newPassword);

      console.log('密碼修改成功');
      return { success: true, message: '密碼修改成功' };

    } catch (error) {
      console.error('修改密碼失敗:', error);

      let errorMessage = '修改密碼失敗';
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = '當前密碼錯誤';
          break;
        case 'auth/weak-password':
          errorMessage = '新密碼強度太弱';
          break;
        default:
          errorMessage = error.message || '修改密碼時發生未知錯誤';
      }

      throw new Error(errorMessage);
    }
  },

  // UI 更新方法保持與原版本相同
  updateUIForLoggedIn() {
    console.log('更新UI為已登入狀態');
    const userBtn = document.getElementById('user-btn');
    const loginBtn = document.getElementById('login-btn');

    if (userBtn && this.currentUser) {
      userBtn.style.display = 'flex';
      const displayName = this.currentUser.displayName || this.currentUser.email;
      userBtn.querySelector('span').textContent = displayName;
    }

    if (loginBtn) {
      loginBtn.style.display = 'none';
    }
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
  },

  // 輔助方法
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
    console.log(`[${type.toUpperCase()}] ${message}`);

    if (window.showNotification) {
      window.showNotification(message, type);
    }
  },

  // 清理方法
  destroy() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  }
};

// 導出 Firebase 版本
window.AuthManager = FirebaseAuthManager;
export default FirebaseAuthManager;

console.log('Firebase AuthManager 已載入');
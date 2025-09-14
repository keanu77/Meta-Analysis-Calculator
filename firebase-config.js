// Firebase 配置文件
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase 配置 - 請替換為您的實際配置
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務
const auth = getAuth(app);
const db = getFirestore(app);

// 開發環境模擬器設定 (可選)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // 檢查是否已連接模擬器
  if (!auth._delegate._config.emulator) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    } catch (error) {
      console.warn('Auth emulator already connected or not available');
    }
  }

  if (!db._delegate._databaseId.projectId.includes('demo-')) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      console.warn('Firestore emulator already connected or not available');
    }
  }
}

console.log('🔥 Firebase 已初始化');
console.log('📧 Auth Domain:', firebaseConfig.authDomain);
console.log('🗄️ Project ID:', firebaseConfig.projectId);

// 導出服務實例
export { auth, db };
export default app;
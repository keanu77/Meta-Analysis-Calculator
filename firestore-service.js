// Firestore 數據服務管理器
import { auth, db } from './firebase-config.js';
import {
  doc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

console.log('載入 Firestore 服務管理器...');

class FirestoreService {
  constructor() {
    this.currentUser = null;
    this.listeners = new Map(); // 儲存即時監聽器
  }

  // 設定當前用戶
  setCurrentUser(user) {
    this.currentUser = user;
  }

  // 獲取當前用戶ID
  getCurrentUserId() {
    return this.currentUser?.uid || auth.currentUser?.uid;
  }

  // ===================
  // 用戶資料管理
  // ===================

  // 創建用戶檔案
  async createUserProfile(userData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const userRef = doc(db, 'users', userId);
    const userDoc = {
      email: userData.email,
      displayName: userData.displayName,
      profile: {
        institution: userData.institution || '',
        department: userData.department || '',
        researchField: userData.researchField || '',
        bio: userData.bio || ''
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
        registrationCode: userData.registrationCode,
        startDate: serverTimestamp()
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };

    await setDoc(userRef, userDoc);
    return userDoc;
  }

  // 獲取用戶資料
  async getUserProfile() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      throw new Error('用戶資料不存在');
    }
  }

  // 更新用戶資料
  async updateUserProfile(updates) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const userRef = doc(db, 'users', userId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updateData);
    return updateData;
  }

  // 更新用戶設定
  async updateUserSettings(settings) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'settings': settings,
      updatedAt: serverTimestamp()
    });

    return settings;
  }

  // ===================
  // 計算記錄管理
  // ===================

  // 儲存計算結果
  async saveCalculation(calculationData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const calculationsRef = collection(db, 'users', userId, 'calculations');
    const calculation = {
      title: calculationData.title || '未命名計算',
      notes: calculationData.notes || '',
      calculationType: calculationData.calculationType,
      inputData: calculationData.inputData,
      results: calculationData.results,
      tags: calculationData.tags || [],
      isFavorite: false,
      folder: calculationData.folder || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(calculationsRef, calculation);

    // 更新統計數據
    await this.updateCalculationStatistics(calculationData.calculationType);

    return { id: docRef.id, ...calculation };
  }

  // 獲取計算歷史
  async getCalculationHistory(options = {}) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const calculationsRef = collection(db, 'users', userId, 'calculations');
    let q = query(calculationsRef, orderBy('createdAt', 'desc'));

    // 添加篩選條件
    if (options.calculationType) {
      q = query(q, where('calculationType', '==', options.calculationType));
    }

    if (options.isFavorite) {
      q = query(q, where('isFavorite', '==', true));
    }

    if (options.folder) {
      q = query(q, where('folder', '==', options.folder));
    }

    // 添加分頁
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }

    const querySnapshot = await getDocs(q);
    const calculations = [];

    querySnapshot.forEach((doc) => {
      calculations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return calculations;
  }

  // 獲取單一計算記錄
  async getCalculation(calculationId) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const calcRef = doc(db, 'users', userId, 'calculations', calculationId);
    const calcSnap = await getDoc(calcRef);

    if (calcSnap.exists()) {
      return { id: calcSnap.id, ...calcSnap.data() };
    } else {
      throw new Error('計算記錄不存在');
    }
  }

  // 更新計算記錄
  async updateCalculation(calculationId, updates) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const calcRef = doc(db, 'users', userId, 'calculations', calculationId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(calcRef, updateData);
    return updateData;
  }

  // 刪除計算記錄
  async deleteCalculation(calculationId) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const calcRef = doc(db, 'users', userId, 'calculations', calculationId);
    await deleteDoc(calcRef);

    return { success: true, message: '計算記錄已刪除' };
  }

  // 批量刪除計算記錄
  async deleteCalculations(calculationIds) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const batch = writeBatch(db);

    calculationIds.forEach((id) => {
      const calcRef = doc(db, 'users', userId, 'calculations', id);
      batch.delete(calcRef);
    });

    await batch.commit();
    return { success: true, message: `已刪除 ${calculationIds.length} 個計算記錄` };
  }

  // ===================
  // 資料夾管理
  // ===================

  // 創建資料夾
  async createFolder(folderData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const foldersRef = collection(db, 'users', userId, 'folders');
    const folder = {
      name: folderData.name,
      description: folderData.description || '',
      color: folderData.color || '#3B82F6',
      calculationCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(foldersRef, folder);
    return { id: docRef.id, ...folder };
  }

  // 獲取資料夾列表
  async getFolders() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const foldersRef = collection(db, 'users', userId, 'folders');
    const q = query(foldersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const folders = [];
    querySnapshot.forEach((doc) => {
      folders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return folders;
  }

  // 更新資料夾
  async updateFolder(folderId, updates) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const folderRef = doc(db, 'users', userId, 'folders', folderId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(folderRef, updateData);
    return updateData;
  }

  // 刪除資料夾
  async deleteFolder(folderId) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    // 首先將該資料夾中的計算記錄移出
    const calculationsRef = collection(db, 'users', userId, 'calculations');
    const q = query(calculationsRef, where('folder', '==', folderId));
    const calculations = await getDocs(q);

    const batch = writeBatch(db);

    // 清除計算記錄的資料夾引用
    calculations.forEach((doc) => {
      batch.update(doc.ref, { folder: null });
    });

    // 刪除資料夾
    const folderRef = doc(db, 'users', userId, 'folders', folderId);
    batch.delete(folderRef);

    await batch.commit();
    return { success: true, message: '資料夾已刪除' };
  }

  // ===================
  // 統計功能
  // ===================

  // 更新計算統計
  async updateCalculationStatistics(calculationType) {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const statsRef = doc(db, 'statistics', 'users', userId);
    const today = new Date().toISOString().split('T')[0];

    try {
      await setDoc(statsRef, {
        totalCalculations: increment(1),
        [`calculationsByType.${calculationType}`]: increment(1),
        [`dailyUsage.${today}`]: increment(1),
        lastCalculationDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn('更新統計數據失敗:', error);
    }
  }

  // 獲取用戶統計
  async getUserStatistics() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    try {
      const statsRef = doc(db, 'statistics', 'users', userId);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        return statsSnap.data();
      } else {
        // 如果統計不存在，返回默認值
        return {
          totalCalculations: 0,
          calculationsByType: {},
          dailyUsage: {},
          monthlyUsage: {},
          lastCalculationDate: null
        };
      }
    } catch (error) {
      console.error('獲取統計數據失敗:', error);
      throw new Error('無法獲取統計數據');
    }
  }

  // ===================
  // 即時監聽功能
  // ===================

  // 監聽計算記錄變化
  listenToCalculations(callback, options = {}) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const calculationsRef = collection(db, 'users', userId, 'calculations');
    let q = query(calculationsRef, orderBy('createdAt', 'desc'));

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const calculations = [];
      querySnapshot.forEach((doc) => {
        calculations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      callback(calculations);
    });

    // 儲存監聽器以便後續清理
    this.listeners.set('calculations', unsubscribe);
    return unsubscribe;
  }

  // 監聽用戶資料變化
  listenToUserProfile(callback) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });

    this.listeners.set('userProfile', unsubscribe);
    return unsubscribe;
  }

  // ===================
  // 數據匯出/匯入
  // ===================

  // 匯出用戶所有數據
  async exportUserData() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    const userData = await this.getUserProfile();
    const calculations = await this.getCalculationHistory();
    const folders = await this.getFolders();
    const statistics = await this.getUserStatistics();

    return {
      profile: userData,
      calculations,
      folders,
      statistics,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // 清理所有監聽器
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // ===================
  // 搜尋功能
  // ===================

  // 搜尋計算記錄
  async searchCalculations(searchTerm, options = {}) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('用戶未登入');

    // 注意：Firestore 不支援全文搜尋，這是簡化版搜尋
    // 實際應用中可考慮使用 Algolia 或 Elasticsearch
    const calculations = await this.getCalculationHistory(options);

    return calculations.filter(calc => {
      const searchText = searchTerm.toLowerCase();
      return (
        calc.title?.toLowerCase().includes(searchText) ||
        calc.notes?.toLowerCase().includes(searchText) ||
        calc.calculationType?.toLowerCase().includes(searchText) ||
        calc.tags?.some(tag => tag.toLowerCase().includes(searchText))
      );
    });
  }
}

// 創建全域實例
const firestoreService = new FirestoreService();

// 監聽認證狀態變化，更新當前用戶
import('./auth-firebase.js').then(() => {
  import('./firebase-config.js').then(({ auth }) => {
    import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js').then(({ onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        firestoreService.setCurrentUser(user);
      });
    });
  });
});

// 暴露到全域
window.firestoreService = firestoreService;
export default firestoreService;

console.log('Firestore 服務管理器已載入');
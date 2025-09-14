// Firebase 整合的計算器功能增強
console.log('載入 Firebase 計算器增強功能...');

// 等待 Firestore 服務載入
const waitForFirestore = () => {
  return new Promise((resolve) => {
    if (window.firestoreService) {
      resolve(window.firestoreService);
    } else {
      const checkInterval = setInterval(() => {
        if (window.firestoreService) {
          clearInterval(checkInterval);
          resolve(window.firestoreService);
        }
      }, 100);
    }
  });
};

// Firebase 計算器增強管理器
class CalculatorFirebaseManager {
  constructor() {
    this.firestoreService = null;
    this.currentUser = null;
    this.autoSaveEnabled = true;
    this.autoSaveDelay = 2000; // 2秒延遲
    this.autoSaveTimer = null;
  }

  async init() {
    console.log('初始化 Firebase 計算器功能...');

    try {
      this.firestoreService = await waitForFirestore();
      this.setupAutoSave();
      this.setupCalculationButtons();
      this.setupHistoryPanel();

      // 監聽認證狀態
      if (window.AuthManager) {
        this.setupAuthListener();
      }

      console.log('Firebase 計算器功能初始化完成');
    } catch (error) {
      console.error('Firebase 計算器功能初始化失敗:', error);
    }
  }

  setupAuthListener() {
    // 監聽用戶登入/登出狀態
    const originalUpdateUIForLoggedIn = window.AuthManager.updateUIForLoggedIn;
    const originalUpdateUIForLoggedOut = window.AuthManager.updateUIForLoggedOut;

    window.AuthManager.updateUIForLoggedIn = () => {
      originalUpdateUIForLoggedIn.call(window.AuthManager);
      this.currentUser = window.AuthManager.currentUser;
      this.onUserLogin();
    };

    window.AuthManager.updateUIForLoggedOut = () => {
      originalUpdateUIForLoggedOut.call(window.AuthManager);
      this.currentUser = null;
      this.onUserLogout();
    };
  }

  onUserLogin() {
    console.log('用戶已登入，啟用雲端功能');
    this.showCloudFeatures();
    this.loadUserSettings();
  }

  onUserLogout() {
    console.log('用戶已登出，隱藏雲端功能');
    this.hideCloudFeatures();
  }

  showCloudFeatures() {
    // 顯示雲端相關的UI元素
    const cloudElements = document.querySelectorAll('.cloud-feature');
    cloudElements.forEach(el => el.style.display = 'block');

    // 添加儲存按鈕到計算結果
    this.addSaveButtons();
  }

  hideCloudFeatures() {
    // 隱藏雲端相關的UI元素
    const cloudElements = document.querySelectorAll('.cloud-feature');
    cloudElements.forEach(el => el.style.display = 'none');

    // 移除儲存按鈕
    this.removeSaveButtons();
  }

  addSaveButtons() {
    // 為每個計算結果區域添加儲存按鈕
    const resultAreas = document.querySelectorAll('.result');

    resultAreas.forEach(area => {
      if (!area.querySelector('.save-calculation-btn')) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-calculation-btn cloud-feature';
        saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> 儲存到雲端';
        saveBtn.style.marginTop = '10px';

        saveBtn.addEventListener('click', () => {
          this.saveCurrentCalculation(area);
        });

        area.appendChild(saveBtn);
      }
    });
  }

  removeSaveButtons() {
    const saveButtons = document.querySelectorAll('.save-calculation-btn');
    saveButtons.forEach(btn => btn.remove());
  }

  async saveCurrentCalculation(resultArea) {
    if (!this.currentUser || !this.firestoreService) {
      this.showMessage('請先登入以儲存計算結果', 'warning');
      return;
    }

    try {
      // 獲取當前活躍的標籤頁
      const activeTab = document.querySelector('.tab-content.active');
      if (!activeTab) return;

      const calculationType = this.getCalculationTypeFromTab(activeTab);
      const inputData = this.extractInputData(activeTab);
      const results = this.extractResults(resultArea);

      if (!results || Object.keys(results).length === 0) {
        this.showMessage('沒有可儲存的計算結果', 'warning');
        return;
      }

      const calculationData = {
        calculationType,
        inputData,
        results,
        title: this.generateCalculationTitle(calculationType, results),
        notes: ''
      };

      const savedCalculation = await this.firestoreService.saveCalculation(calculationData);

      this.showMessage('計算結果已儲存到雲端', 'success');
      console.log('計算已儲存:', savedCalculation);

      // 更新儲存按鈕狀態
      const saveBtn = resultArea.querySelector('.save-calculation-btn');
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-check"></i> 已儲存';
        saveBtn.disabled = true;

        setTimeout(() => {
          saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> 儲存到雲端';
          saveBtn.disabled = false;
        }, 3000);
      }

    } catch (error) {
      console.error('儲存計算結果失敗:', error);
      this.showMessage('儲存失敗: ' + error.message, 'error');
    }
  }

  getCalculationTypeFromTab(tabElement) {
    // 根據標籤頁ID確定計算類型
    const tabId = tabElement.id;

    if (tabId.includes('effect-size')) return 'effect_size';
    if (tabId.includes('confidence')) return 'confidence_interval';
    if (tabId.includes('sample-size')) return 'sample_size';
    if (tabId.includes('power')) return 'power_analysis';

    return 'unknown';
  }

  extractInputData(tabElement) {
    const inputs = tabElement.querySelectorAll('input, select');
    const inputData = {};

    inputs.forEach(input => {
      if (input.value && input.id) {
        inputData[input.id] = input.type === 'number' ?
          parseFloat(input.value) : input.value;
      }
    });

    return inputData;
  }

  extractResults(resultArea) {
    const results = {};

    // 尋找結果文字
    const resultTexts = resultArea.querySelectorAll('p, div');

    resultTexts.forEach(element => {
      const text = element.textContent;

      // 解析效果值
      const effectSizeMatch = text.match(/效果值.*?([+-]?\d+\.?\d*)/);
      if (effectSizeMatch) {
        results.effectSize = parseFloat(effectSizeMatch[1]);
      }

      // 解析信賴區間
      const ciMatch = text.match(/信賴區間.*?\[([+-]?\d+\.?\d*),\s*([+-]?\d+\.?\d*)\]/);
      if (ciMatch) {
        results.confidenceInterval = [parseFloat(ciMatch[1]), parseFloat(ciMatch[2])];
      }

      // 解析樣本大小
      const sampleSizeMatch = text.match(/樣本大小.*?(\d+)/);
      if (sampleSizeMatch) {
        results.sampleSize = parseInt(sampleSizeMatch[1]);
      }

      // 解析檢驗力
      const powerMatch = text.match(/檢驗力.*?([+-]?\d+\.?\d*)/);
      if (powerMatch) {
        results.power = parseFloat(powerMatch[1]);
      }
    });

    return results;
  }

  generateCalculationTitle(calculationType, results) {
    const typeNames = {
      'effect_size': '效果值轉換',
      'confidence_interval': '信賴區間計算',
      'sample_size': '樣本大小估算',
      'power_analysis': '檢驗力分析'
    };

    const typeName = typeNames[calculationType] || '計算結果';
    const timestamp = new Date().toLocaleDateString('zh-TW');

    return `${typeName} - ${timestamp}`;
  }

  setupAutoSave() {
    if (!this.autoSaveEnabled) return;

    // 監聽所有輸入變化
    document.addEventListener('input', (event) => {
      if (event.target.matches('input[type="number"], input[type="text"], select')) {
        this.scheduleAutoSave();
      }
    });
  }

  scheduleAutoSave() {
    if (!this.currentUser || !this.autoSaveEnabled) return;

    // 清除之前的定時器
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // 設定新的自動儲存定時器
    this.autoSaveTimer = setTimeout(() => {
      this.performAutoSave();
    }, this.autoSaveDelay);
  }

  async performAutoSave() {
    // 這裡可以實作自動儲存邏輯
    // 例如儲存當前的輸入狀態到用戶設定中
    console.log('執行自動儲存...');
  }

  async loadUserSettings() {
    if (!this.currentUser || !this.firestoreService) return;

    try {
      const userProfile = await this.firestoreService.getUserProfile();
      const settings = userProfile.settings;

      if (settings) {
        // 應用用戶設定
        this.applyUserSettings(settings);
      }
    } catch (error) {
      console.error('載入用戶設定失敗:', error);
    }
  }

  applyUserSettings(settings) {
    // 應用小數點位數設定
    if (settings.decimalPlaces) {
      window.calculatorSettings = window.calculatorSettings || {};
      window.calculatorSettings.decimalPlaces = settings.decimalPlaces;
    }

    // 應用自動儲存設定
    this.autoSaveEnabled = settings.autoSave !== false;

    // 應用主題設定
    if (settings.theme) {
      document.body.className = `theme-${settings.theme}`;
    }
  }

  setupCalculationButtons() {
    // 增強現有的計算按鈕
    const calcButtons = document.querySelectorAll('.calc-btn');

    calcButtons.forEach(button => {
      const originalClick = button.onclick;

      button.onclick = function(event) {
        // 執行原始計算邏輯
        if (originalClick) {
          originalClick.call(this, event);
        }

        // 如果用戶已登入，顯示儲存選項
        if (window.calculatorFirebase && window.calculatorFirebase.currentUser) {
          setTimeout(() => {
            window.calculatorFirebase.showSaveOption();
          }, 500);
        }
      };
    });
  }

  showSaveOption() {
    // 在結果顯示後提示用戶儲存
    const resultAreas = document.querySelectorAll('.result:not(:empty)');

    resultAreas.forEach(area => {
      if (!area.querySelector('.save-prompt')) {
        const prompt = document.createElement('div');
        prompt.className = 'save-prompt';
        prompt.innerHTML = `
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 10px; margin-top: 10px;">
            <p style="margin: 0 0 8px 0; color: #0369a1;">
              <i class="fas fa-cloud-upload-alt"></i> 要將此計算結果儲存到雲端嗎？
            </p>
            <button onclick="window.calculatorFirebase.saveCurrentCalculation(this.closest('.result'))"
                    class="btn-small" style="background: #0ea5e9; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
              儲存
            </button>
            <button onclick="this.parentElement.parentElement.remove()"
                    class="btn-small" style="background: #6b7280; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 8px;">
              稍後
            </button>
          </div>
        `;
        area.appendChild(prompt);
      }
    });
  }

  setupHistoryPanel() {
    // 如果有歷史面板，設定 Firebase 數據載入
    const historyPanel = document.getElementById('history-panel');
    if (historyPanel && this.currentUser) {
      this.loadCalculationHistory();
    }
  }

  async loadCalculationHistory() {
    if (!this.firestoreService || !this.currentUser) return;

    try {
      const calculations = await this.firestoreService.getCalculationHistory({ limit: 10 });
      this.displayCalculationHistory(calculations);
    } catch (error) {
      console.error('載入計算歷史失敗:', error);
    }
  }

  displayCalculationHistory(calculations) {
    // 這裡可以實作歷史記錄的顯示邏輯
    console.log('載入的計算歷史:', calculations);
  }

  showMessage(message, type = 'info') {
    // 顯示系統消息
    console.log(`[${type.toUpperCase()}] ${message}`);

    // 如果有全域通知系統，使用它
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      // 簡單的提示顯示
      alert(message);
    }
  }
}

// 創建全域實例
const calculatorFirebase = new CalculatorFirebaseManager();

// 等待 DOM 載入完成後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    calculatorFirebase.init();
  });
} else {
  calculatorFirebase.init();
}

// 暴露到全域
window.calculatorFirebase = calculatorFirebase;

console.log('Firebase 計算器增強功能已載入');
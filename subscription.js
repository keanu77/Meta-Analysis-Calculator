// 訂閱狀態管理
const SubscriptionManager = {
    STORAGE_KEY: 'meta_calculator_subscription',
    
    // 訂閱計畫
    plans: {
        free: {
            name: '免費版',
            features: ['基本統計轉換', '單一效果量計算'],
            limitations: ['每日計算次數限制: 10次']
        },
        pro: {
            name: '專業版',
            price: 'NT$199/月',
            features: [
                '無限制計算次數',
                '所有進階功能',
                '批量資料處理',
                '結果匯出',
                '優先技術支援'
            ]
        }
    },

    // 初始化
    init() {
        this.checkSubscriptionStatus();
        this.setupEventListeners();
    },

    // 檢查訂閱狀態
    checkSubscriptionStatus() {
        const status = localStorage.getItem(this.STORAGE_KEY);
        if (!status) {
            this.startTrial();
        } else {
            const subscription = JSON.parse(status);
            this.updateUI(subscription);
        }
    },

    // 開始試用
    startTrial() {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14); // 14天試用期
        
        const subscription = {
            type: 'trial',
            endDate: trialEnd.toISOString()
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscription));
        this.updateUI(subscription);
    },

    // 更新UI
    updateUI(subscription) {
        const statusElem = document.getElementById('subscription-status');
        const subscribeBtn = document.getElementById('subscribe-btn');
        const trialDays = document.getElementById('trial-days');
        
        if (subscription.type === 'pro') {
            statusElem.innerHTML = '<span class="pro-badge"><i class="fas fa-crown"></i> 專業版用戶</span>';
            subscribeBtn.style.display = 'none';
        } else if (subscription.type === 'trial') {
            const daysLeft = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
            trialDays.textContent = daysLeft;
        }
    },

    // 設置事件監聽器
    setupEventListeners() {
        const subscribeBtn = document.getElementById('subscribe-btn');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSubscriptionModal();
            });
        }
    },

    // 顯示訂閱modal
    showSubscriptionModal() {
        const modal = document.createElement('div');
        modal.className = 'subscription-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>升級至專業版</h2>
                <div class="plans-container">
                    <div class="plan-card">
                        <h3>${this.plans.free.name}</h3>
                        <ul>
                            ${this.plans.free.features.map(f => `<li><i class="fas fa-check"></i>${f}</li>`).join('')}
                            ${this.plans.free.limitations.map(l => `<li class="limitation"><i class="fas fa-exclamation-circle"></i>${l}</li>`).join('')}
                        </ul>
                        <div class="price">免費</div>
                    </div>
                    <div class="plan-card featured">
                        <h3>${this.plans.pro.name}</h3>
                        <ul>
                            ${this.plans.pro.features.map(f => `<li><i class="fas fa-check"></i>${f}</li>`).join('')}
                        </ul>
                        <div class="price">${this.plans.pro.price}</div>
                        <button class="subscribe-now-btn">立即訂閱</button>
                    </div>
                </div>
                <button class="close-modal-btn"><i class="fas fa-times"></i></button>
            </div>
        `;

        document.body.appendChild(modal);

        // 關閉按鈕事件
        const closeBtn = modal.querySelector('.close-modal-btn');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // 訂閱按鈕事件
        const subscribeNowBtn = modal.querySelector('.subscribe-now-btn');
        subscribeNowBtn.addEventListener('click', () => {
            // TODO: 整合實際的付款系統
            console.log('開始訂閱流程');
        });
    }
};

// 當文檔載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    SubscriptionManager.init();
});

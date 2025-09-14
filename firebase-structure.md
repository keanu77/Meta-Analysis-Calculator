# Firebase Firestore 資料結構設計

## 集合 (Collections) 結構

### 1. `users` - 用戶資料
```javascript
/users/{userId} {
  // 基本資料
  email: "user@example.com",
  displayName: "使用者名稱",
  photoURL: "https://...",

  // 個人資料
  profile: {
    institution: "研究機構",
    department: "科系部門",
    researchField: "研究領域",
    bio: "個人簡介"
  },

  // 設定
  settings: {
    language: "zh-TW",
    theme: "light",
    decimalPlaces: 4,
    autoSave: true,
    emailNotifications: true
  },

  // 訂閱資訊
  subscription: {
    plan: "FREE", // FREE, PREMIUM
    startDate: timestamp,
    endDate: timestamp,
    registrationCode: "EBM2025"
  },

  // 元數據
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp
}
```

### 2. `calculations` - 計算記錄
```javascript
/users/{userId}/calculations/{calculationId} {
  // 基本資訊
  title: "我的計算",
  notes: "計算備註",
  calculationType: "effect_size", // effect_size, confidence_interval, sample_size, power_analysis

  // 計算數據
  inputData: {
    // 根據不同計算類型儲存輸入參數
    mean1: 10.5,
    sd1: 2.3,
    n1: 30,
    mean2: 8.2,
    sd2: 2.1,
    n2: 28
  },

  results: {
    // 儲存計算結果
    effectSize: 1.05,
    confidenceInterval: [0.52, 1.58],
    pValue: 0.003,
    interpretation: "大效應"
  },

  // 標籤和組織
  tags: ["pilot study", "RCT"],
  isFavorite: false,
  folder: "研究專案A", // 可選

  // 元數據
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. `folders` - 資料夾分類
```javascript
/users/{userId}/folders/{folderId} {
  name: "研究專案A",
  description: "專案相關計算",
  color: "#3B82F6",
  calculationCount: 15, // 冗余字段，便於顯示
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. `statistics` - 使用統計 (可選)
```javascript
/statistics/users/{userId} {
  totalCalculations: 156,
  calculationsByType: {
    effect_size: 89,
    confidence_interval: 34,
    sample_size: 23,
    power_analysis: 10
  },
  dailyUsage: {
    "2025-01-15": 5,
    "2025-01-14": 3
  },
  monthlyUsage: {
    "2025-01": 45,
    "2024-12": 38
  },
  firstCalculationDate: timestamp,
  lastCalculationDate: timestamp
}
```

## 安全規則 (Security Rules)

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 用戶只能讀寫自己的數據
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // 計算記錄子集合
      match /calculations/{calculationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // 資料夾子集合
      match /folders/{folderId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // 統計數據（只讀）
    match /statistics/users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // 只能通過 Cloud Functions 寫入
    }
  }
}
```

### Firebase Authentication Rules
```javascript
// 自定義聲明 (Custom Claims) - 用於權限控制
{
  "subscriptionPlan": "FREE",
  "registrationCode": "EBM2025",
  "isActive": true
}
```

## 查詢索引建議

### 複合索引
```javascript
// 計算記錄按時間排序
Collection: /users/{userId}/calculations
Fields: createdAt (Descending)

// 收藏的計算記錄
Collection: /users/{userId}/calculations
Fields: isFavorite (Ascending), createdAt (Descending)

// 按類型查詢計算記錄
Collection: /users/{userId}/calculations
Fields: calculationType (Ascending), createdAt (Descending)

// 按資料夾查詢
Collection: /users/{userId}/calculations
Fields: folder (Ascending), createdAt (Descending)
```

## 數據結構優勢

### 1. **層級化組織**
- 用戶數據自然隔離
- 子集合便於查詢和分頁

### 2. **彈性擴展**
- 可輕鬆添加新的計算類型
- 設定和個人資料可獨立更新

### 3. **離線支持**
- Firestore 自動離線同步
- 本地快取提升性能

### 4. **實時更新**
- 多設備間自動同步
- 即時反應數據變化

### 5. **成本優化**
- 按讀寫次數計費
- 合理的數據結構減少查詢成本

## 與當前系統的對應

| 當前 localStorage | Firebase 位置 |
|------------------|--------------|
| `meta_calculator_auth` | Firebase Auth + `/users/{uid}` |
| `meta_calculator_users` | `/users/{uid}` |
| 計算歷史 | `/users/{uid}/calculations/` |
| 用戶設定 | `/users/{uid}/settings` |

這個結構設計考慮了：
- 數據隱私和安全
- 查詢效率和成本
- 擴展性和維護性
- 離線功能支持
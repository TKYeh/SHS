# SHS - 運動課程預約系統

## 部署說明

### Google Apps Script 配置

1. **設置腳本屬性**：
   - 在 Google Apps Script 編輯器中，點擊「專案設定」
   - 在「腳本屬性」區塊中添加：
     - 屬性名稱：`SHEET_ID`
     - 值：你的 Google Sheets ID（可以在網址中找到）

2. **測試配置**：
   - 在 Apps Script 中執行 `testConfiguration()` 函數
   - 檢查日誌輸出是否成功

3. **初始化表單**：
   - 執行 `initializeSheets()` 函數來創建必要的表單

### 部署步驟

1. 將 `GAS_V2/Code.gs` 和 `GAS_V2/Database.gs` 的內容複製到 Google Apps Script 編輯器
2. 設置腳本屬性（見上文）
3. 測試配置
4. 初始化表單
5. 部署為網路應用程式
6. 更新前端代碼中的 GAS URL

### 環境變數

- `SHEET_ID`: Google Sheets 的 ID
- `LIFF_ID`: LINE LIFF 應用程式 ID

# TCv6 Google Drive 後端規格

## 目標
- 程式碼放 GitHub。
- 各校資料放 Google Drive。
- A 校與 B 校彼此隔離，看不到對方資料。
- 同一所學校的不同電腦，都讀寫同一份學校資料。

## 核心原則
1. 每所學校都有自己的 `schoolId`。
2. 每個 `schoolId` 對應到 Google Drive 中的一個獨立根資料夾。
3. 原始課表、歷史異動、匯出檔都只存放在該學校資料夾內。
4. 前端只呼叫 Apps Script API，不直接碰 Drive。

## Google Drive 建議結構
```text
TCv6-Data/
  A-school/
    config.json
    raw-schedule/
      schedule.json
      schedule.xlsx
    history/
      history.json
    drafts/
      drafts.json
    exports/
  B-school/
    config.json
    raw-schedule/
      schedule.json
      schedule.xlsx
    history/
      history.json
    drafts/
      drafts.json
    exports/
```

## 檔案用途
- `config.json`: 學校設定，包含 `schoolId`、顯示名稱、預設資料夾 ID、選用功能開關。
- `raw-schedule/schedule.json`: 原始課表資料，供查詢與比對。
- `raw-schedule/schedule.xlsx`: 可選，原始課表上傳備份。
- `history/history.json`: 歷史異動紀錄。
- `drafts/drafts.json`: 暫存中的調課草稿。
- `exports/`: 匯出的 Excel、圖片、Zip。

## Apps Script API 規格
### 1. 讀取學校設定
```js
getSchoolConfig(schoolId)
```
- 回傳學校名稱、資料夾資訊與功能設定。

### 2. 讀取原始課表
```js
loadRawSchedule(schoolId)
```
- 從 Google Drive 讀取 `raw-schedule/schedule.json`。
- 若有 `schedule.xlsx`，可選擇作為備份或匯入來源。

### 3. 儲存原始課表
```js
saveRawSchedule(schoolId, scheduleData)
```
- 覆寫該校的 `raw-schedule/schedule.json`。
- 同步更新 `updatedAt`。

### 4. 讀取歷史異動
```js
loadHistory(schoolId)
```
- 讀取 `history/history.json`。

### 5. 儲存歷史異動
```js
saveHistory(schoolId, historyItems)
```
- 覆寫 `history/history.json`。

### 6. 讀取草稿
```js
loadDrafts(schoolId)
```
- 讀取 `drafts/drafts.json`。

### 7. 儲存草稿
```js
saveDrafts(schoolId, drafts)
```
- 覆寫 `drafts/drafts.json`。

### 8. 匯出檔案
```js
saveExportFile(schoolId, filename, blob)
```
- 將匯出的 Excel、圖片或 Zip 存進 `exports/`。

### 9. 上傳原始課表
```js
importRawSchedule(schoolId, fileBlob)
```
- 接受 Excel 或 JSON。
- 解析後覆寫該校原始課表。

### 10. 列出學期資料夾
```js
listTerms()
```
- 只供管理介面使用。
- 回傳可用的 `schoolId` 與學期顯示名稱。
- 舊版也可用 `listFolders()` 或 `listSchools()`，但正式名稱以 `listTerms()` 為準。

### 11. GitHub Pages 一次同步（建議）
```js
loadAll(schoolId)
saveAll(schoolId, data)
```
- `loadAll`：一次回傳前端需要的資料包。
  - `events`
  - `adjustmentDrafts`
  - `adjustmentHistory`
  - `baseScheduleData`
- `saveAll`：一次覆寫同一校的資料包，確保原始課表與歷史異動一致更新。

建議回傳格式：
```json
{
  "ok": true,
  "data": {
    "events": [],
    "adjustmentDrafts": [],
    "adjustmentHistory": [],
    "baseScheduleData": null
  }
}
```

## Web App 前後端分工
- 前端負責顯示、編輯與送出資料。
- Apps Script 負責驗證、讀寫 Google Drive、回傳資料。
- 前端不要直接設定 Drive ID。
- 每次操作都帶入 `schoolId`。

## 權限與隔離
- A 校與 B 校各自用不同資料夾 ID。
- 不同學校的資料夾不要共用。
- Web App 不應直接回傳其他學校的資料。
- 若需要更強隔離，可為每校獨立部署一份 Web App。

## 建議的錯誤處理
- 找不到學校資料夾：回傳明確錯誤訊息。
- JSON 格式錯誤：拒絕寫入，保留舊資料。
- Drive 寫入失敗：回傳失敗與原因。
- `schoolId` 無效：直接拒絕。

## 實作建議
- 用 `PropertiesService` 儲存全域設定，例如預設 `schoolId` 對照表。
- 用 `DriveApp` 讀寫檔案。
- 用 `LockService` 避免多人同時寫入造成覆蓋。
- 用 JSON 當主要資料格式，Excel 只當匯入或匯出格式。

## 最小可行版本
如果你想先做最小版本，建議先實作這 4 個函式：
1. `getSchoolConfig(schoolId)`
2. `loadRawSchedule(schoolId)`
3. `saveHistory(schoolId, historyItems)`
4. `saveDrafts(schoolId, drafts)`

這樣就能先完成：
- 原始課表共用
- 歷史異動同步
- 同校多電腦同步
- 不同學校隔離

# TCv6 GitHub 發布說明

## 發布原則
- GitHub repo 只放公版前端與共用腳本。
- 各校真實課表、歷史異動、學校代碼與私有設定不要放進公開 repo。
- 各校資料應放在 Google Drive 的學校專屬資料夾，由 Web App 讀寫。
- 如果需要對外發佈 Demo，請另外準備假資料或示範資料。

## 建議公開內容
```text
TCv6/
  index.html
  css/
  js/
  scripts/
  A4.xlsx
  README.md
  docs/
    GITHUB-PUBLISHING.md
```

## 各校私有資料
建議每校一組獨立資料源，資料彼此分開：

```text
Google Drive/
  TCv6-Data/
    A-school/
      raw-schedule/
      history/
      exports/
    B-school/
      raw-schedule/
      history/
      exports/
```

## 推薦做法
### 方案 1: Google Apps Script + Google Sheet/Drive
- 公版程式放 GitHub。
- A 校和 B 校各自部署不同的 Web App。
- 原始課表與歷史異動都放在各校自己的 Google Drive 資料夾。
- 每校一個根資料夾，底下再切 raw-schedule、history、exports。
- 優點是跨電腦同步容易，且能做學校級隔離。

### 方案 2: 自架 API + 資料庫
- 公版程式放 GitHub。
- 各校使用不同的 `schoolId`。
- 後端依 `schoolId` 讀寫各校資料。
- 歷史異動與原始課表都存在資料庫，不依賴瀏覽器 localStorage。

### 方案 3: 每校獨立部署
- 同一份程式碼，為每個學校建立一份獨立部署。
- 每份部署綁定各自的資料來源與儲存區。
- 最簡單，也最容易維持 A 校看得到 A 校、B 校看不到 A 校。

## 不建議
- 不要把各校正式課表放在公開 GitHub Pages。
- 不要只靠 localStorage 保存歷史異動，因為不同電腦不會同步。
- 不要用同一份公開 JSON 同時服務所有學校的正式資料。

## 你現在這個專案的定位
- `index.html` 和 `js/app.runtime.js` 是公版。
- `A4.xlsx` 是共用匯出樣板。
- 真實課表與歷史異動應該移到各校 Google Drive 私有資料夾。

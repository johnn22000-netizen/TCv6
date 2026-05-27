# TCv6 調課系統

## 目前結構
- 所有執行必要檔案都放在 TCv6 根目錄。
- `index.html` 為入口頁。
- `app.bundle.js` 為唯一 JavaScript 檔，已包含程式、內建課表資料與本地函式庫。
- `A4.xlsx` 為調課單匯出範本。
- `serve-tcv6.ps1` 與兩個 `.bat` 為本地啟動用。

## GitHub 發布版
- GitHub 只放公版程式，不放各校真實課表與歷史異動。
- 建議保留 `index.html`、`css/`、`js/`、`scripts/`、`A4.xlsx`、`README.md`。
- `schedule-from-1142.json` 只能當示範資料或測試資料，不要放各校正式資料。
- GitHub 發布版的後端資料設計請看 `docs/GDRIVE-BACKEND-SPEC.md`。

## 各校資料怎麼放
- 原始課表：放在「各校私有資料源」，不要進 GitHub 公開倉庫。
- 歷史異動：放在「各校私有持久化儲存」，不要只靠瀏覽器 localStorage。
- 最實用的做法是每校一個 `schoolId`，資料全部以 `schoolId` 分隔。
- A 校所有電腦都指向同一個 A 校資料源，所以大家看到同一份 A 校課表與歷史。
- B 校用不同的 `schoolId` 或不同部署，所以看不到 A 校資料。

## 建議架構
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

各校私有資料建議不要放在 GitHub：
```text
private-data/
	A-school/
		schedule.json
		history.json
	B-school/
		schedule.json
		history.json
```

如果你要讓 A 校不同電腦都看同一份資料，請用下列其中一種：
1. Google Apps Script Web App + Google Sheet/Drive 做後端儲存。
2. 自架後端 API + 資料庫，依 `schoolId` 讀寫。
3. 每校獨立部署一份 App，部署時綁定自己的資料源。

## 如何使用
1. 雙擊 `一鍵啟動TCv6.bat`。
2. 或直接用瀏覽器開啟 `index.html`。
3. 若要看啟動細節，使用 `一鍵啟動TCv6_除錯模式.bat`。

## 課表來源
- 預設直接使用 `app.bundle.js` 內含的內建課表資料。
- 若你另外提供 `schedule-from-1142.json` 並放在根目錄，系統會優先讀取它。
- 若要做正式校務版，建議把真實課表改成外部私有資料源，而不是放在 repo。

## 備註
- 此版本已移除對 Python 與 CDN 的依賴。
- 匯出調課單時會讀取根目錄的 `A4.xlsx`。

const DATA_TSV = `title	badge1	badge2	cat1	cat2	own	era	rank	tags	desc	url
跨平台資料轉移（部落格文章）	新專案	cli	rpa	Data-migration	0	0	3	["AutoIt","C# Lib","Google Photos","Google API"]	自動化搬遷 500 篇部落格文章，整合 Google Photos API 處理圖片託管	
跨平台資料轉移（悠遊卡）	新專案	cli	rpa	Data-migration	0	0	3	["AutoIt","C# Lib","CAPTCHA 破解","bitcoin"]	從悠遊卡後台系統批次匯出資料，包含驗證碼自動識別機制	
養豬場電子表單	既有專案	web	web	E-form	0	0	3	["Vue.js","CLI","字串處理"]	運用元程式設計動態產生表單欄位，第一個接案經驗	
Infinitode 遊戲解析器	個人專案	office	office	statistic	1	0	3	["GCP OCR","Google Spreadsheet","Google Photos"]	透過 OCR 擷取遊戲截圖數據，自動整理至試算表進行分析	
TSC Fit 管理工具	新專案	cli	admin	Data-intg	0	0	2	["EF","CLI","LINQ"]	開發 CLI 任務排程工具，整合第三方 API 自動執行定期作業	
企業入口網站 4.0	新專案	web	web	eip	0	0	2	["ASP.NET WebForm","jQuery"]	重新設計企業入口網站，實作響應式介面與客製化儀表板	
內容管理系統 2.0	新專案	web	web	cms	0	0	2	["ASP.NET MVC","ADO.NET"]	開發新版 CMS 系統，支援響應式設計與自訂版面配置	
TSC Fit 健身系統	新專案	web	web	health	0	0	2	["ASP.NET WebForm","jQuery","EF"]	建置健身數據儀表板，進行資料庫與前端效能優化	
VBA 重構專案	既有專案	office	office	audit	0	0	1	["VBA","refactor"]	重構遺留 VBA 程式碼，釐清並文件化業務需求	
電子表單系統	既有專案	web	web	E-form	0	0	1	["ASP.NET WebForm"]	維護電子表單系統，整合 ERP 與第三方函式庫	
日周報系統	既有專案	web	web	journal	0	0	1	["ASP.NET WebForm","MVC","CKEditor"]	開發日周報系統，整合 CKEditor 富文本編輯功能	
VBA 甘特圖	新專案	office	office	pm	0	0	1	["VBA","info-viz"]	使用 VBA 繪圖功能開發甘特圖產生工具	
SSO AD 帳號同步	新專案	na	rpa	Data-sync	0	0	1	["AD","ASP.NET","TAM"]	排查 SSO 與 Active Directory 帳號同步問題，制定標準流程	
數位學習自動點擊工具	新專案	na	rpa	bot	0	0	1	["AutoIt"]	自動化數位學習平台的課程進度點擊	
104人力銀行解析器	個人專案	na	rpa	Web-crawler	1	0	1	["CLI","HttpAgilityPack"]	第一個網頁爬蟲專案，解析 104 人力銀行職缺資料	
RTF 格式轉換器	個人專案	cli	admin	data	1	0	1	["CLI"]	解析 RTF 格式文件並轉換為純文字	
ELK 日誌系統	新專案	web	admin	Info-viz	0	1	3	["ELK","Nlog","Linux","Docker","OSS","Lucene"]	建置 ELK Stack 集中式日誌平台，支援多服務即時監控與 Kibana 查詢	
機器人偵測報表	新專案	na/web	admin	Data-sync	0	1	3	["T-SQL",".NET","dataurl","bit-flags"]	開發可疑帳號偵測系統，使用位元旗標標記異常行為並開發旗標查詢器	
原生手機應用 API 封裝	既有專案	na	webapi	Api-wrapper	0	1	2	["ASP.NET","c#","Dapper","wrapper"]	封裝後端邏輯 (帳務、賽果、會員)，架設 API 供原生手機應用使用	
打卡自動化	新專案	na	rpa	bot	0	1	2	["cmd.exe"]	自動化打卡流程的腳本工具（僅供實驗用途）	
網站組態設定查詢工具	新專案	desktop	admin	Data-viz	0	1	1	[".NET","c#","winform"]	開發 CLI 工具反向查詢網站組態設定檔	
Postman 整合測試	新專案	postman	devops	Test-intg	0	1	1	["Postman","JavaScript"]	撰寫 Postman 腳本進行 API 整合測試	
VSCode Markdown 擴充套件	個人專案	vscode	devops	extension	1	1	1	["TypeScript","Redux"]	開發 VSCode 擴充套件優化 Markdown 筆記體驗	
UM 服務更新自動化	新專案	cli	devops	devops	0	1	1	["PowerShell"]	自動化服務更新流程，部署時間從 50 分鐘縮短至 5 分鐘	
物流管理平台	新專案	web	web	logistic	0	2	3	["ASP.NET","react-admin","KendoUI","MS-SQL"]	全端開發物流調度系統，涵蓋訂單派送、車輛排程與資源管理功能	
資安整合專案	新專案	web/na	rpa	data-sync	0	2	3	["webhook","Playwright","MS-SQL","SSO"]	整合 KnowBe4 資安意識訓練平台，實作 Webhook 與 SSO 單一登入	
第一個技術部落格	個人專案	web	web	blog	1	2	3	["JAMstack","Next.js"]	撰寫網頁開發技術文章，從零設計部落格視覺風格與互動體驗	https://personal-blog-khaki.vercel.app/
VSCode 擴充套件 (TDD)	個人專案	vscode	devops	extension	1	2	3	["TypeScript","Redux","TDD"]	以 TDD 方式開發的 Markdown 大綱輔助工具，已上架 VS Marketplace	https://marketplace.visualstudio.com/items?itemName=JohnTao.markdown-outline-helper
SMART 學生補助系統	既有專案	web	web	Edu-sup	0	2	2	["ASP.NET MVC","KendoUI","MS-SQL"]	維護學生補助申請系統，處理審核流程與報表功能	
電影資料解析器	個人專案	na	rpa	Web-crawler	1	2	2	["C#","Playwright"]	使用 Playwright 自動爬取電影資料並匯出至試算表	
591租屋網解析器	個人專案	na	rpa	Web-crawler	1	2	2	["C#","SQLite","daemon","Playwright","headless-mode"]	背景服務持續爬取 591 租屋資訊，儲存至 SQLite 資料庫	
時間記錄器	個人專案	web	web	Time-tracking	1	3	3	["vibe-code","SDD","github-pages","ring-menu","design"]	個人時間記錄器：AI 開發、概念設計、UI研究	./ttapp
曼陀羅九宮格	個人專案	web	web	Mandala-chart	1	3	3	["vibe-code","SDD","github-pages","ring-menu","design"]	曼陀羅九宮格：AI 開發、概念設計、UI研究	./mandala
VIM 按鍵遊戲	個人專案	web	web	game	1	3	3	["vibe-code","SDD","github-pages","ring-menu","design"]	透過遊戲化方式學習 VIM 快捷鍵，使用 SDD 與 AI 輔助開發的互動式網頁遊戲	./game/
個人部落格	個人專案	web	web	blog	1	3	3	["Claude-Code","Supabase","MCP","Lynx-Compatible"]	累積 30 篇技術文章，探索 AI 輔助寫作的可能性	https://johntao.dev
一鍵下單機器人	個人專案	cli	rpa	bot	1	3	2	["Claude-Code","Playwright"]	使用 Playwright 自動化電影下單流程	
公司網站與名片設計	個人專案	web	web	Company-site	1	3	2	["Azure DevOps","Astro"]	運用 AI 工具快速完成公司網站與名片視覺設計	https://www.yjcraft.com/
RTF 解析器重製版	個人專案	web	web	Data-intg	1	3	2	[".NET 10","Claude-Code"]	重新設計 RTF 解析器 (2020)，程式碼精簡為原版的十分之一	
LangChain 教學	既有專案	colab	edu	lecture	0	3	2	["Python","Colab","LangChain"]	首次擔任講師，教授 LangChain 與 AI 應用開發	
綠界金流模組升級	既有專案	odoo	webapi	E-commerce	0	3	1	["Python"]	升級綠界金流模組，首次使用 Python 開發	
銷售流程設計	新專案	heptabase	sales	Service-flow	0	3	1	[]	設計並文件化銷售工作流程	
Odoo工作坊流程設計與實作	新專案	heptabase	sales	Service-flow	0	3	1	["CloudPepper","AWS"]	在 AWS 上建置 20 個 Odoo ERP 實例	
`;
const ERAs = [
  {"name": "崇越科技", "period": "2016 - 2020" },
  {"name": "瑞嘉軟體", "period": "2020 - 2022" },
  {"name": "羅奇科技", "period": "2022 - 2024" },
  {"name": "芸机工作室", "period": "2025 - 2026" }
];
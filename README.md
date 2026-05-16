# Super A'Can Web Emulator 🎮

[English](./README_EN.md) | **繁體中文**

<div align="right">

[![GitHub](https://img.shields.io/badge/GitHub-anomixer/superacan--web-green?logo=github)](https://github.com/anomixer/superacan-web)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Powered-blueviolet?logo=webassembly)](https://webassembly.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Games](https://img.shields.io/badge/遊戲支援-12%20%2F%2012-brightgreen)](#-完整遊戲清單)

</div>

### 🌐 線上體驗：[https://anomixer.github.io/superacan-web/](https://anomixer.github.io/superacan-web/)

> 🎊 紀念台灣唯一自製 16 位元遊戲主機 **Funtech Super A'Can** 誕生 30 週年！

<p align="center">
  <img src="30th-anniversary.png" alt="Super A'Can 30th Anniversary" width="500">
</p>

這是一個基於 **WebAssembly (WASM)** 技術的 Super A'Can 瀏覽器線上模擬器。本專案將 MAME 核心針對 Web 環境進行深度特化與效能調校，讓玩家能直接在網頁上以 **100% 原生速度**體驗這款傳奇主機的魅力——包含全部 12 套官方遊戲。

---

## ✨ 核心特色

### ⚡ 100% 原生滿速運行
針對 MAME 核心拔除效能殺手 `perfect_quantum`，並改用特製的 `6000Hz` 同步率，確保在 Web 環境下依然能達到 **60FPS 滿速運行**，不妥協任何相容性。

### 🎵 雙軌音訊除靈引擎 (Dual-Core Audio Engine)

這是本專案最核心的技術突破之一。Super A'Can 的 UM6619 音效晶片在 MAME 內長期存在 DMA 握手問題，導致特定遊戲產生「喪屍循環雜音」甚至無法開機。本專案提供兩套 WASM 核心以對應不同需求：

| WASM 核心 | 適用遊戲 | 音訊處理方式 |
| :--- | :--- | :--- |
| `mamesupracan.wasm` | 8 款正常遊戲 | 100% 原汁原味高保真音效 |
| `mamesupracan-sndfix.wasm` | 4 款問題遊戲 ★ | Ghost-Buster ADSR 緩衝衰減 + DMA 握手修復 |

> ★ **除靈版適用遊戲**：《音速飛龍》、《福爾摩沙大對決》、《超級中華職棒聯盟》、《嘻遊記》

### 🖥️ 現代化前端 UI
- **雙語系**：繁體中文 / English 即時切換
- **RWD 響應式佈局**：側邊欄可收合，支援自訂寬度拖拉
- **兩種畫面縮放**：「適應螢幕」與「原生 2x」模式
- **雙影像渲染模式**：支援「硬體加速 (WebGL)」與「軟體渲染」切換，重啟後生效並自動記憶偏好
- **三段式音訊核心切換**：新增「自動」、「標準」與「修正」切換功能，讓玩家自由決定是否套用除靈版音訊修復，重啟後生效並自動記憶偏好
- **可靠靜音控制**：獨立 GainNode 機制，完美繞過 Emscripten 強制恢復
- **📱 行動虛擬手把**：觸控裝置支援螢幕虛擬按鍵；電腦模式下以底部抽屜收納，手機模式下自動常駐並配合畫面縮放

### 📚 完整數位典藏
內建全套 **12 款**官方遊戲的數位博物館資訊，包含年代、開發商與高解析度封面。

---

## 🕹️ 完整遊戲清單

| # | 遊戲名稱 | 音訊核心 |
| :---: | :--- | :---: |
| 1 | 音速飛龍 (Speedy Dragon) | 除靈版 |
| 2 | 福爾摩沙大對決 | 除靈版 |
| 3 | 超級中華職棒聯盟 | 除靈版 |
| 4 | 嘻遊記 | 除靈版 |
| 5 | 爆爆動物園 (Boom Zoo) | 標準版 |
| 6 | 賭霸 (Gambling Lord) | 標準版 |
| 7 | 魔棒撞球 (Magical Pool) | 標準版 |
| 8 | 非洲探險大富翁 (Monopoly) | 標準版 |
| 9 | 叛星 (Rebel Star) | 標準版 |
| 10 | 武將爭霸 (Sango Fighter) | 標準版 |
| 11 | 超級光明戰士 (Super Light Saga) | 標準版 |
| 12 | 邪惡之子 (The Son of Evil) | 標準版 |

---

## ⚖️ 版權與 ROM 檔案說明 (DMCA)

為符合版權與 DMCA 規範，本專案倉庫**不代管、不內建**任何 Super A'Can 的 BIOS 與遊戲 ROM 檔案。我們的作法如下：

1.  **零檔案殘留**：專案嚴格將 ROM 檔案排除在 Git 追蹤之外，絕不將版權檔案推送到 GitHub。
2.  **本地端動態下載**：提供 `node prepare.js` 腳本。當玩家在本地端部署時，腳本會自動從網路上的公開典藏庫（如 Archive.org）下載所需檔案。
3.  **防過期爬蟲**：針對部分網站動態過期連結的問題，腳本內建了模擬瀏覽器請求的爬蟲，確保玩家隨時都能在本地端備齊檔案。

*請注意：本專案僅提供模擬器技術實作，使用者下載 ROM 檔案需自行評估當地法律規範。*

---

## 🚀 如何運行

由於瀏覽器安全性限制 (CORS)，WASM 檔案無法直接從本地資料夾點擊開啟，必須透過本機伺服器運行。

**需求：** [Node.js](https://nodejs.org/)

```bash
# 1. 複製專案
git clone https://github.com/anomixer/superacan-web.git
cd superacan-web

# 2. 準備 BIOS 與遊戲檔案
# 執行此腳本會自動下載所需的 BIOS 與遊戲檔案並自動更名
# (若您已有標準 MAME .zip 檔，直接放入 roms/supracan/ 即可智慧跳過下載)
node prepare.js

# 3. 啟動本機伺服器
node server.js

# 4. 開啟瀏覽器
# 前往 http://localhost:8080
```

---

## 📂 專案檔案架構

```text
superacan-web/
├── index.html          # 主頁面 (包含 UI 與語系字典)
├── index.css           # 樣式表 (極簡黑魂風格、RWD)
├── loader.js           # MAME 載入器 (處理 WASM 預載入與相容性)
├── games.js            # 12 款遊戲的資料庫 (已去敏)
├── prepare.js          # 自動化 BIOS/ROM 下載與防呆腳本
├── server.js           # 本地簡易 Node.js 伺服器
├── hash/               # MAME 軟體清單定義
│   └── supracan.xml
├── supracan-fix/       # MAME 核心修補源碼與文檔 (典藏)
│   ├── src/            # C++ 修改源碼
│   └── *.md            # 修補技術文檔
├── wasm/               # MAME WebAssembly 核心編譯產物
│   ├── mamesupracan.wasm.gz         # 標準版核心
│   └── mamesupracan-sndfix.wasm.gz  # 音訊除靈版核心
└── thumbs/             # 12 款遊戲的封面縮圖
```

---

## 🎮 操作說明

模擬器支援全鍵盤操作。遊戲中按下 **`TAB`** 鍵可叫出 MAME 原生選單，重新定義任意按鍵。

| A'Can 手把 | 預設按鍵 (1P) | 預設按鍵 (2P) |
| :--- | :---: | :---: |
| **方向鍵** | 鍵盤方向鍵 | `R` `F` `D` `G` |
| **A** | `Ctrl` | `A` |
| **B** | `Space` | `Q` |
| **X** | `Alt` | `S` |
| **Y** | `L-Shift` | `W` |
| **L** | `Z` | `E` |
| **R** | `X` | — |
| **Select** | `5` | `6` |
| **Start** | `1` | `2` |

---

## 🛠️ 技術架構與修改紀錄

本專案對 MAME `supracan` 驅動程式進行了以下技術介入：

### 1. 影像渲染最佳化（`supracan.cpp`）
引進 Sprite 螢幕外智慧裁切、解構渲染迴圈，並實作條件式 VRAM 標記，大幅降低 Web 環境下的記憶體運算負擔。

### 2. 音訊 DMA 握手修補（`umc6619_sound.cpp`）
修復暫存器 `0x16` 的狀態清除機制，讓 6502 協同處理器能正確接收 DMA 中斷，解決特定遊戲無法開機及「喪屍雜音」問題。這也是 MAME 從 0.136 加入支援後、直到近年才能讓全部 12 套遊戲正常運行的核心癥結所在。

### 3. WASM 前端整合（`loader.js`）
使用 Software List 模式取代直接掛載，解決多層資料夾與磁區的相容性問題，確保所有遊戲 ROM 均可正確識別。

---

## 📖 為什麼 Super A'Can 的完整支援姍姍來遲？

Super A'Can 是台灣敦煌科技（Funtech）於 1995 年推出的 16 位元家用主機，也是台灣唯一自主研發的電視遊樂器。由於商業失敗，僅發行 12 套遊戲，硬體文件幾乎付之一炬。

MAME 早在 2010 年（0.136 版）就已加入 supracan 驅動，但「能開機」和「能完整遊玩」是兩回事：

- **2010 年**：CPU、顯示、基本 I/O 模擬完成，大部分遊戲勉強可進標題畫面
- **2021 年**：MAME 0.233 WIP 補入初步音效支援，但 envelope、voice samples、DMA 時序仍有缺漏
- **2024–2025 年**：MAME 0.28x 世代逐步補完 UM6619 音效晶片細節，才讓多款遊戲達到可遊玩狀態

本專案在 MAME 最新核心基礎上，進一步修補了 DMA 握手與音訊衰減問題，首次實現 **12 套遊戲全部可正常遊玩**。在 30 週年後的今天，為您完美呈現當年的傳奇！

---

## 📜 聲明

本專案的模擬器核心技術源自開源專案 [MAME](https://github.com/mamedev/mame)，並針對 A'Can 的歷史保存與學術研究進行特化修改。所有遊戲 ROM 版權歸原始著作權人所有，本專案不提供任何 ROM 檔案。

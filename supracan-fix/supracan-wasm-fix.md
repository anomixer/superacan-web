# Super A'Can WASM 效能與相容性修復技術文檔 (Golden Edition)

本文件詳述了針對 Super A'Can (supracan) 驅動程式在 MAME WebAssembly 環境下的核心修改與優化細節。

---

## 1. 音效核心修復 (UMC 6619)
**檔案路徑：** `src/mame/umc/umc6619_sound.cpp` / `.h`

### 修改重點：
*   **DMA IRQ 手機機制 (Handshaking)**：實作了暫存器 `0x16` 的讀取清除 (Clear-on-read) 邏輯，確保 Sound CPU 能夠正確接收與確認 DMA 事件，解決了《中華職棒聯盟》等遊戲無法開機的問題。
*   **暫存器 0x15 狀態回應**：模擬了正確的狀態位元，避免 Sound CPU 陷入無限等待的死迴圈。
*   **聲音除靈 (Ghost-Buster Decay)**：
    *   針對 **CH 11-15** 實作了緩衝衰減機制（每 4 幀 1 階）。
    *   解決了高頻雜訊與揮棒餘音問題，同時保留了約 1 秒鐘的自然尾勁。
*   **移除偵錯訊息**：關閉了 `LIVE_AUDIO_VIEW` 等高負擔的偵錯代碼。

---

## 2. 影像渲染核心優化 (supracan.cpp)
**檔案路徑：** `src/mame/umc/supracan.cpp`

### 效能噴發關鍵 (WASM 特規優化)：
*   **擊殺 Perfect Quantum**：
    *   移除 `config.set_perfect_quantum(m_soundcpu);`。
    *   改用平衡的 `config.set_maximum_quantum(attotime::from_hz(6000));`。
    *   **成果**：大幅減少 CPU 上下文切換，模擬速度提升約 20%。
*   **Sprite 智慧裁切 (Culling)**：
    *   在 `draw_sprites` 進入內層 Tile 迴圈前，實作了精確的螢幕邊界檢查。
    *   **成果**：對於場外待命的大量精靈直接跳過計算，棒球遊戲效能顯著提升。
*   **渲染迴圈解構**：
    *   將 `screen_update` 中背景層的邊界檢查 (`wrap` 判斷) 從像素級迴圈內移至外部，預先計算繪圖區間。
    *   **成果**：減少每一幀數百萬次的 `if` 判斷。
*   **智慧 VRAM 標記**：
    *   修改 `vram_w`，僅在 `gfx_mode` 變更時標記 1bpp/2bpp 的 Dirty 狀態。
    *   **成果**：減少不必要的圖形重新解碼開銷。
*   **ROZ 渲染加速**：
    *   在 `draw_roz_layer` 內層迴圈中使用局部變數鎖定 Mask 和尺寸變數，減少記憶體存取壓力。

---

## 3. 建置腳本優化 (build.ps1)
**檔案路徑：** `build.ps1`

### 編譯旗標：
*   **`-Optimization Production`**：自動開啟所有極速設定。
*   **`-msimd128`**：啟用硬體指令集加速。
*   **`-flto`**：開啟連結時優化，壓縮檔案體積並提升跨模組效率。
*   **`-s MALLOC=emmalloc`**：使用輕量化記憶體分配器。
*   **`-fno-exceptions`**：徹底移除 C++ 例外處理的執行負擔（WASM 效能大敵）。

---

## 4. 測試結論 (Super Taiwanese Baseball League)
*   **優化前**：~53% 速度，聲音極度斷續，必須開啟 Frameskip。
*   **優化後**：**100% 滿速**，無須 Frameskip，無須 `-video accel`，聲音流暢自然。

---

## 5. 異動檔案清單 (Modified Files)
*   **`mame/src/mame/umc/supracan.cpp`**：核心渲染與同步優化。
*   **`mame/src/mame/umc/umc6619_sound.cpp`**：音訊 IRQ 手機機制與雜音衰減。
*   **`mame/src/mame/umc/umc6619_sound.h`**：聲道結構定義擴充。
*   **`build.ps1`**：Turbo 建置引擎實作。
*   **`test_mamewasm.html`**：前端測試介面功能強化。
*   **`AGENTS.md`** / **`umc6619fix.md`**：專案紀錄與技術文檔更新。

---
**維護者：** anomixer & Antigravity
**日期：** 2026-05-15

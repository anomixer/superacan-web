/**
 * Super A'Can Web Loader v2.5
 * Fix: Use Software List booting for complex games (slghtsag, rebelst)
 */

window.AcanEmulator = (function() {
    let capturedContext = null;

    let masterGainNode = null;

    // --- Audio Interception ---
    (function interceptAudio() {
        const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
        if (!OriginalAudioContext) return;
        window.AudioContext = window.webkitAudioContext = function() {
            const ctx = new OriginalAudioContext();
            capturedContext = ctx;
            
            masterGainNode = ctx.createGain();
            masterGainNode.gain.value = 1;

            const originalConnect = AudioNode.prototype.connect;
            AudioNode.prototype.connect = function(destination) {
                if (destination === ctx.destination) {
                    originalConnect.call(this, masterGainNode);
                    originalConnect.call(masterGainNode, ctx.destination);
                    return masterGainNode;
                }
                return originalConnect.apply(this, arguments);
            };

            console.log("[AcanEmulator] 🎯 成功攔截 AudioContext 並建立 GainNode!");
            return ctx;
        };
    })();

    function log(msg, type = 'info') {
        const debugArea = document.getElementById('debugLog');
        if (debugArea) {
            const entry = document.createElement('div');
            entry.style.color = type === 'err' ? '#ff4444' : (type === 'warn' ? '#ffbb00' : '#00ff00');
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
            debugArea.appendChild(entry);
            debugArea.scrollTop = debugArea.scrollHeight;
        }
        console.log(`[AcanEmulator] ${msg}`);
    }

    // Toggle debug drawer with F2 key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            if (window.toggleDebugDrawer) window.toggleDebugDrawer();
        }
    });

    async function start(canvas, game, options = {}) {
        let defaultJsPath = 'wasm/mamesupracan.js';
        let defaultWasmPath = 'wasm/mamesupracan.wasm.gz';

        const soundMode = localStorage.getItem('soundMode') || 'auto';
        let useSndFix = false;

        if (soundMode === 'fixed') {
            useSndFix = true;
        } else if (soundMode === 'original') {
            useSndFix = false;
        } else {
            // Auto mode
            const noisyGames = ['formduel', 'jttlaugh', 'speedyd', 'staiwbbl'];
            useSndFix = noisyGames.includes(game.id);
        }

        if (useSndFix) {
            defaultJsPath = 'wasm/mamesupracan-sndfix.js';
            defaultWasmPath = 'wasm/mamesupracan-sndfix.wasm.gz';
            log(`⚠️ 啟用 sndfix 音訊衰減核心版本 (模式: ${soundMode})`);
        }

        const {
            jsPath = defaultJsPath,
            wasmPath = defaultWasmPath,
            hashDir = 'hash/'
        } = options;

        log(`🎮 準備啟動: ${game.nameCh}`);

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const proxy = "https://corsfix.com/?";
        const biosUrls = {
            'supracan.zip': 'https://mdk.cab/download/split/supracan.zip',
            'umc6650.zip': 'https://mdk.cab/download/split/umc6650.zip'
        };

        const zipGames = ['slghtsag', 'gamblord', 'magipool', 'rebelst'];
        const isBin = !zipGames.includes(game.id);
        
        const preferredName = isBin ? `${game.id}.bin` : `${game.id}.zip`;
        const fallbackName = isBin ? `${game.id}.zip` : `${game.id}.bin`;

        let actualFileName = preferredName;
        let actualIsBin = isBin;

        log("📡 正在讀取 BIOS 與 Hash 數據...");
        const baseFilesToLoad = [
            { name: 'supracan.zip', url: 'roms/supracan/supracan.zip', target: '/roms/' },
            { name: 'umc6650.zip', url: 'roms/supracan/umc6650.zip', target: '/roms/' },
            { name: 'supracan.xml', url: hashDir + 'supracan.xml', target: '/hash/' }
        ];

        let loadedFiles = [];
        try {
            // Load base files
            loadedFiles = await Promise.all(baseFilesToLoad.map(async file => {
                const response = await fetch(file.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.arrayBuffer();
                log(`✅ 已讀取: ${file.name}`);
                return { ...file, data: new Uint8Array(data) };
            }));

            // Load game file with fallback
            log(`📡 正在嘗試讀取首選遊戲檔案: ${preferredName}...`);
            let res = await fetch('roms/supracan/' + preferredName);
            if (!res.ok) {
                log(`⚠️ 讀取 ${preferredName} 失敗，嘗試讀取備用檔案 ${fallbackName}...`, 'warn');
                res = await fetch('roms/supracan/' + fallbackName);
                if (!res.ok) {
                    throw new Error(`無法讀取遊戲檔案 (嘗試了 ${preferredName} 與 ${fallbackName})`);
                }
                actualFileName = fallbackName;
                actualIsBin = !isBin;
                log(`✅ 成功讀取備用檔案: ${fallbackName}`);
            } else {
                log(`✅ 成功讀取首選檔案: ${preferredName}`);
            }
            const gData = await res.arrayBuffer();
            loadedFiles.push({
                name: actualFileName,
                target: '/roms/',
                data: new Uint8Array(gData)
            });

        } catch (err) {
            log(`❌ 讀取失敗: ${err.message} (請確認檔案是否存在於正確目錄)`, 'err');
            return;
        }

        const softwareName = game.id;
        const videoMode = window.videoMode || 'accel';
        let mameArgs = [
            'supracan', 
            '-verbose', 
            '-window', 
            '-video', videoMode, 
            '-resolution', '640x480', 
            '-rompath', '/roms',
            '-hashpath', '/hash',
            '-autoframeskip'
        ];
        log(`🕹️ 影像渲染模式: ${videoMode}`);

        if (actualIsBin) {
            mameArgs.splice(1, 0, '-cart', `/roms/${actualFileName}`);
            log(`🕹️ 載入模式: BIN 檔案 (-cart), 檔名: ${actualFileName}`);
        } else {
            mameArgs.splice(1, 0, softwareName);
            log(`🕹️ 載入模式: ZIP 檔案 (Software List), 軟體名: ${softwareName}`);
        }

        window.Module = {
            canvas: canvas,
            arguments: mameArgs,
            preRun: [
                function() {
                    log("📁 [preRun] 正在掛載虛擬系統...");
                    const fs = window.Module.FS || FS;
                    if (!fs) return;
                    
                    try { 
                        fs.mkdir('/roms');
                        fs.mkdir('/hash');
                        fs.mkdir('/cfg');
                        fs.mkdir('/nvram');
                        fs.mkdir('/state');
                    } catch (e) {}

                    loadedFiles.forEach(file => {
                        fs.writeFile(file.target + file.name, file.data);
                        log(`📌 已掛載: ${file.name} -> ${file.target}`);
                    });
                    log("🏁 檔案系統掛載完成！");
                }
            ],
            print: function(text) { log(`MAME: ${text}`); },
            printErr: function(text) { log(`MAME_ERR: ${text}`, 'err'); },
            setStatus: function(text) {
                if (window.onEmulatorStatus) window.onEmulatorStatus(text);
            },
            instantiateWasm: function(imports, successCallback) {
                log("📦 正在下載並解壓縮 WASM 核心...");
                fetch(wasmPath)
                    .then(response => {
                        if (!response.ok) throw new Error(`WASM fetch failed: ${response.status}`);
                        if (wasmPath.endsWith('.gz') && typeof DecompressionStream !== 'undefined') {
                            const ds = new DecompressionStream('gzip');
                            const decompressedStream = response.body.pipeThrough(ds);
                            return new Response(decompressedStream).arrayBuffer();
                        }
                        return response.arrayBuffer();
                    })
                    .then(bytes => WebAssembly.instantiate(bytes, imports))
                    .then(result => {
                        log("✅ WASM 核心編譯完成！");
                        successCallback(result.instance);
                    })
                    .catch(err => {
                        log(`❌ WASM 載入失敗: ${err.message}`, 'err');
                    });
                return {}; // Indicates async compilation
            },
            locateFile: function(path) {
                if (path.endsWith('.wasm')) return wasmPath;
                return path;
            }
        };

        log("🚀 載入核心 JS 並啟動...");
        const script = document.createElement('script');
        script.src = jsPath;
        document.body.appendChild(script);
    }

    function toggleMute(isMuted) {
        if (masterGainNode) {
            masterGainNode.gain.value = isMuted ? 0 : 1;
            log(isMuted ? "🔈 已靜音" : "🔊 恢復音量");
        } else {
            log("❌ 尚未取得音訊物件", "err");
        }
    }

    return {
        start: start,
        toggleMute: toggleMute
    };
})();

const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const isWindows = process.platform === 'win32';
const romDir = path.join(__dirname, 'roms', 'supracan');

// Helper to download file with redirect support and optional headers
function downloadFile(url, dest, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...extraHeaders
            }
        };
        const request = https.request(options, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadFile(response.headers.location, dest, extraHeaders).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        });
        request.on('error', reject);
        request.end();
    });
}

// Helper to fetch MyAbandonware download URL
function fetchAbandonwareUrl(id) {
    return new Promise((resolve, reject) => {
        const gamePages = {
            'pbmq-du-ba': '/game/du-ba-xli',
            'pbmx-magical-pool': '/game/magical-pool-xlo',
            'pbn2-rebel': '/game/rebel-xls'
        };
        const gamePath = gamePages[id];
        
        console.log(`[Step 1] Visiting game page to get cookies: ${gamePath}`);
        
        const options = {
            hostname: 'www.myabandonware.com',
            path: gamePath,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const req = https.request(options, (res) => {
            const cookies = res.headers['set-cookie'];
            const cookieStr = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
            
            console.log(`[Step 2] Requesting download link with cookies...`);
            const downloadOptions = {
                hostname: 'www.myabandonware.com',
                path: `/download/${id}`,
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': `https://www.myabandonware.com${gamePath}`,
                    'Cookie': cookieStr
                }
            };
            
            const downloadReq = https.request(downloadOptions, (downloadRes) => {
                let data = '';
                downloadRes.on('data', (chunk) => { data += chunk; });
                downloadRes.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.url) resolve({ url: json.url, cookie: cookieStr });
                        else reject(new Error("URL not found in response"));
                    } catch (e) {
                        console.error(`RAW Response for ${id} [Status ${downloadRes.statusCode}]:`, data);
                        reject(e);
                    }
                });
            });
            downloadReq.on('error', reject);
            downloadReq.end();
        });
        req.on('error', reject);
        req.end();
    });
}

// Helper to extract zip
function extractZip(src, dest) {
    console.log(`Extracting ${src}...`);
    if (isWindows) {
        execSync(`powershell -Command "Expand-Archive -Path '${src}' -DestinationPath '${dest}' -Force"`);
    } else {
        execSync(`unzip -o "${src}" -d "${dest}"`);
    }
}

async function main() {
    console.log("Starting Super A'Can preparation script...");
    
    if (!fs.existsSync(romDir)) {
        fs.mkdirSync(romDir, { recursive: true });
    }

    // 1. Download BIOS
    console.log("\n=== Downloading BIOS ===");
    const bios = [
        { name: 'supracan.zip', url: 'https://mdk.cab/download/split/supracan.zip' },
        { name: 'umc6650.zip', url: 'https://mdk.cab/download/split/umc6650.zip' }
    ];

    for (const b of bios) {
        const dest = path.join(romDir, b.name);
        if (!fs.existsSync(dest)) {
            console.log(`Downloading ${b.name}...`);
            await downloadFile(b.url, dest);
        } else {
            console.log(`${b.name} already exists.`);
        }
    }

    // 2. Download Games from Archive.org
    console.log("\n=== Downloading Games from Archive.org ===");
    const zipDest = path.join(romDir, 'ROMS.zip');
    
    const archiveGames = [
        'boomzoo', 'formduel', 'jttlaugh', 'monopoly', 
        'sangofgt', 'slghtsag', 'sonevil', 'speedyd', 'staiwbbl'
    ];
    
    let allExist = true;
    for (const id of archiveGames) {
        const binPath = path.join(romDir, `${id}.bin`);
        const zipPath = path.join(romDir, `${id}.zip`);
        if (!fs.existsSync(binPath) && !fs.existsSync(zipPath)) {
            allExist = false;
            break;
        }
    }

    if (allExist) {
        console.log("✅ 所有 9 款 Archive.org 遊戲均已存在 (.bin 或 .zip)，跳過下載。");
    } else {
        if (!fs.existsSync(zipDest)) {
            console.log("Downloading ROMS.zip...");
            await downloadFile('https://archive.org/download/FuntechSuperAcan_201809/ROMS.zip', zipDest);
        } else {
            console.log("ROMS.zip already exists.");
        }

        // Extract Games
        extractZip(zipDest, romDir);

        // Rename Games
        console.log("Renaming game files...");
        const map = {
            'Boom Zoo (Taiwan).bin': 'boomzoo.bin',
            'Formosa Duel (Taiwan).bin': 'formduel.bin',
            'Journey to the Laugh (Taiwan).bin': 'jttlaugh.bin',
            'Monopoly - Adventure in Africa (Taiwan).bin': 'monopoly.bin',
            'Sango Fighter (Taiwan).bin': 'sangofgt.bin',
            'Super Dragon Force (Taiwan).zip': 'slghtsag.zip',
            'The Son of Evil (Taiwan).bin': 'sonevil.bin',
            'Speedy Dragon (Taiwan).bin': 'speedyd.bin',
            'Super Taiwanese Baseball League (Taiwan).bin': 'staiwbbl.bin'
        };

        for (const [key, value] of Object.entries(map)) {
            const src = path.join(romDir, key);
            const dest = path.join(romDir, value);
            if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
                console.log(`Renamed ${key} to ${value}`);
            }
        }

        // Clean up
        if (fs.existsSync(zipDest)) {
            fs.unlinkSync(zipDest);
            console.log("Cleaned up ROMS.zip");
        }
    }

    // 3. Download Games from MyAbandonware
    console.log("\n=== Downloading Games from MyAbandonware ===");
    const abandonGames = [
        { id: 'pbmq-du-ba', name: 'gamblord.zip' },
        { id: 'pbmx-magical-pool', name: 'magipool.zip' },
        { id: 'pbn2-rebel', name: 'rebelst.zip' }
    ];

    for (const g of abandonGames) {
        const dest = path.join(romDir, g.name);
        if (!fs.existsSync(dest)) {
            console.log(`Fetching link for ${g.name}...`);
            try {
                const { url, cookie } = await fetchAbandonwareUrl(g.id);
                console.log(`Downloading ${g.name} from ${url}...`);
                await downloadFile(url, dest, { 'Cookie': cookie });
            } catch (e) {
                console.error(`Failed to download ${g.name}:`, e.message);
            }
        } else {
            console.log(`${g.name} already exists.`);
        }
    }

    console.log("\nDone! All files are prepared in roms/supracan/");
    process.exit(0);
}

// Check if run directly or as a helper
const id = process.argv[2];
if (id) {
    fetchAbandonwareUrl(id).then(console.log).catch(err => {
        console.error(err.message);
        process.exit(1);
    });
} else {
    main().catch(console.error);
}

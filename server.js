const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.zip': 'application/zip',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    let fileToRead = filePath;
    let isGzipped = false;

    // Check if we should serve a gzipped version for WASM
    if (extname === '.wasm' && fs.existsSync(filePath + '.gz')) {
        fileToRead = filePath + '.gz';
        isGzipped = true;
    }

    fs.readFile(fileToRead, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            // Enable COOP and COEP for SharedArrayBuffer (important for some WASM builds)
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            
            if (isGzipped) {
                res.setHeader('Content-Encoding', 'gzip');
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Super A'Can Web Server is running!`);
    console.log(`🔗 Access it at: http://localhost:${PORT}`);
    console.log(`按 Ctrl+C 停止伺服器 (Press Ctrl+C to stop)\n`);
});

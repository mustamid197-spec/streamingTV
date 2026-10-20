const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mpd': 'application/dash+xml',
    '.m3u8': 'application/vnd.apple.mpegurl',
    '.ts': 'video/mp2t',
    '.m4s': 'video/iso.segment',
    '.mp4': 'video/mp4',
    '.webp': 'image/webp'
};

function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);
    let cleanPath = pathname.replace(/^\/+/, '');
    if (!cleanPath || cleanPath === '') {
        cleanPath = 'index.html';
    }

    // Try resolving in process.cwd() or __dirname
    let filePath = path.join(process.cwd(), cleanPath);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, cleanPath);
    }

    // Check cleanUrl: if not found, test with .html extension
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found: ' + pathname);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'public, max-age=3600'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
}

// Export for Vercel Serverless Function
module.exports = handler;

// Run locally if executed directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const server = http.createServer(handler);
    server.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`KusoTV Streaming Server is running!`);
        console.log(`URL: http://localhost:${PORT}`);
        console.log(`===============================================`);
    });
}

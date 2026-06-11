const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3456;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);

    // CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // API: save file
    if (req.method === 'POST' && parsed.pathname === '/api/save') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { filePath, content } = JSON.parse(body);
                const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
                const fullPath = path.join(ROOT, safePath);
                if (!fullPath.startsWith(ROOT)) {
                    res.writeHead(403);
                    return res.end(JSON.stringify({ error: 'path traversal blocked' }));
                }
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`[saved] ${safePath}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch (e) {
                console.error('[error]', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Static file serving
    let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
    filePath = path.join(ROOT, decodeURIComponent(filePath));
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }
    const ext = path.extname(filePath);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not Found');
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n  WDHJ 开发服务器已启动`);
    console.log(`  首页: http://localhost:${PORT}/`);
    console.log(`  编辑器: http://localhost:${PORT}/editor.html`);
    console.log(`  保存 API: POST http://localhost:${PORT}/api/save`);
    console.log(`\n  编辑器保存时会自动写入文件，修改后直接 git commit + push 即可。\n`);
});

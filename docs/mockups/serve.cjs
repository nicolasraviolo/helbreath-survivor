// Servidor estático mínimo para ver los bocetos de docs/mockups en http://localhost:8095
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, types = { '.html': 'text/html', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css' };
http.createServer((req, res) => {
    let p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    fs.readFile(p, (err, data) => {
        if (err) { res.writeHead(404); return res.end('404'); }
        res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
        res.end(data);
    });
}).listen(8095, () => console.log('mockups on http://localhost:8095'));

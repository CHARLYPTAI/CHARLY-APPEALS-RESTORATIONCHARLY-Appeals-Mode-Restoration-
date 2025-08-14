const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url === '/') {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>CHARLY Test Server Working!</h1><p>Node.js server successfully running.</p>');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3333, '127.0.0.1', () => {
  console.log('Test server running on http://127.0.0.1:3333/');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
// Simple Node HTTP server test
const http = require('http');

const port = 4101;
const host = '127.0.0.1';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Simple server works!' }));
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`✅ Simple HTTP server listening on http://${host}:${port}`);
  console.log('Test with: Invoke-RestMethod -Uri "http://127.0.0.1:4101" -Method Get');
});

// Keep alive
setInterval(() => {
  console.log(`Server still running... (${new Date().toLocaleTimeString()})`);
}, 5000);

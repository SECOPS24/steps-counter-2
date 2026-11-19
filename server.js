const http = require('http');

const PORT = process.env.PORT || 3000;

// In-memory store: { 'YYYY-MM-DD': totalSteps }
const days = {};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Steps Counter</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { margin-bottom: 0.25rem; }
    .total { font-size: 3rem; font-weight: 700; margin: 0.5rem 0; }
    form { display: flex; gap: 0.5rem; margin: 1rem 0; }
    input { flex: 1; padding: 0.6rem; font-size: 1rem; border: 1px solid #bbb; border-radius: 6px; }
    button { padding: 0.6rem 1rem; font-size: 1rem; border: 0; border-radius: 6px; background: #2563eb; color: #fff; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    td { padding: 0.4rem 0; border-bottom: 1px solid #eee; }
    td.n { text-align: right; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <h1>Steps Counter</h1>
  <div>Today (<span id="date"></span>)</div>
  <div class="total" id="total">0</div>
  <form id="add">
    <input type="number" id="steps" min="1" step="1" placeholder="Steps to add" required>
    <button type="submit">Add</button>
  </form>
  <h2>History</h2>
  <table><tbody id="history"></tbody></table>
  <script>
    async function load() {
      const r = await fetch('/api/history');
      const data = await r.json();
      document.getElementById('date').textContent = data.today;
      document.getElementById('total').textContent = data.todayTotal.toLocaleString();
      document.getElementById('history').innerHTML = data.history
        .map(d => '<tr><td>' + d.date + '</td><td class="n">' + d.steps.toLocaleString() + '</td></tr>')
        .join('');
    }
    document.getElementById('add').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('steps');
      await fetch('/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: Number(input.value) })
      });
      input.value = '';
      load();
    });
    load();
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(PAGE);
  }

  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && req.url === '/api/history') {
    const t = today();
    const history = Object.keys(days)
      .sort()
      .reverse()
      .map(date => ({ date, steps: days[date] }));
    return sendJson(res, 200, { today: t, todayTotal: days[t] || 0, history });
  }

  if (req.method === 'POST' && req.url === '/api/steps') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1e4) req.destroy(); });
    req.on('end', () => {
      let body;
      try { body = JSON.parse(raw || '{}'); } catch (_) {
        return sendJson(res, 400, { error: 'invalid JSON' });
      }
      const n = Number(body.steps);
      if (!Number.isInteger(n) || n <= 0 || n > 200000) {
        return sendJson(res, 400, { error: 'steps must be a whole number between 1 and 200000' });
      }
      const t = today();
      days[t] = (days[t] || 0) + n;
      return sendJson(res, 200, { today: t, todayTotal: days[t] });
    });
    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Steps Counter listening on port ${PORT}`);
});

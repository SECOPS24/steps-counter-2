# Steps Counter

A small web app to log daily step counts, see today's running total, and view a history of past days.

- `GET /` - web UI
- `GET /health` - health check (used by FUSE)
- `GET /api/history` - today's total and daily history
- `POST /api/steps` - body `{ "steps": 1234 }` adds steps to today

Port: 3000. Storage is in-memory (resets on restart); no database.

Local run: `docker compose up -d --build` then open http://localhost:3000.

// Local development server (NOT used by Vercel in production).
// Vercel serves /public as static files and /api/* as serverless functions.
// This Express server mirrors that locally so you can run `npm start`
// without the Vercel CLI. It serves the static frontend from /public and
// implements the same /api/config endpoint, reading Supabase credentials
// from a local .env file (Vercel injects env vars automatically in prod).

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Tiny .env loader (no extra dependency) for local dev.
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    });
  }
} catch (e) { /* ignore */ }

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(cors());
app.use(express.static(PUBLIC_DIR));

// Same endpoint as the Vercel serverless function /api/config.js.
app.get('/api/config', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return res.status(500).json({
      error: 'SUPABASE_URL / SUPABASE_ANON_KEY not set. Copy .env.example to .env and fill in your project values.'
    });
  }
  res.json({ url, anonKey });
});

// Route aliases matching the Vercel rewrites (cleanUrls handles the rest).
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'spin.html')));
app.get('/spin', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'spin.html')));
app.get('/knockout', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'knockout.html')));
app.get('/edit', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'edit.html')));
app.get('/manager', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'edit.html')));

app.listen(PORT, () => {
  console.log(`Spin Wheel (local dev) running at http://localhost:${PORT}`);
  console.log(`  Spin:     http://localhost:${PORT}/spin`);
  console.log(`  Knockout: http://localhost:${PORT}/knockout`);
  console.log(`  Manager:  http://localhost:${PORT}/edit`);
  if (!process.env.SUPABASE_URL) {
    console.log('\n  NOTE: SUPABASE_URL not set. Copy .env.example to .env and fill it in.');
  }
});

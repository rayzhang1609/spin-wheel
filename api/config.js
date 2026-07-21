// Vercel Serverless Function: /api/config
// Returns the public Supabase credentials to the browser. The anon key is
// safe to expose publicly because all access is gated by Row Level
// Security (see supabase/schema.sql). The service_role key is NEVER
// exposed here.
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'SUPABASE_URL / SUPABASE_ANON_KEY env vars are not set on the server.'
    }));
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ url, anonKey }));
};

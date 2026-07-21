// Shared Supabase client for the spin-wheel app.
// Loads credentials from /api/config (a Vercel serverless function that
// reads SUPABASE_URL + SUPABASE_ANON_KEY from env, so keys are never
// committed to the repo). The anon key is public by design; tables are
// protected by Row Level Security (see supabase/schema.sql).
let _client = null;
let _initPromise = null;

async function getSupabase() {
  if (_client) return _client;
  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('/api/config returned ' + res.status);
        const cfg = await res.json();
        if (!cfg.url || !cfg.anonKey) throw new Error('missing supabase url/anonKey');
        const factory = window.supabase && window.supabase.createClient;
        if (!factory) throw new Error('@supabase/supabase-js not loaded');
        _client = factory(cfg.url, cfg.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        return _client;
      } catch (e) {
        _initPromise = null; // allow a later retry
        console.warn('[supabase] init failed:', e.message);
        throw e;
      }
    })();
  }
  await _initPromise;
  return _client;
}

// Read a single-row config table (spin_config / knockout_config).
// Returns the JSON stored in the `data` column, or null if not found.
async function loadConfigRow(table) {
  const sb = await getSupabase();
  const { data, error } = await sb.from(table).select('data').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data && data.data ? data.data : null;
}

// Upsert a config row (id=1). payload is the JSON to store in `data`.
async function saveConfigRow(table, payload) {
  const sb = await getSupabase();
  const { error } = await sb
    .from(table)
    .upsert({ id: 1, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
}

// Insert a completed-spin result. row shape matches the result tables.
async function insertResult(table, row) {
  const sb = await getSupabase();
  const { error } = await sb.from(table).insert(row);
  if (error) throw error;
}

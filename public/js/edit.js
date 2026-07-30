let activeKey = 'spin';
let wheel = null;
let data = { spin: null, knockout: null };
let pollTimer = null;
let lastSavedJson = { spin: '', knockout: '' };

const CONFIG_TABLE = { spin: 'spin_config', knockout: 'knockout_config' };

const tabBtns = document.querySelectorAll('.tab-btn');
const editorItems = document.getElementById('editorItems');
const addItemBtn = document.getElementById('addItemBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const itemCount = document.getElementById('itemCount');
const activeName = document.getElementById('activeName');
const bulkAddBtn = document.getElementById('bulkAddBtn');
const bulkTextarea = document.getElementById('bulkTextarea');
const fileImport = document.getElementById('fileImport');
const clearAllBtn = document.getElementById('clearAllBtn');
const generatePreviewBtn = document.getElementById('generatePreviewBtn');
const downloadPreviewBtn = document.getElementById('downloadPreviewBtn');
const previewOutput = document.getElementById('previewOutput');
const previewCount = document.getElementById('previewCount');

const DEFAULTS = {
  spin: {
    items: [
      { label: 'Yay!', color: '#FF69B4', emoji: '🎊', probability: 50, isDefault: true },
      { label: 'Yes!', color: '#38B6FF', emoji: '✨', probability: 50, isDefault: true }
    ],
    spinDuration: 5000, minSpins: 5, maxSpins: 10
  },
  knockout: {
    items: [
      { label: 'Alex', color: '#FF6B6B', emoji: '🦊', probability: 12.5, isDefault: true },
      { label: 'Sam', color: '#38B6FF', emoji: '🐼', probability: 12.5, isDefault: true },
      { label: 'Jordan', color: '#FFD93D', emoji: '🐰', probability: 12.5, isDefault: true },
      { label: 'Taylor', color: '#6BCB77', emoji: '🐸', probability: 12.5, isDefault: true },
      { label: 'Casey', color: '#FF8E72', emoji: '🐯', probability: 12.5, isDefault: true },
      { label: 'Riley', color: '#C084FC', emoji: '🦉', probability: 12.5, isDefault: true },
      { label: 'Morgan', color: '#4D96FF', emoji: '🐵', probability: 12.5, isDefault: true },
      { label: 'Jamie', color: '#FF6B9D', emoji: '🐶', probability: 12.5, isDefault: true }
    ],
    spinDuration: 5000, minSpins: 5, maxSpins: 10
  }
};

const RAINBOW = ['#FF9800', '#FF5252', '#E91E8C', '#7B4FE0', '#5C6BC0', '#42A5F5', '#66BB6A', '#C0CA33'];

// Remove all items flagged as defaults. Called before paste/import adds
// new items so defaults don't linger alongside real imported choices.
function removeDefaultItems(items) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].isDefault === true) items.splice(i, 1);
  }
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function ensureProbabilities(items) {
  const n = items.length;
  if (!n) return;
  const equal = 100 / n;
  let total = 0;
  items.forEach(item => {
    if (typeof item.probability !== 'number' || isNaN(item.probability)) {
      item.probability = equal;
    }
    total += item.probability;
  });
  if (Math.abs(total - 100) > 0.5) {
    items.forEach(item => { item.probability = equal; });
  }
}

function setActive(key) {
  activeKey = key;
  tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.key === key));
  activeName.textContent = key === 'spin' ? 'Spin Wheel' : 'Knockout Wheel';
  if (wheel && data[key]) {
    ensureProbabilities(data[key].items);
    wheel.setItems(data[key].items);
  }
  renderEditorItems();
  loadSettings();
}

tabBtns.forEach(btn => btn.addEventListener('click', () => setActive(btn.dataset.key)));

async function loadKey(key) {
  try {
    const cfg = await loadConfigRow(CONFIG_TABLE[key]);
    if (cfg && Array.isArray(cfg.items) && cfg.items.length >= 2) {
      // Backfill isDefault on legacy data: if items match the original
      // default labels exactly and don't already have isDefault set,
      // flag them so paste/import can replace them.
      const def = DEFAULTS[key];
      if (def && def.items) {
        const matchDefaults = cfg.items.length === def.items.length &&
          cfg.items.every((it, i) => it.label === def.items[i].label && !it.isDefault);
        if (matchDefaults) {
          cfg.items.forEach(it => { it.isDefault = true; });
        }
      }
      data[key] = cfg;
      lastSavedJson[key] = JSON.stringify(cfg);
      return;
    }
  } catch (e) {
    console.warn('[edit] load ' + key + ' failed, using default:', e.message);
  }
  data[key] = JSON.parse(JSON.stringify(DEFAULTS[key]));
  lastSavedJson[key] = JSON.stringify(data[key]);
}

async function init() {
  await Promise.all([loadKey('spin'), loadKey('knockout')]);
  ensureProbabilities(data.spin.items);
  ensureProbabilities(data.knockout.items);
  wheel = new SpinWheel('wheelCanvas', { items: data[activeKey].items, onSpinEnd: () => {} });
  setActive('spin');
  startPolling();
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    for (const key of ['spin', 'knockout']) {
      try {
        const cfg = await loadConfigRow(CONFIG_TABLE[key]);
        if (!cfg) continue;
        const json = JSON.stringify(cfg);
        if (json !== lastSavedJson[key]) {
          data[key] = cfg;
          lastSavedJson[key] = json;
          if (key === activeKey) {
            const focused = document.activeElement;
            const editing = focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA');
            if (!editing) {
              if (wheel) wheel.setItems(cfg.items);
              renderEditorItems();
              loadSettings();
            }
          }
        }
      } catch (e) { /* ignore poll errors */ }
    }
  }, 4000);
}

function loadSettings() {
  const d = data[activeKey];
  if (!d) return;
  document.getElementById('spinDuration').value = d.spinDuration || 5000;
  document.getElementById('minSpins').value = d.minSpins || 5;
  document.getElementById('maxSpins').value = d.maxSpins || 10;
}

function renderEditorItems() {
  const d = data[activeKey];
  if (!d) return;
  ensureProbabilities(d.items);
  editorItems.innerHTML = '';
  itemCount.textContent = `${d.items.length} item${d.items.length === 1 ? '' : 's'}`;

  d.items.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'editor-item';
    row.innerHTML = `
      <span class="item-num">${i + 1}</span>
      <div class="color-dot" style="background:${item.color}"></div>
      <input type="color" value="${item.color}" data-idx="${i}" class="item-color" title="Color">
      <input type="text" value="${escapeHtml(item.label)}" data-idx="${i}" class="item-label" placeholder="Label">
      <input type="text" value="${escapeHtml(item.emoji || '')}" data-idx="${i}" class="item-emoji" placeholder="Icon" maxlength="4">
      <input type="number" value="${(item.probability || 0).toFixed(1)}" data-idx="${i}" class="item-prob" min="0" max="100" step="0.1" title="Win probability %">
      <span class="prob-unit">%</span>
      <label class="prioritized-toggle" title="When a peg stops beside this wedge, it rebounds onto this wedge.">
        <input type="checkbox" data-idx="${i}" class="item-prioritized" ${item.prioritized ? 'checked' : ''}>
        <span>Prioritized</span>
      </label>
      <button class="move-btn" data-idx="${i}" data-dir="up" title="Move up">&#9650;</button>
      <button class="move-btn" data-idx="${i}" data-dir="down" title="Move down">&#9660;</button>
      <button class="del-btn" data-idx="${i}" title="Delete">&times;</button>
    `;
    editorItems.appendChild(row);
  });
}

async function saveActive() {
  const payload = data[activeKey];
  try {
    await saveConfigRow(CONFIG_TABLE[activeKey], payload);
    lastSavedJson[activeKey] = JSON.stringify(payload);
  } catch (e) {
    console.warn('[edit] save failed:', e.message);
    alert('Save failed: ' + (e.message || 'could not write to Supabase. Check RLS / config.'));
  }
}

// Probability auto-adjust: when one changes, scale the rest to fill the remainder.
function adjustProbabilities(changedIdx, newVal) {
  const items = data[activeKey].items;
  const n = items.length;
  if (n <= 1) return;
  newVal = Math.max(0, Math.min(100, parseFloat(newVal) || 0));
  items[changedIdx].probability = newVal;
  const remainder = 100 - newVal;
  const others = items.filter((_, i) => i !== changedIdx);
  const otherTotal = others.reduce((s, it) => s + (it.probability || 0), 0);
  if (otherTotal > 0 && remainder > 0) {
    others.forEach(it => {
      it.probability = (it.probability / otherTotal) * remainder;
    });
  } else if (remainder > 0) {
    others.forEach(it => { it.probability = remainder / others.length; });
  } else {
    others.forEach(it => { it.probability = 0; });
  }
}

editorItems.addEventListener('input', (e) => {
  const t = e.target;
  if (t.classList.contains('item-color')) {
    const idx = parseInt(t.dataset.idx);
    data[activeKey].items[idx].color = t.value;
    const dot = t.closest('.editor-item').querySelector('.color-dot');
    if (dot) dot.style.background = t.value;
    if (wheel) wheel.setItems(data[activeKey].items);
  } else if (t.classList.contains('item-prob')) {
    const idx = parseInt(t.dataset.idx);
    adjustProbabilities(idx, t.value);
    // Update all prob inputs in the DOM without full re-render
    data[activeKey].items.forEach((item, i) => {
      const inp = editorItems.querySelector(`.item-prob[data-idx="${i}"]`);
      if (inp && i !== idx) inp.value = item.probability.toFixed(1);
    });
  }
});

editorItems.addEventListener('change', async (e) => {
  const t = e.target;
  const idx = parseInt(t.dataset.idx);
  if (Number.isNaN(idx)) return;
  // Any manual edit to a default item promotes it to a real item.
  if (data[activeKey].items[idx].isDefault) delete data[activeKey].items[idx].isDefault;
  if (t.classList.contains('item-label')) {
    data[activeKey].items[idx].label = t.value;
    await saveActive();
  } else if (t.classList.contains('item-emoji')) {
    data[activeKey].items[idx].emoji = t.value;
    await saveActive();
  } else if (t.classList.contains('item-color')) {
    data[activeKey].items[idx].color = t.value;
    await saveActive();
  } else if (t.classList.contains('item-prioritized')) {
    data[activeKey].items[idx].prioritized = t.checked;
    await saveActive();
  } else if (t.classList.contains('item-prob')) {
    adjustProbabilities(idx, t.value);
    await saveActive();
    renderEditorItems();
  }
});

editorItems.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx);
  if (btn.classList.contains('del-btn')) {
    if (data[activeKey].items.length <= 2) return alert('Need at least 2 items.');
    data[activeKey].items.splice(idx, 1);
    ensureProbabilities(data[activeKey].items);
    await saveActive();
    renderEditorItems();
    if (wheel) wheel.setItems(data[activeKey].items);
  } else if (btn.classList.contains('move-btn')) {
    const dir = btn.dataset.dir;
    const arr = data[activeKey].items;
    if (dir === 'up' && idx > 0) {
      [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
    } else if (dir === 'down' && idx < arr.length - 1) {
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    } else return;
    await saveActive();
    renderEditorItems();
  }
});

addItemBtn.addEventListener('click', async () => {
  const label = document.getElementById('newLabel').value.trim();
  const color = document.getElementById('newColor').value;
  const emoji = document.getElementById('newEmoji').value.trim();
  if (!label) return;
  data[activeKey].items.push({ label, color, emoji, prioritized: false, probability: 0 });
  ensureProbabilities(data[activeKey].items);
  await saveActive();
  renderEditorItems();
  if (wheel) wheel.setItems(data[activeKey].items);
  document.getElementById('newLabel').value = '';
  document.getElementById('newEmoji').value = '';
});

// ===== Bulk add from textarea =====
bulkAddBtn.addEventListener('click', async () => {
  const text = bulkTextarea.value.trim();
  if (!text) return;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;
  const items = data[activeKey].items;
  removeDefaultItems(items);
  lines.forEach((line, i) => {
    items.push({
      label: line,
      color: RAINBOW[items.length % RAINBOW.length],
      emoji: '',
      prioritized: false,
      probability: 0
    });
  });
  ensureProbabilities(items);
  await saveActive();
  renderEditorItems();
  if (wheel) wheel.setItems(items);
  bulkTextarea.value = '';
});

// ===== File import — parses .xlsx/.xls, .docx, .txt/.csv =====
function getExt(name) {
  const m = /\.([^.]+)$/.exec(name);
  return m ? m[1].toLowerCase() : '';
}

function addLinesAsItems(lines) {
  const cleaned = lines.map(l => l.trim()).filter(Boolean);
  if (!cleaned.length) return 0;
  const items = data[activeKey].items;
  removeDefaultItems(items);
  cleaned.forEach(line => {
    items.push({
      label: line,
      color: RAINBOW[items.length % RAINBOW.length],
      emoji: '',
      prioritized: false,
      probability: 0
    });
  });
  return cleaned.length;
}

async function parseSpreadsheet(file) {
  const buf = await file.arrayBuffer();
  const wb = window.XLSX.read(buf, { type: 'array' });
  const lines = [];
  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
    rows.forEach(row => {
      if (Array.isArray(row)) {
        // Use first non-empty cell as the item label
        const val = row.find(c => c != null && String(c).trim());
        if (val != null) lines.push(String(val).trim());
      }
    });
  });
  return lines;
}

async function parseDocx(file) {
  const buf = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
  return result.value.split(/\r?\n/);
}

async function parsePlainText(file) {
  const text = await file.text();
  return text.split(/\r?\n/);
}

fileImport.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const ext = getExt(file.name);
    let lines;

    if (ext === 'xlsx' || ext === 'xls') {
      lines = await parseSpreadsheet(file);
    } else if (ext === 'docx') {
      lines = await parseDocx(file);
    } else if (ext === 'doc') {
      // Legacy .doc (not zip-based) — attempt plain text, warn if binary
      const text = await file.text();
      if (text.includes('\0') || text.startsWith('PK')) {
        alert('Legacy .doc files are not supported. Please convert to .docx or .txt.');
        fileImport.value = '';
        return;
      }
      lines = text.split(/\r?\n/);
    } else {
      // .txt, .csv, or anything else — plain text line split
      lines = await parsePlainText(file);
    }

    const added = addLinesAsItems(lines);
    if (!added) { alert('No valid lines found in file.'); fileImport.value = ''; return; }
    ensureProbabilities(data[activeKey].items);
    await saveActive();
    renderEditorItems();
    if (wheel) wheel.setItems(data[activeKey].items);
  } catch (err) {
    alert('File import failed: ' + err.message);
  }
  fileImport.value = '';
});

// ===== Clear all =====
clearAllBtn.addEventListener('click', async () => {
  if (!confirm('Delete ALL choices for ' + (activeKey === 'spin' ? 'Spin Wheel' : 'Knockout Wheel') + '? This cannot be undone.')) return;
  data[activeKey].items = [
    { label: 'Choice 1', color: '#FF69B4', emoji: '', prioritized: false, probability: 50, isDefault: true },
    { label: 'Choice 2', color: '#38B6FF', emoji: '', prioritized: false, probability: 50, isDefault: true }
  ];
  await saveActive();
  renderEditorItems();
  if (wheel) wheel.setItems(data[activeKey].items);
});

// ===== Spin outcome preview generator =====
let lastPreviewText = '';

generatePreviewBtn.addEventListener('click', () => {
  const items = data[activeKey].items;
  if (!items || items.length < 2) { alert('Need at least 2 items.'); return; }
  ensureProbabilities(items);
  const count = Math.max(1, Math.min(1000, parseInt(previewCount.value) || 10));
  const weights = items.map(it => Math.max(0, it.probability || 0));
  const totalW = weights.reduce((a, b) => a + b, 0);
  if (totalW <= 0) { alert('Probabilities must sum to > 0.'); return; }

  const results = [];
  const tally = {};
  for (let s = 0; s < count; s++) {
    let r = Math.random() * totalW;
    let picked = 0;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) { picked = i; break; }
    }
    const label = items[picked].label;
    results.push((s + 1) + '. ' + label);
    tally[label] = (tally[label] || 0) + 1;
  }

  let out = '=== Spin Outcome Preview ===\n';
  out += 'Wedge: ' + activeKey + ' | Spins: ' + count + '\n\n';
  out += results.join('\n') + '\n\n';
  out += '=== Summary ===\n';
  Object.keys(tally).sort((a, b) => tally[b] - tally[a]).forEach(label => {
    const c = tally[label];
    const pct = (c / count * 100).toFixed(1);
    out += label + ': ' + c + ' (' + pct + '%)\n';
  });

  previewOutput.value = out;
  lastPreviewText = out;
  downloadPreviewBtn.disabled = false;
});

downloadPreviewBtn.addEventListener('click', () => {
  if (!lastPreviewText) return;
  const blob = new Blob([lastPreviewText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spin-preview-' + activeKey + '-' + Date.now() + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

saveSettingsBtn.addEventListener('click', async () => {
  data[activeKey].spinDuration = parseInt(document.getElementById('spinDuration').value) || 5000;
  data[activeKey].minSpins = parseInt(document.getElementById('minSpins').value) || 5;
  data[activeKey].maxSpins = parseInt(document.getElementById('maxSpins').value) || 10;
  await saveActive();
  const original = saveSettingsBtn.textContent;
  saveSettingsBtn.textContent = 'Saved';
  saveSettingsBtn.classList.add('saved');
  setTimeout(() => {
    saveSettingsBtn.textContent = original;
    saveSettingsBtn.classList.remove('saved');
  }, 1400);
});

init();

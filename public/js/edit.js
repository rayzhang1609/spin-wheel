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

const DEFAULTS = {
  spin: {
    items: [
      { label: 'Yay!', color: '#FF69B4', emoji: '🎊' },
      { label: 'Yes!', color: '#38B6FF', emoji: '✨' }
    ],
    spinDuration: 5000, minSpins: 5, maxSpins: 10
  },
  knockout: {
    items: [
      { label: 'Alex', color: '#FF6B6B', emoji: '🦊' },
      { label: 'Sam', color: '#38B6FF', emoji: '🐼' },
      { label: 'Jordan', color: '#FFD93D', emoji: '🐰' },
      { label: 'Taylor', color: '#6BCB77', emoji: '🐸' },
      { label: 'Casey', color: '#FF8E72', emoji: '🐯' },
      { label: 'Riley', color: '#C084FC', emoji: '🦉' },
      { label: 'Morgan', color: '#4D96FF', emoji: '🐵' },
      { label: 'Jamie', color: '#FF6B9D', emoji: '🐶' }
    ],
    spinDuration: 5000, minSpins: 5, maxSpins: 10
  }
};

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function setActive(key) {
  activeKey = key;
  tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.key === key));
  activeName.textContent = key === 'spin' ? 'Spin Wheel' : 'Knockout Wheel';
  if (wheel && data[key]) wheel.setItems(data[key].items);
  renderEditorItems();
  loadSettings();
}

tabBtns.forEach(btn => btn.addEventListener('click', () => setActive(btn.dataset.key)));

async function loadKey(key) {
  try {
    const cfg = await loadConfigRow(CONFIG_TABLE[key]);
    if (cfg && Array.isArray(cfg.items) && cfg.items.length >= 2) {
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
  wheel = new SpinWheel('wheelCanvas', { items: data[activeKey].items, onSpinEnd: () => {} });
  setActive('spin');
  startPolling();
}

// Poll for live edits made from another tab/device.
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    for (const key of ['spin', 'knockout']) {
      try {
        const cfg = await loadConfigRow(CONFIG_TABLE[key]);
        if (!cfg) continue;
        const json = JSON.stringify(cfg);
        if (json !== lastSavedJson[key]) {
          // Only clobber the local copy if we're not actively editing that tab,
          // to avoid wiping in-progress changes. We update the non-active tab
          // freely; for the active tab we update items only if the editor
          // inputs aren't focused.
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

editorItems.addEventListener('input', (e) => {
  const t = e.target;
  if (t.classList.contains('item-color')) {
    const idx = parseInt(t.dataset.idx);
    data[activeKey].items[idx].color = t.value;
    const dot = t.closest('.editor-item').querySelector('.color-dot');
    if (dot) dot.style.background = t.value;
    if (wheel) wheel.setItems(data[activeKey].items);
  }
});

editorItems.addEventListener('change', async (e) => {
  const t = e.target;
  const idx = parseInt(t.dataset.idx);
  if (Number.isNaN(idx)) return;
  if (t.classList.contains('item-label')) {
    data[activeKey].items[idx].label = t.value;
    await saveActive();
  } else if (t.classList.contains('item-emoji')) {
    data[activeKey].items[idx].emoji = t.value;
    await saveActive();
  } else if (t.classList.contains('item-color')) {
    data[activeKey].items[idx].color = t.value;
    await saveActive();
  }
});

editorItems.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx);
  if (btn.classList.contains('del-btn')) {
    if (data[activeKey].items.length <= 2) return alert('Need at least 2 items.');
    data[activeKey].items.splice(idx, 1);
    await saveActive();
    renderEditorItems();
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
  data[activeKey].items.push({ label, color, emoji });
  await saveActive();
  renderEditorItems();
  document.getElementById('newLabel').value = '';
  document.getElementById('newEmoji').value = '';
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

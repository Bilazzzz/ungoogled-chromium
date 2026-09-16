/**
 * Модуль анимаций: observer для fade-in, hover-эффекты.
 */

import { $$ } from './utils.js';
import { storage } from './storage.js';

let animationsEnabled = true;

export async function initAnimations() {
  const settings = await storage.get('settings');
  animationsEnabled = settings.animations !== false;
  applyMotionPref();
}

export function applyMotionPref() {
  document.documentElement.style.setProperty(
    '--motion', animationsEnabled ? '1' : '0'
  );
  if (!animationsEnabled) {
    document.documentElement.classList.add('reduce-motion');
  } else {
    document.documentElement.classList.remove('reduce-motion');
  }
}

export function setAnimationsEnabled(enabled) {
  animationsEnabled = enabled;
  applyMotionPref();
}

/** Наблюдатель за появлением элементов */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

export function observe(selector) {
  $$(selector).forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

export function refreshObserver(selector) {
  $$(selector).forEach(el => observer.observe(el));
}/**
 * Категории: табы, сортировка, закрепление, сворачивание.
 */

import { $, el, toast } from './utils.js';
import { storage } from './storage.js';
import { renderShortcuts } from './shortcuts.js';

export const state = {
  categories: [],
  activeCategory: 'all'
};

export async function loadCategories() {
  state.categories = await storage.get('categories');
}

export async function saveCategories() {
  await storage.set('categories', state.categories);
}

export function renderCategoryTabs() {
  const wrap = $('#categories-tabs');
  if (!wrap) return;
  wrap.innerHTML = '';

  const sorted = [...state.categories].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  sorted.forEach(cat => {
    const btn = el('button', {
      class: `cat-tab ${cat.id === state.activeCategory ? 'active' : ''} ${cat.pinned ? 'pinned' : ''}`,
      'data-id': cat.id,
      draggable: 'true'
    }, cat.name);

    btn.addEventListener('click', () => {
      state.activeCategory = cat.id;
      renderCategoryTabs();
      renderShortcuts();
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openCategoryEditor(cat.id);
    });

    attachTabDrag(btn, cat.id);
    wrap.appendChild(btn);
  });

  const addBtn = el('button', {
    class: 'cat-tab',
    style: 'opacity:0.6;',
    onclick: () => openCategoryEditor(null)
  }, '＋');
  wrap.appendChild(addBtn);
}

function attachTabDrag(node, id) {
  node.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', id);
  });
  node.addEventListener('dragover', (e) => e.preventDefault());
  node.addEventListener('drop', async (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId === id) return;

    // Если это категория — меняем порядок категорий
    if (state.categories.find(c => c.id === draggedId)) {
      const dragIdx = state.categories.findIndex(c => c.id === draggedId);
      const targetIdx = state.categories.findIndex(c => c.id === id);
      const [moved] = state.categories.splice(dragIdx, 1);
      state.categories.splice(targetIdx, 0, moved);
      state.categories.forEach((c, i) => c.order = i);
      await saveCategories();
      renderCategoryTabs();
    }
  });
}

export async function addCategory(name) {
  state.categories.push({
    id: `cat-${Date.now()}`,
    name,
    order: state.categories.length,
    collapsed: false,
    pinned: false
  });
  await saveCategories();
  renderCategoryTabs();
  toast('Категория добавлена');
}

export async function renameCategory(id, newName) {
  const c = state.categories.find(x => x.id === id);
  if (!c) return;
  c.name = newName;
  await saveCategories();
  renderCategoryTabs();
}

export async function deleteCategory(id) {
  if (id === 'all') { toast('Нельзя удалить "Все"', 'error'); return; }
  state.categories = state.categories.filter(c => c.id !== id);
  await saveCategories();
  state.activeCategory = 'all';
  renderCategoryTabs();
  renderShortcuts();
  toast('Категория удалена');
}

export async function togglePinCategory(id) {
  const c = state.categories.find(x => x.id === id);
  if (!c) return;
  c.pinned = !c.pinned;
  await saveCategories();
  renderCategoryTabs();
}

function openCategoryEditor(id) {
  const cat = id ? state.categories.find(c => c.id === id) : null;
  const name = prompt(cat ? 'Переименовать категорию:' : 'Название новой категории:', cat?.name || '');
  if (name === null) return;
  if (!name.trim()) return;

  if (cat) {
    if (confirm(`Удалить категорию "${cat.name}"?`)) {
      deleteCategory(cat.id);
    } else {
      renameCategory(cat.id, name.trim());
    }
  } else {
    addCategory(name.trim());
  }
}/** Категории + ярлыки. Исправлено: draggable теперь реально работает, favicon с фолбэком. */

import { $, el, uid, toast, faviconOf, normalizeUrl } from './utils.js';
import { store } from './storage.js';

let categories = [];
let scModal = { catId: null, scId: null };

export async function renderCats() {
  categories = await store.get('categories');
  const wrap = $('#cats');
  if (!wrap) return;
  wrap.innerHTML = '';
  categories.forEach((cat, ci) => wrap.append(buildCard(cat, ci)));
}

function buildCard(cat, ci) {
  const card = el('div', { class: 'cat-card' });
  card.style.animationDelay = `${0.42 + ci * 0.07}s`;

  const head = el('div', {
    class: 'cat-head', draggable: true,
    title: 'Тяни для порядка · ПКМ — переименовать/удалить'
  },
    el('span', { class: 'cat-ico' }, cat.icon || '📁'),
    el('span', { class: 'cat-name' }, cat.name),
    el('button', {
      class: 'cat-add', title: 'Добавить ярлык',
      onclick: (e) => { e.stopPropagation(); openScModal(cat.id, null); }
    }, '＋')
  );

  head.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const action = prompt(`Категория «${cat.name}»:\n1 — переименовать\n2 — удалить`, '1');
    if (action === '1') {
      const name = prompt('Новое название:', cat.name);
      if (name && name.trim()) { cat.name = name.trim().toUpperCase(); save(); }
    } else if (action === '2') {
      categories = categories.filter(c => c.id !== cat.id);
      save(); toast('Категория удалена');
    }
  });

  head.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'cat', id: cat.id }));
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('drag-over'); });
  card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    let data;
    try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch (err) { return; }
    if (data.type === 'chip') moveChip(data.catId, data.id, cat.id);
    else if (data.type === 'cat' && data.id !== cat.id) moveCat(data.id, cat.id);
  });

  const chips = el('div', { class: 'chips' });
  (cat.shortcuts || []).forEach((sc, si) => chips.append(buildChip(cat, sc, si)));

  card.append(head, chips);
  return card;
}

function buildChip(cat, sc, si) {
  const chip = el('div', {
    class: 'chip', draggable: true,
    onclick: () => { const u = normalizeUrl(sc.url); if (u) location.href = u; }
  });
  chip.style.animationDelay = `${si * 0.05}s`;

  // Иконка с фолбэком 🌐 при ошибке загрузки
  let ico;
  if (sc.icon && (/^https?:/.test(sc.icon) || sc.icon.startsWith('data:'))) {
    ico = el('img', {
      src: sc.icon, alt: '',
      onerror: (e) => e.target.replaceWith(el('span', {}, '🌐'))
    });
  } else if (sc.icon) {
    ico = el('span', {}, sc.icon);
  } else {
    ico = el('img', {
      src: faviconOf(sc.url), alt: '',
      onerror: (e) => e.target.replaceWith(el('span', {}, '🌐'))
    });
  }

  chip.append(
    el('div', { class: 'chip-tools' },
      el('button', { title: 'Изменить', onclick: (e) => { e.stopPropagation(); openScModal(cat.id, sc.id); } }, '✎'),
      el('button', { title: 'Удалить', onclick: (e) => {
        e.stopPropagation();
        cat.shortcuts = cat.shortcuts.filter(x => x.id !== sc.id);
        save(); toast('Ярлык удалён');
      } }, '✕')
    ),
    el('div', { class: 'chip-ico' }, ico),
    el('div', { class: 'chip-name', title: sc.title }, sc.title)
  );

  chip.addEventListener('dragstart', (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'chip', catId: cat.id, id: sc.id }));
    e.dataTransfer.effectAllowed = 'move';
    chip.classList.add('dragging');
  });
  chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
  return chip;
}

async function save() {
  await store.set('categories', categories);
  renderCats();
}

function moveChip(fromCat, scId, toCat) {
  const src = categories.find(c => c.id === fromCat);
  const dst = categories.find(c => c.id === toCat);
  if (!src || !dst || fromCat === toCat) return;
  const idx = src.shortcuts.findIndex(x => x.id === scId);
  if (idx === -1) return;
  const [sc] = src.shortcuts.splice(idx, 1);
  dst.shortcuts.push(sc);
  save();
}

function moveCat(dragId, targetId) {
  const from = categories.findIndex(c => c.id === dragId);
  const to   = categories.findIndex(c => c.id === targetId);
  if (from === -1 || to === -1) return;
  const [c] = categories.splice(from, 1);
  categories.splice(to, 0, c);
  save();
}

/* ---------- Модалка ярлыка ---------- */
export function bindScModal() {
  $('#sc-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === scModal.catId);
    if (!cat) return;
    const data = {
      title: $('#sc-name').value.trim(),
      url: normalizeUrl($('#sc-url').value) || $('#sc-url').value.trim(),
      icon: $('#sc-icon').value.trim()
    };
    if (!data.title || !data.url) return;

    if (scModal.scId) {
      const sc = cat.shortcuts.find(x => x.id === scModal.scId);
      if (sc) Object.assign(sc, data);
      toast('Ярлык обновлён');
    } else {
      cat.shortcuts.push(Object.assign({ id: uid() }, data));
      toast('Ярлык добавлен');
    }
    closeScModal();
    save();
  });

  $('#sc-delete').addEventListener('click', () => {
    const cat = categories.find(c => c.id === scModal.catId);
    if (cat) cat.shortcuts = cat.shortcuts.filter(x => x.id !== scModal.scId);
    closeScModal();
    save();
    toast('Ярлык удалён');
  });
}

function openScModal(catId, scId) {
  scModal = { catId, scId };
  const cat = categories.find(c => c.id === catId);
  const sc = cat ? (cat.shortcuts || []).find(x => x.id === scId) : null;
  $('#sc-name').value = sc ? sc.title : '';
  $('#sc-url').value  = sc ? sc.url : '';
  $('#sc-icon').value = sc ? sc.icon : '';
  $('#sc-delete').hidden = !sc;
  $('#sc-title-head').textContent = sc ? 'Изменить ярлык' : 'Новый ярлык';
  $('#sc-overlay').hidden = false;
}

export function closeScModal() { $('#sc-overlay').hidden = true; }

export function bindAddCat() {
  $('#add-cat').addEventListener('click', () => {
    const name = prompt('Название категории:');
    if (!name || !name.trim()) return;
    const icon = prompt('Эмодзи-иконка:', '⭐') || '⭐';
    categories.push({ id: uid(), icon: icon.trim(), name: name.trim().toUpperCase(), shortcuts: [] });
    save();
    toast('Категория добавлена');
  });
}
/** Часы + погода. Исправлено: один интервал погоды, надёжные фолбэки. */

import { $ } from './utils.js';
import { store } from './storage.js';

const geoCache = new Map();
let tickTimer = null;
let wxTimer = null;
let slots = [];

async function geocode(city) {
  if (!city || city === '—') return null;
  if (geoCache.has(city)) return geoCache.get(city);
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`
    );
    const d = await r.json();
    const g = d && d.results && d.results[0];
    const info = g ? { lat: g.latitude, lon: g.longitude, tz: g.timezone || null } : null;
    geoCache.set(city, info);
    return info;
  } catch (e) {
    geoCache.set(city, null);
    return null;
  }
}

async function weather(lat, lon) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
  );
  const d = await r.json();
  return { t: Math.round(d.current.temperature_2m), code: d.current.weather_code };
}

function wxEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '❄️';
  return '⛈️';
}

function tick() {
  const now = new Date();
  slots.forEach((s, i) => {
    const elT = $(i === 0 ? '#time-a' : '#time-b');
    if (!elT) return;
    try {
      elT.textContent = new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: s.tz || undefined
      }).format(now);
    } catch (e) {
      elT.textContent = now.toLocaleTimeString('ru-RU');
    }
  });
}

async function refreshWeather() {
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const wxEl = $(i === 0 ? '#wx-a' : '#wx-b');
    if (!wxEl) continue;
    if (!s || !s.geo) { wxEl.textContent = '—'; continue; }
    try {
      const w = await weather(s.geo.lat, s.geo.lon);
      wxEl.textContent = `${w.t > 0 ? '+' : ''}${w.t}°C ${wxEmoji(w.code)}`;
    } catch (e) {
      wxEl.textContent = '—';
    }
  }
}

export async function initClocks() {
  if (tickTimer) clearInterval(tickTimer);
  if (wxTimer) clearInterval(wxTimer);

  const s = await store.get('settings');
  const cities = s.cities || ['—', '—'];
  slots = [];

  for (let i = 0; i < 2; i++) {
    const city = cities[i] || '—';
    const nameEl = $(i === 0 ? '#city-a' : '#city-b');
    if (nameEl) nameEl.textContent = String(city).toUpperCase();
    const geo = await geocode(city);
    slots.push({ city, tz: geo ? geo.tz : null, geo });
  }

  tick();
  tickTimer = setInterval(tick, 1000);
  refreshWeather();
  wxTimer = setInterval(refreshWeather, 30 * 60 * 1000);
}
/**
 * Локализация: RU/EN. Поддержка data-i18n атрибутов.
 */

const STRINGS = {
  ru: {
    search: 'Искать в',
    clearHistory: 'Очистить историю',
    delete: 'Удалить',
    edit: 'Редактировать',
    add: 'Добавить',
    save: 'Сохранить',
    cancel: 'Отмена',
    settings: 'Настройки',
    shortcuts: 'Ярлыки',
    categories: 'Категории',
    themes: 'Темы',
    searchHistory: 'История поиска',
    general: 'Общие',
    animations: 'Анимации',
    importExport: 'Импорт/Экспорт',
    reset: 'Сброс',
    notes: 'Заметки',
    todo: 'Список задач',
    calculator: 'Калькулятор',
    quote: 'Цитата дня',
    language: 'Язык',
    confirmReset: 'Вы действительно хотите сбросить все настройки?',
    noHistory: 'История пуста',
    addShortcut: 'Добавить ярлык',
    editShortcut: 'Редактировать ярлык'
  },
  en: {
    search: 'Search in',
    clearHistory: 'Clear history',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    settings: 'Settings',
    shortcuts: 'Shortcuts',
    categories: 'Categories',
    themes: 'Themes',
    searchHistory: 'Search history',
    general: 'General',
    animations: 'Animations',
    importExport: 'Import/Export',
    reset: 'Reset',
    notes: 'Notes',
    todo: 'To-Do',
    calculator: 'Calculator',
    quote: 'Quote of the day',
    language: 'Language',
    confirmReset: 'Are you sure you want to reset all settings?',
    noHistory: 'History is empty',
    addShortcut: 'Add shortcut',
    editShortcut: 'Edit shortcut'
  }
};

let currentLang = 'ru';

export function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (STRINGS[lang][key]) el.textContent = STRINGS[lang][key];
  });
}

export function t(key) {
  return STRINGS[currentLang]?.[key] ?? STRINGS['ru'][key] ?? key;
}

export function getLang() { return currentLang; }

export { STRINGS };/** Точка входа + диагностика ошибок. */

import { $, toast } from './utils.js';
import { store } from './storage.js';
import { THEMES, applyTheme, applyBackground } from './theme.js';
import { initClocks } from './clocks.js';
import { initSearch } from './search.js';
import { renderCats, bindScModal, bindAddCat, closeScModal } from './cats.js';
import { bindSettings, paintAvatar } from './settings.js';

// Видимая диагностика: любая ошибка JS попадёт в тост и консоль
window.addEventListener('error', (e) => {
  console.error('[KOCH BRAUZER]', e.error || e.message);
});

async function boot() {
  // Защита: страница открыта файлом, а не как расширение
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    toast('Открой как расширение: chrome://extensions → загрузить папку');
    return;
  }

  const s = await store.get('settings');

  // Селектор тем
  const sel = $('#theme-select');
  sel.innerHTML = '';
  Object.keys(THEMES).forEach(id => {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = THEMES[id];
    if (id === s.theme) o.selected = true;
    sel.append(o);
  });
  sel.addEventListener('change', () => applyTheme(sel.value, true));

  // Применение БЕЗ записи → нет цикла storage
  await applyTheme(s.theme, false);
  await applyBackground();
  $('#subtitle').textContent = s.subtitle || '';
  paintAvatar(s.avatar || '');

  initClocks();
  initSearch();
  renderCats();
  bindAddCat();
  bindScModal();
  bindSettings();
  bindKeys();

  // Синхронизация между вкладками (только чтение → применение)
  store.onChange('settings', async (next) => {
    if (!next) return;
    await applyTheme(next.theme, false);
    await applyBackground();
    $('#subtitle').textContent = next.subtitle || '';
    paintAvatar(next.avatar || '');
    initClocks();
  });
  store.onChange('categories', renderCats);
}

function bindKeys() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('#search-input').focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      $('#settings-overlay').hidden = false;
    }
    if (e.key === 'Escape') {
      $('#settings-overlay').hidden = true;
      closeScModal();
    }
  });
}

boot().catch(err => {
  console.error('[KOCH BRAUZER] boot:', err);
  toast('Ошибка инициализации — смотри консоль (F12)');
});
/**
 * Цитаты дня.
 */

import { $, el } from './utils.js';

const QUOTES = [
  { text: 'Простота — высшая форма изысканности.', author: 'Леонардо да Винчи' },
  { text: 'Делай что должен, и будь что будет.', author: 'Марк Аврелий' },
  { text: 'Единственный способ делать великие дела — любить то, что ты делаешь.', author: 'Стив Джобс' },
  { text: 'Воображение важнее знаний.', author: 'Альберт Эйнштейн' },
  { text: 'Жизнь — это то, что с тобой происходит, пока ты строишь планы.', author: 'Джон Леннон' },
  { text: 'Будь изменением, которое хочешь видеть в мире.', author: 'Махатма Ганди' },
  { text: 'Время — самый ценный ресурс.', author: 'Бенджамин Франклин' },
  { text: 'Совершенство достигается не тогда, когда нечего добавить, а когда нечего убрать.', author: 'Антуан де Сент-Экзюпери' },
  { text: 'Код — это поэзия логики.', author: 'Неизвестный программист' },
  { text: 'Каждый эксперт когда-то был новичком.', author: 'Хелен Хейс' },
  { text: 'Лучший способ предсказать будущее — создать его.', author: 'Питер Друкер' },
  { text: 'Успех — это идти от неудачи к неудаче, не теряя энтузиазма.', author: 'Уинстон Черчилль' }
];

export function showRandomQuote() {
  const popup = $('#quote-popup');
  if (!popup) return;
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  $('#quote-text', popup).textContent = `«${q.text}»`;
  $('#quote-author', popup).textContent = `— ${q.author}`;
  popup.hidden = false;
}

export function nextQuote() { showRandomQuote(); }

export function hideQuote() {
  const popup = $('#quote-popup');
  if (popup) popup.hidden = true;
}/** Поиск: движки, история, подсказки. */

import { $, el, debounce, normalizeUrl } from './utils.js';
import { store } from './storage.js';

const ENGINES = {
  google: { label: 'G',  name: 'Google',       url: 'https://www.google.com/search?q=' },
  ddg:    { label: 'DD', name: 'DuckDuckGo',   url: 'https://duckduckgo.com/?q=' },
  bing:   { label: 'B',  name: 'Bing',         url: 'https://www.bing.com/search?q=' },
  yandex: { label: 'Я',  name: 'Яндекс',       url: 'https://yandex.ru/search/?text=' },
  brave:  { label: 'BS', name: 'Brave Search', url: 'https://search.brave.com/search?q=' }
};

let engine = 'google';
let history = [];

const input   = () => $('#search-input');
const suggest = () => $('#suggest');
const list    = () => $('#suggest-list');

export async function initSearch() {
  const s = await store.get('settings');
  engine = ENGINES[s.engine] ? s.engine : 'google';
  history = (await store.get('history')) || [];
  paintEngine();
  bind();
}

function paintEngine() {
  const btn = $('#engine-btn');
  if (!btn) return;
  btn.textContent = ENGINES[engine].label;
  btn.title = 'Поисковик: ' + ENGINES[engine].name;
  input().placeholder = `Поиск в ${ENGINES[engine].name}…`;
}

function bind() {
  $('#engine-btn').addEventListener('click', () => {
    const keys = Object.keys(ENGINES);
    engine = keys[(keys.indexOf(engine) + 1) % keys.length];
    store.update('settings', s => ({ ...s, engine }));
    paintEngine();
  });

  input().addEventListener('input', debounce(renderSuggest, 90));
  input().addEventListener('focus', renderSuggest);
  input().addEventListener('keydown', (e) => {
    if (e.key === 'Enter') go();
    if (e.key === 'Escape') hide();
  });
  $('#search-go').addEventListener('click', go);
  $('#clear-history').addEventListener('click', async () => {
    history = [];
    await store.set('history', []);
    renderSuggest();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-row')) hide();
  });
}

function renderSuggest() {
  const q = input().value.trim().toLowerCase();
  const items = history.filter(h => !q || h.q.toLowerCase().includes(q)).slice(0, 8);

  const ul = list();
  ul.innerHTML = '';
  items.forEach(h => {
    ul.append(el('li', { onclick: () => { input().value = h.q; go(); } },
      el('span', {}, '🕒'),
      el('span', { class: 'q' }, h.q),
      el('button', {
        class: 'del', title: 'Удалить',
        onclick: (e) => {
          e.stopPropagation();
          history = history.filter(x => x.id !== h.id);
          store.set('history', history);
          renderSuggest();
        }
      }, '✕')
    ));
  });
  suggest().hidden = items.length === 0;
}

function hide() { suggest().hidden = true; }

async function go() {
  const raw = input().value.trim();
  if (!raw) return;
  const asUrl = normalizeUrl(raw);
  const isUrl = /^https?:\/\//i.test(raw) || (asUrl !== '' && !raw.includes(' '));

  if (!isUrl) {
    history = [{ id: String(Date.now()), q: raw }, ...history.filter(h => h.q !== raw)].slice(0, 50);
    await store.set('history', history);
  }
  hide();
  location.href = isUrl ? asUrl : ENGINES[engine].url + encodeURIComponent(raw);
}
/** Настройки. */

import { $, toast, debounce, readFileAsDataURL } from './utils.js';
import { store } from './storage.js';
import { applyBackground } from './theme.js';
import { initClocks } from './clocks.js';

const MAX_BG_BYTES = 30 * 1024 * 1024;

export function bindSettings() {
  $('#settings-btn').addEventListener('click', openSettings);

  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.hidden = true; });
  });
  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', () => {
      const t = document.getElementById(b.getAttribute('data-close'));
      if (t) t.hidden = true;
    });
  });

  $('#set-subtitle').addEventListener('input', debounce((e) => {
    store.update('settings', s => ({ ...s, subtitle: e.target.value }));
    $('#subtitle').textContent = e.target.value;
  }, 300));

  const cityHandler = (idx) => debounce((e) => {
    store.update('settings', s => {
      const cities = (s.cities || []).slice();
      cities[idx] = e.target.value;
      return Object.assign({}, s, { cities });
    });
    initClocks();
  }, 500);
  $('#set-city-a').addEventListener('input', cityHandler(0));
  $('#set-city-b').addEventListener('input', cityHandler(1));

  $('#set-avatar').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const url = await readFileAsDataURL(f);
      await store.update('settings', s => ({ ...s, avatar: url }));
      paintAvatar(url);
      toast('Аватар обновлён');
    } catch (err) { toast('Ошибка чтения файла'); }
  });
  $('#reset-avatar').addEventListener('click', async () => {
    await store.update('settings', s => ({ ...s, avatar: '' }));
    paintAvatar('');
    toast('Аватар сброшен');
  });

  $('#set-bg-type').addEventListener('change', async (e) => {
    await store.update('settings', s => ({ ...s, bg: { type: e.target.value, url: (s.bg && s.bg.url) || '' } }));
    applyBackground();
  });
  $('#set-bg-file').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_BG_BYTES) { toast('Файл больше 30 МБ — используй URL'); return; }
    try {
      const url = await readFileAsDataURL(f);
      const type = f.type.indexOf('video') === 0 ? 'video' : 'image';
      await store.update('settings', s => ({ ...s, bg: { type, url } }));
      $('#set-bg-type').value = type;
      applyBackground();
      toast('Фон обновлён');
    } catch (err) { toast('Ошибка чтения файла'); }
  });
  $('#set-bg-url').addEventListener('change', async (e) => {
    const url = e.target.value.trim();
    await store.update('settings', s => ({ ...s, bg: { type: s.bg.type, url } }));
    applyBackground();
    toast('Фон обновлён');
  });

  $('#export-btn').addEventListener('click', async () => {
    const blob = new Blob([await store.exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'koch-brauzer-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Экспортировано');
  });
  $('#import-btn').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      await store.importAll(await f.text());
      toast('Импортировано, перезагрузка…');
      setTimeout(() => location.reload(), 800);
    } catch (err) { toast('Ошибка импорта'); }
  });
  $('#reset-btn').addEventListener('click', async () => {
    if (confirm('Сбросить все настройки и данные?')) {
      await store.reset();
      location.reload();
    }
  });
}

export async function openSettings() {
  const s = await store.get('settings');
  $('#set-subtitle').value = s.subtitle || '';
  $('#set-city-a').value = (s.cities && s.cities[0]) || '';
  $('#set-city-b').value = (s.cities && s.cities[1]) || '';
  $('#set-bg-type').value = (s.bg && s.bg.type) || 'none';
  $('#set-bg-url').value = (s.bg && s.bg.url && s.bg.url.indexOf('data:') !== 0) ? s.bg.url : '';
  $('#settings-overlay').hidden = false;
}

export function paintAvatar(url) {
  const img = document.getElementById('avatar-img');
  const fb  = document.getElementById('avatar-fallback');
  if (!img || !fb) return;
  if (url) { img.src = url; img.hidden = false; fb.hidden = true; }
  else { img.hidden = true; fb.hidden = false; }
}
/**
 * Категории + ярлыки: рендер, добавление, редактирование,
 * удаление, переименование, drag & drop между категориями.
 */

import { el, uid, faviconOf, normUrl, toast } from './utils.js';

let data = null;   // общие данные (мутация + save)
let save = null;
let modalCtx = null; // { cat, id } — куда/что добавляем-редактируем

/** Инициализация модуля общими данными */
export function initShortcuts(d, saveFn) {
  data = d;
  save = saveFn;
  bindModal();
}

/* ================= РЕНДЕР ================= */

export function renderCategories() {
  const root = document.getElementById('categories');
  root.innerHTML = '';
  for (const cat of data.categories) root.appendChild(buildCategory(cat));
}

function buildCategory(cat) {
  const card = el('div', { class: 'cat-card', dataset: { cat: cat.id } });

  const header = el('div', { class: 'cat-header' },
    el('span', { class: 'cat-icon' }, cat.icon || '📁'),
    el('span', { class: 'cat-name' }, cat.name),
    el('span', { class: 'cat-tools' },
      el('button', { class: 'tool', title: 'Переименовать',
        onclick: (e) => { e.stopPropagation(); renameCategory(cat.id); } }, '✎'),
      el('button', { class: 'tool', title: 'Удалить категорию',
        onclick: (e) => { e.stopPropagation(); deleteCategory(cat.id); } }, '🗑'),
      el('button', { class: 'tool', title: 'Добавить ярлык',
        onclick: (e) => { e.stopPropagation(); openModal(cat.id); } }, '＋')
    )
  );

  const tiles = el('div', { class: 'tiles' });
  for (const s of data.shortcuts.filter(s => s.cat === cat.id)) {
    tiles.appendChild(buildTile(s));
  }

  card.append(header, tiles);

  /* --- Drag & Drop: карточка как зона приёма --- */
  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    card.classList.add('drag-over');
  });
  card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    const s = data.shortcuts.find(x => x.id === id);
    if (!s || s.cat === cat.id) return;
    s.cat = cat.id;
    save();
    renderCategories();
    toast(`Перемещено в «${cat.name}»`);
  });

  return card;
}

function buildTile(s) {
  const tile = el('div', { class: 'tile', draggable: 'true', dataset: { id: s.id } },
    el('div', { class: 'tile-actions' },
      el('button', { title: 'Изменить',
        onclick: (e) => { e.stopPropagation(); openModal(s.cat, s); } }, '✎'),
      el('button', { title: 'Удалить',
        onclick: (e) => { e.stopPropagation(); deleteShortcut(s.id); } }, '🗑')
    ),
    el('div', { class: 'tile-icon' }, makeIcon(s)),
    el('div', { class: 'tile-name' }, s.title)
  );

  tile.addEventListener('click', () => { window.location.href = s.url; });
  tile.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', s.id);
    e.dataTransfer.effectAllowed = 'move';
    tile.classList.add('dragging');
  });
  tile.addEventListener('dragend', () => tile.classList.remove('dragging'));

  return tile;
}

/** Иконка: эмодзи/текст или картинка (favicon), с fallback */
function makeIcon(s) {
  if (s.icon && !/^https?:/i.test(s.icon)) {
    return el('span', { class: 'emoji' }, s.icon);
  }
  const img = el('img', { src: s.icon || faviconOf(s.url), alt: '', loading: 'lazy' });
  img.addEventListener('error', () => img.replaceWith(el('span', { class: 'emoji' }, '🌐')));
  return img;
}

/* ================= ОПЕРАЦИИ ================= */

function deleteShortcut(id) {
  data.shortcuts = data.shortcuts.filter(s => s.id !== id);
  save();
  renderCategories();
  toast('Ярлык удалён');
}

function renameCategory(id) {
  const cat = data.categories.find(c => c.id === id);
  if (!cat) return;
  const name = prompt('Название категории:', cat.name);
  if (!name || !name.trim()) return;
  cat.name = name.trim().toUpperCase();
  save();
  renderCategories();
}

function deleteCategory(id) {
  const cat = data.categories.find(c => c.id === id);
  if (!cat) return;
  if (!confirm(`Удалить категорию «${cat.name}» и все её ярлыки?`)) return;
  data.categories = data.categories.filter(c => c.id !== id);
  data.shortcuts  = data.shortcuts.filter(s => s.cat !== id);
  save();
  renderCategories();
  toast('Категория удалена');
}

/* ================= МОДАЛКА ================= */

function bindModal() {
  const modal = document.getElementById('shortcut-modal');
  const form  = document.getElementById('shortcut-form');

  document.getElementById('modal-cancel')
    .addEventListener('click', () => modal.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements; // ВАЖНО: form.elements, а не form.title (баг HTMLElement.title)
    const value = {
      title: f['title'].value.trim(),
      url:   normUrl(f['url'].value),
      icon:  f['icon'].value.trim()
    };
    if (!value.title || !value.url) return;

    if (modalCtx?.id) {
      const s = data.shortcuts.find(x => x.id === modalCtx.id);
      if (s) Object.assign(s, value);
      toast('Сохранено');
    } else {
      data.shortcuts.push({ id: uid(), cat: modalCtx.cat, ...value });
      toast('Ярлык добавлен');
    }
    save();
    renderCategories();
    modal.close();
  });
}

function openModal(catId, shortcut = null) {
  modalCtx = { cat: catId, id: shortcut?.id || null };
  const modal = document.getElementById('shortcut-modal');
  const f = document.getElementById('shortcut-form').elements;
  f['title'].value = shortcut?.title || '';
  f['url'].value   = shortcut?.url   || '';
  f['icon'].value  = shortcut?.icon  || '';
  document.getElementById('modal-heading').textContent =
    shortcut ? 'Изменить ярлык' : 'Новый ярлык';
  modal.showModal();
}/** Хранилище. Исправлено: JSON-клон вместо structuredClone (совместимость). */

const clone = (o) => JSON.parse(JSON.stringify(o));

const DEFAULTS = {
  settings: {
    theme: 'rose',
    subtitle: 'твоя стартовая страница',
    cities: ['Воткинск', 'Уральск'],
    avatar: '',
    bg: { type: 'none', url: '' },
    engine: 'google'
  },
  categories: [
    { id: 'c1', icon: '🌐', name: 'Соцсети', shortcuts: [
      { id: 's1', title: 'YouTube',  url: 'https://youtube.com',      icon: '' },
      { id: 's2', title: 'Telegram', url: 'https://web.telegram.org', icon: '' },
      { id: 's3', title: 'VK',       url: 'https://vk.com',           icon: '' },
      { id: 's4', title: 'Discord',  url: 'https://discord.com',      icon: '' }
    ]},
    { id: 'c2', icon: '🎵', name: 'Музыка', shortcuts: [
      { id: 's5', title: 'Spotify',    url: 'https://open.spotify.com', icon: '' },
      { id: 's6', title: 'SoundCloud', url: 'https://soundcloud.com',   icon: '' },
      { id: 's7', title: 'Я Музыка',   url: 'https://music.yandex.ru',  icon: '' }
    ]},
    { id: 'c3', icon: '🎮', name: 'Игры', shortcuts: [
      { id: 's8',  title: 'Steam',      url: 'https://steampowered.com',    icon: '' },
      { id: 's9',  title: 'Twitch',     url: 'https://twitch.tv',           icon: '' },
      { id: 's10', title: 'Epic Games', url: 'https://store.epicgames.com', icon: '' }
    ]},
    { id: 'c4', icon: '💻', name: 'Разработка', shortcuts: [
      { id: 's11', title: 'GitHub',        url: 'https://github.com',          icon: '' },
      { id: 's12', title: 'StackOverflow', url: 'https://stackoverflow.com',   icon: '' },
      { id: 's13', title: 'Reddit',        url: 'https://reddit.com',          icon: '' }
    ]}
  ],
  history: []
};

const KEYS = Object.keys(DEFAULTS);

export const store = {
  async get(key) {
    try {
      const data = await chrome.storage.local.get(key ? [key] : KEYS);
      if (key) return data[key] !== undefined ? data[key] : clone(DEFAULTS[key]);
      return KEYS.reduce((acc, k) => {
        acc[k] = data[k] !== undefined ? data[k] : clone(DEFAULTS[k]);
        return acc;
      }, {});
    } catch (e) {
      console.error('[KOCH storage]', e);
      if (key) return clone(DEFAULTS[key]);
      return clone(DEFAULTS);
    }
  },

  set(key, value) { return chrome.storage.local.set({ [key]: value }); },

  async update(key, fn) {
    const next = fn(await this.get(key));
    await this.set(key, next);
    return next;
  },

  async reset() { await chrome.storage.local.clear(); },

  async exportAll() { return JSON.stringify(await this.get(), null, 2); },

  async importAll(text) {
    const data = JSON.parse(text);
    const clean = {};
    KEYS.forEach(k => { if (data[k] !== undefined) clean[k] = data[k]; });
    await chrome.storage.local.set(clean);
  },

  onChange(key, fn) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[key]) fn(changes[key].newValue);
    });
  }
};
/** Темы + фон. Защита от цикла записи в storage. */

import { store } from './storage.js';

export const THEMES = {
  rose:   'Розовая',
  purple: 'Фиолетовая',
  ocean:  'Океан',
  green:  'Изумруд',
  dark:   'Тёмная',
  light:  'Светлая'
};

let appliedTheme = null;
let appliedBgUrl = null;

export async function applyTheme(id, persist = true) {
  if (!THEMES[id]) id = 'rose';
  if (id === appliedTheme && !persist) return;   // ← защита от бесконечного цикла
  appliedTheme = id;
  document.body.dataset.theme = id;
  if (persist) {
    await store.update('settings', s => ({ ...s, theme: id }));
  }
}

export async function applyBackground() {
  const s = await store.get('settings');
  const bg = s.bg || { type: 'none', url: '' };
  const video = document.getElementById('bg-video');
  const image = document.getElementById('bg-image');
  const orbs  = document.getElementById('bg-orbs');
  if (!video || !image || !orbs) return;

  const url = (bg.type !== 'none' && bg.url) ? bg.url : null;

  if (bg.type === 'video' && url) {
    image.hidden = true;
    orbs.hidden = true;
    video.hidden = false;
    if (appliedBgUrl !== url) {
      appliedBgUrl = url;
      video.src = url;
      video.play().catch(() => {});
    }
  } else if (bg.type === 'image' && url) {
    video.hidden = true; video.pause();
    orbs.hidden = true;
    image.hidden = false;
    image.style.backgroundImage = `url("${url}")`;
    appliedBgUrl = url;
  } else {
    video.hidden = true; video.pause();
    image.hidden = true;
    orbs.hidden = false;
    appliedBgUrl = null;
  }
}
/** Базовые утилиты. Исправлено: корректная установка boolean-атрибутов (draggable и т.п.). */

export const $  = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Создание элемента. attrs: class, dataset, on* = функции, остальное — атрибуты. */
export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') {
      n.addEventListener(k.slice(2), v);
    } else if (k === 'class') {
      n.className = v;
    } else if (k === 'dataset') {
      Object.assign(n.dataset, v);
    } else {
      // true → "true" (важно для draggable!), false пропускается выше
      n.setAttribute(k, v === true ? 'true' : String(v));
    }
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
}

export const debounce = (fn, ms = 250) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

/** Уведомление */
export function toast(msg) {
  const box = $('#toasts');
  if (!box) { console.log('[KOCH]', msg); return; }
  const t = el('div', { class: 'toast' }, msg);
  box.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 2400);
}

/** Favicon сайта */
export function faviconOf(url) {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch { return ''; }
}

export function normalizeUrl(str) {
  str = (str || '').trim();
  if (!str) return '';
  if (/^https?:\/\//i.test(str)) return str;
  if (str.includes('.') && !str.includes(' ')) return 'https://' + str;
  return '';
}

export const readFileAsDataURL = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = () => rej(new Error('read error'));
  r.readAsDataURL(file);
});
/**
 * Виджеты: часы, погода, заметки, задачи, калькулятор.
 */

import { $, el, fmtDate, fmtTime, toast } from './utils.js';
import { storage } from './storage.js';

/* ---------- Часы ---------- */
export function startClock() {
  const timeEl = $('.clock-time');
  const dateEl = $('.clock-date');
  if (!timeEl || !dateEl) return;

  const tick = () => {
    const now = new Date();
    timeEl.textContent = fmtTime(now);
    dateEl.textContent = fmtDate(now);
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- Погода (wttr.in, без API-ключа) ---------- */
export async function loadWeather() {
  const settings = await storage.get('settings');
  if (!settings.weather?.enabled) return;

  const city = settings.weather.city || 'Moscow';
  const widget = $('#weather-widget');
  if (!widget) return;
  widget.hidden = false;

  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await res.json();
    const cur = data.current_condition?.[0];
    if (!cur) return;

    const code = parseInt(cur.weatherCode);
    const icon = weatherCodeToIcon(code, cur.weatherDesc?.[0]?.value || '');
    $('.weather-icon', widget).textContent = icon;
    $('.weather-temp', widget).textContent = `${cur.temp_C}°`;
  } catch (e) {
    console.warn('Weather error:', e);
  }
}

function weatherCodeToIcon(code) {
  if ([113].includes(code)) return '☀️';
  if ([116].includes(code)) return '⛅';
  if ([119, 122].includes(code)) return '☁️';
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(code)) return '🌧';
  if ([200, 386, 389, 392, 395].includes(code)) return '⛈';
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(code)) return '❄️';
  if ([143, 248, 260].includes(code)) return '🌫';
  return '☁️';
}

/* ---------- Заметки ---------- */
export async function initNotes() {
  const area = $('#notes-area');
  if (!area) return;
  area.value = await storage.get('notes') || '';
  area.addEventListener('input', () => storage.set('notes', area.value));
}

/* ---------- Задачи ---------- */
export async function initTodo() {
  const list = $('#todo-list');
  const form = $('#todo-form');
  const input = $('#todo-input');
  if (!list || !form || !input) return;

  let todos = await storage.get('todos') || [];

  const save = () => storage.set('todos', todos);

  const render = () => {
    list.innerHTML = '';
    todos.forEach((t, i) => {
      const li = el('li', { class: `todo-item ${t.done ? 'done' : ''}` },
        el('input', { type: 'checkbox', checked: t.done ? 'checked' : false,
          onchange: () => { todos[i].done = !todos[i].done; save(); render(); }
        }),
        el('span', { class: 'todo-text' }, t.text),
        el('button', { onclick: () => { todos.splice(i, 1); save(); render(); } }, '✕')
      );
      list.appendChild(li);
    });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    todos.push({ id: Date.now(), text, done: false });
    input.value = '';
    save(); render();
  });

  render();
}

/* ---------- Калькулятор ---------- */
export function initCalc() {
  const display = $('#calc-display');
  const grid = $('#calc-grid');
  if (!display || !grid) return;

  const buttons = [
    'C', '±', '%', '÷',
    '7','8','9','×',
    '4','5','6','−',
    '1','2','3','+',
    '0','.', '='
  ];

  let expr = '';

  const render = () => { display.textContent = expr || '0'; };

  grid.innerHTML = '';
  buttons.forEach(b => {
    const cls = ['÷','×','−','+','%','±','C'].includes(b) ? 'op' : (b === '=' ? 'eq' : '');
    const btn = el('button', { class: cls, onclick: () => press(b) }, b);
    grid.appendChild(btn);
  });

  function press(b) {
    if (b === 'C') { expr = ''; }
    else if (b === '=') {
      try {
        const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        // Безопасная эвалуация через Function
        expr = String(Function(`"use strict"; return (${normalized})`)());
      } catch { expr = 'Ошибка'; }
    }
    else if (b === '±') {
      expr = expr.startsWith('-') ? expr.slice(1) : `-${expr}`;
    }
    else { expr += b; }
    render();
  }

  render();
}
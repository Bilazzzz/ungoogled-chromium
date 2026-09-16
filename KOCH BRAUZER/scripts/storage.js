/** Хранилище. Исправлено: JSON-клон вместо structuredClone (совместимость). */

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

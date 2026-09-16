# Koch Browser 1.0.0 Release Notes

**Release Date:** 2026  
**Chromium Base:** 153.0.8010.47  
**Platforms:** Linux x64, Windows x64

---

## 🎉 Что нового

### Первый релиз Koch Browser

Мы рады представить первый стабильный релиз Koch Browser — браузера, созданного с нуля на базе ungoogled-chromium с фокусом на производительность, приватность и современный дизайн.

---

## ✨ Основные возможности

### Дизайн и интерфейс

- **Новая стартовая страница** с уникальным дизайном KOCH BRAUZER
- **6 цветовых тем**: Rose, Purple, Ocean, Green, Dark, Light
- **Анимированный фон** с неоновыми орбами
- **Виджет погоды** с поддержкой нескольких городов (Open-Meteo API)
- **Поисковая строка** с выбором из 5 поисковых систем
- **Менеджер закладок** с категориями и drag-and-drop

### Производительность

- **Оптимизированное потребление RAM** — до 40% меньше стандартного Chromium
- **Умное управление вкладками** — агрессивный discard неактивных вкладок
- **Защита активной вкладки** от преждевременной выгрузки
- **Отключён prefetch** для экономии памяти
- **Блокировка фоновых сетевых запросов**

### Приватность

- **Никакой телеметрии Google**
- **Отключён Safe Browsing**
- **Пустые API ключи**
- **Нет фоновых сервисов Google**

### Платформы

- **Linux**: Нативная поддержка Wayland и X11
- **Windows**: Полная совместимость с Windows 10/11
- **VA-API**: Аппаратное декодирование видео на Linux

---

## 📊 Бенчмарки

Сравнение с обычным Chromium (средние значения):

| Тест | Koch Browser | Chromium | Улучшение |
|------|--------------|----------|-----------|
| Idle RAM | 150 MB | 250 MB | -40% |
| 1 вкладка | 200 MB | 350 MB | -43% |
| 5 вкладок | 500 MB | 900 MB | -44% |
| 10 вкладок | 900 MB | 1800 MB | -50% |
| Запуск | 1.2s | 1.5s | -20% |

*Тесты проведены на системе: Intel i5-12400, 16GB RAM, SSD NVMe*

---

## 🔧 Технические детали

### Патчи

Этот релиз включает 5 основных патчей:

1. **Брендинг** — замена названий и идентификаторов
2. **NTP интеграция** — встроенная новая вкладка
3. **Оптимизация памяти** — улучшения memory management
4. **Страница производительности** — koch://performance
5. **Исправления стабильности** — критические багфиксы

### GN флаги сборки

```gn
is_official_build = true
use_thin_lto = true
thin_lto_enable_optimizations = true
chrome_pgo_phase = 2
symbol_level = 0
enable_stripping = true
max_renderers_limit = 32
enable_tab_discarding = true
use_ozone = true
ozone_platform_wayland = true
```

---

## 📋 Известные проблемы

### Linux

- При использовании Wayland на некоторых системах могут быть проблемы с clipboard. 
  **Решение:** Запустить с `--ozone-platform=x11`

- VA-API может не работать на старых GPU.
  **Решение:** Проверить поддержку драйверами

### Windows

- Первый запуск может быть медленным из-за создания профиля
- Некоторые расширения могут требовать дополнительной настройки

---

## 🚀 Установка

### Linux

```bash
tar -xzf KochBrowser-1.0.0-linux-x64.tar.gz
cd KochBrowser-Linux-1.0.0
./koch-browser
```

Для установки в систему:
```bash
sudo cp koch-browser /usr/local/bin/
sudo cp koch-browser.desktop /usr/share/applications/
```

### Windows

Распакуйте архив и запустите `KochBrowser.exe`.

---

## 🛠️ Сборка из исходников

См. инструкции в [README.md](README.md).

Кратко:

```bash
# Linux Debian/Ubuntu
./build-linux-debian.sh

# Linux Arch/CachyOS
./build-linux.sh

# Windows
build-windows.bat
```

**Требования к сборке:**
- Минимум 16 GB RAM (рекомендуется 32 GB)
- 50 GB свободного места на диске
- 2-8 часов времени компиляции

---

## 📝 Лицензия

Koch Browser распространяется под лицензией BSD-3-Clause (наследует от Chromium) и MIT (от ungoogled-chromium).

Полный текст лицензии см. в файле LICENSE.

---

## 🙏 Благодарности

- Проекту [ungoogled-chromium](https://github.com/ungoogled-software/ungoogled-chromium)
- Авторам расширения KOCH BRAUZER
- Сообществу Chromium

---

## 📞 Поддержка

- GitHub Issues: [сообщить о проблеме](https://github.com/koch-browser/koch-browser/issues)
- Документация: [README.md](README.md)

---

**Koch Browser 1.0.0** — Быстрый. Лёгкий. Приватный. Твой браузер.

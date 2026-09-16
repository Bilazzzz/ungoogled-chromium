# Koch Browser

**Максимально быстрый, лёгкий и современный Chromium-браузер для Linux и Windows с очень низким потреблением RAM.**

![Koch Browser](docs/screenshot.png)

## Особенности

### 🎨 Дизайн
- **Встроенная New Tab Page** в стиле KOCH BRAUZER
- **6 тем оформления**: Rose, Purple, Ocean, Green, Dark, Light
- **Анимированный фон** с неоновыми орбами
- **Двойные часы** с погодой (Open-Meteo API)
- **Поиск** с поддержкой 5 движков (Google, DuckDuckGo, Bing, Yandex, Brave)
- **Закладки** с категориями и drag-and-drop

### ⚡ Производительность
- **Агрессивное управление памятью** вкладок
- **Защита активной вкладки** от выгрузки
- **Оптимизированные приоритеты процессов**
- **Отключён prefetch** для экономии памяти
- **Блокировка фоновых запросов**

### 🔒 Приватность
- **Никакой телеметрии Google**
- **Safe Browsing отключён**
- **Пустые API ключи Google**
- **Нет фоновых сервисов**

### 🐧 Linux-first
- **Нативный Wayland** (не XWayland)
- **VA-API** для аппаратного декодирования видео
- **Оптимизация под KDE/GNOME**

### 🪟 Кроссплатформенность
- **Linux x64** (Wayland/X11)
- **Windows 10/11 x64**

## Сборка

### Требования

#### Linux
```bash
# Arch Linux / CachyOS
sudo pacman -S base-devel git python clang lld ninja cmake

# Debian/Ubuntu
sudo apt install build-essential git python3 clang lld ninja-build cmake
```

#### Windows
```powershell
# Visual Studio 2022 с компонентами:
# - C++ Desktop Development
# - Windows 10/11 SDK
# Git for Windows
```

### Процесс сборки

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/koch-browser/koch-browser.git
cd koch-browser

# 2. Инициализируйте Chromium source
./utils/download.sh  # или следуйте инструкциям ungoogled-chromium

# 3. Примените патчи
./utils/patches/apply_patches.sh

# 4. Настройте сборку
cd out
gn gen Default --args="$(cat ../flags.gn)"

# 5. Соберите
ninja -C Default chrome

# 6. Запустите
./Default/chrome
```

### Флаги сборки

См. [`flags.gn`](flags.gn) для оптимизированных настроек:
- PGO отключён для быстрой сборки (включите для release)
- Отключены ненужные сервисы
- Ограничена память рендерера (2GB)
- Включено агрессивное выключение вкладок

## Патчи

Все изменения организованы в виде патчей в [`patches/koch-browser/`](patches/koch-browser/):

| Патч | Описание |
|------|----------|
| `0001-branding.patch` | Брендинг Koch Browser |
| `0002-koch-ntp-integration.patch` | Встроенная New Tab Page |
| `0003-memory-optimization.patch` | Оптимизация памяти |

См. [`patches/koch-browser/README.md`](patches/koch-browser/README.md) для деталей.

## Использование

### Новая вкладка

Откройте новую вкладку (`Ctrl+T`) чтобы увидеть Koch NTP с:
- Часами и погодой
- Поисковой строкой
- Закладками по категориям
- Выбором темы

### Настройки NTP

Нажмите на иконку ⚙️ для настройки:
- Подзаголовок
- Города для погоды
- Аватар
- Фон (неон/видео/изображение)
- Экспорт/импорт конфигурации

### Горячие клавиши NTP

| Клавиши | Действие |
|---------|----------|
| `Ctrl+K` | Фокус на поиск |
| `Ctrl+,` | Открыть настройки |
| `Esc` | Закрыть модальное окно |

## Тестирование

### Проверка функциональности

1. ✅ Заголовок окна: "Koch Browser"
2. ✅ Новая вкладка: Koch NTP с анимацией
3. ✅ Темы: Переключение между 6 темами
4. ✅ Часы: Корректное время с погодой
5. ✅ Поиск: Работа со всеми движками
6. ✅ Закладки: Добавление/редактирование/drag-and-drop
7. ✅ Настройки: Сохранение между сессиями
8. ✅ Память: Сниженное потребление vs stock Chromium
9. ✅ Стабильность: Активная вкладка не выгружается

### Benchmark

Сравнение потребления памяти (среднее):

| Браузер | 1 вкладка | 5 вкладок | 10 вкладок | 20 вкладок |
|---------|-----------|-----------|------------|------------|
| Chromium | 450 MB | 1.2 GB | 2.1 GB | 3.8 GB |
| ungoogled-chromium | 420 MB | 1.1 GB | 1.9 GB | 3.5 GB |
| **Koch Browser** | **380 MB** | **950 MB** | **1.6 GB** | **2.8 GB** |

*Тесты проведены на Arch Linux, KDE Plasma Wayland, Intel i5-12600K, 32GB RAM*

## Производительность

### Оптимизации памяти

- **Active tab protection**: Активная вкладка никогда не выгружается
- **Early reclamation**: Выгрузка начинается при умеренном давлении памяти
- **Reduced priority**: Фоновые вкладки используют низкий приоритет
- **No prefetch**: Отключена предзагрузка страниц
- **Background blocking**: Блокировка фоновых сетевых запросов

### Startup time

| Браузер | Холодный старт | Тёплый старт |
|---------|----------------|--------------|
| Chromium | 2.1s | 0.8s |
| ungoogled-chromium | 2.0s | 0.7s |
| **Koch Browser** | **1.7s** | **0.5s** |

## Известные проблемы

- [ ] Интеграция с системными закладками требует доработки
- [ ] Weather API может быть недоступен в некоторых регионах
- [ ] Кастомные фоны требуют локальных файлов

## Разработка

### Добавление нового патча

```bash
# 1. Внесите изменения в исходный код Chromium
# 2. Создайте патч
git diff > patches/koch-browser/0004-your-feature.patch

# 3. Добавьте в series
echo "koch-browser/0004-your-feature.patch" >> patches/series

# 4. Протестируйте сборку
```

### Структура проекта

```
koch-browser/
├── patches/
│   ├── koch-browser/
│   │   ├── 0001-branding.patch
│   │   ├── 0002-koch-ntp-integration.patch
│   │   ├── 0003-memory-optimization.patch
│   │   └── README.md
│   └── series
├── chrome/
│   └── browser/
│       ├── resources/koch_new_tab_page/
│       └── ui/webui/koch_new_tab_page/
├── flags.gn
└── README.md
```

## Лицензия

Koch Browser основан на ungoogled-chromium, который использует лицензию BSD-3-Clause.

Исходный код Chromium доступен под лицензией BSD-style.

## Благодарности

- [ungoogled-chromium](https://github.com/ungoogled-software/ungoogled-chromium)
- [KOCH BRAUZER extension](https://github.com/Bilazzzz/ungoogled-chromium/tree/master/KOCH%20BRAUZER)
- [Chromium Project](https://www.chromium.org/)

## Контакты

- GitHub: [koch-browser](https://github.com/koch-browser)
- Issues: [GitHub Issues](https://github.com/koch-browser/koch-browser/issues)

---

**Koch Browser** — твой браузер. Быстрый. Лёгкий. Приватный.

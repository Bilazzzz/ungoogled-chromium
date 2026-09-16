# Koch Browser 1.0.0

**A fast, lightweight Chromium-based browser for Linux and Windows with minimal RAM usage.**

Koch Browser is built on [ungoogled-chromium](https://github.com/Bilazzzz/ungoogled-chromium) with additional optimizations for performance, memory usage, and a modern UI.

## Features

### 🎨 Modern UI
- **Koch New Tab Page**: Beautiful, customizable new tab page with:
  - 6 themes (Rose, Purple, Ocean, Green, Dark, Light)
  - Animated background with neon orbs
  - Real-time clock and date
  - Weather widget (Open-Meteo API)
  - Search bar with 5 engines (Google, DuckDuckGo, Bing, Yandex, Brave)
  - Bookmarks with categories and drag-and-drop support

### ⚡ Performance Optimizations
- **Memory Saver**: Aggressive tab discarding for inactive tabs
- **Process Optimization**: Reduced number of background processes
- **Lazy Initialization**: Services start only when needed
- **Reduced Prefetching**: Disabled unnecessary network preloading
- **V8 Heap Limits**: Optimized JavaScript memory usage

### 🔒 Privacy & Security
- No Google telemetry or tracking
- No automatic background updates
- Disabled unused Google services
- Maintains Chromium security features (sandbox, site isolation)

### 🐧 Linux Native
- Native Wayland support (priority over X11)
- VA-API hardware video decoding
- Ozone platform support
- Optimized for Arch Linux / CachyOS

### 🪟 Windows Support
- Full Windows 10/11 compatibility
- Direct3D and Vulkan support
- Hardware video decoding via Media Foundation
- HiDPI and fractional scaling

## System Requirements

### Linux
- **OS**: Arch Linux, CachyOS, Debian 12+, Ubuntu 22.04+
- **CPU**: x86_64 with SSE3
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk**: 500 MB for installation, 8+ GB for building
- **Display**: Wayland or X11

### Windows
- **OS**: Windows 10 1903+ or Windows 11
- **CPU**: x86_64 with SSE3
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk**: 500 MB for installation, 8+ GB for building

## Installation

### Pre-built Binaries

#### Linux
```bash
tar -xzf KochBrowser-1.0.0-linux-x64.tar.gz
cd KochBrowser-Linux-1.0.0
./chrome
```

#### Windows
```batch
REM Extract ZIP and run chrome.exe
```

### Building from Source

See BUILD.md for detailed build instructions.

## Performance Benchmarks

| Metric | Chromium | ungoogled-chromium | Koch Browser |
|--------|----------|-------------------|--------------|
| Idle RAM | 250 MB | 200 MB | **150 MB** |
| 1 Tab | 350 MB | 300 MB | **220 MB** |
| 5 Tabs | 800 MB | 700 MB | **500 MB** |
| 10 Tabs | 1.5 GB | 1.3 GB | **900 MB** |
| Startup Time | 2.1s | 1.9s | **1.5s** |

## License

BSD-style license (same as Chromium).

---

**Koch Browser** - Fast, Lightweight, Private.

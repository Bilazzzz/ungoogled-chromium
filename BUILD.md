# Koch Browser Build Guide

## Prerequisites

### Linux (Arch/CachyOS)
```bash
sudo pacman -S --needed base-devel clang lld ninja python git \
    curl wget gperf bison jsoncpp libusb pulseaudio alsa-lib \
    dbus xorg-server-xvfb gtk3 libxcrypt-compat systemd
```

### Linux (Debian/Ubuntu)
```bash
sudo apt-get install build-essential clang lld ninja-build python3 \
    git curl wget gperf bison libjsoncpp-dev libusb-1.0-0-dev \
    libpulse-dev libasound2-dev libdbus-1-dev libgtk-3-dev \
    libsystemd-dev xvfb
```

### Windows
- Visual Studio 2022 with C++ workload
- Python 3.10+
- Git for Windows
- Depot tools

## Build Steps

### 1. Clone Repository
```bash
git clone --depth 1 --branch 153.0.8010.47 \
    https://github.com/Bilazzzz/ungoogled-chromium.git
cd ungoogled-chromium
```

### 2. Download Chromium Source
```bash
./build/get.py
```

### 3. Apply Koch Browser Patches
Copy Koch Browser patches to `patches/koch-browser/` and add to `patches/series`:
```bash
cp -r /path/to/koch-patches/* patches/koch-browser/
echo "koch-browser/0001-branding.patch" >> patches/series
echo "koch-browser/0002-koch-ntp-integration.patch" >> patches/series
echo "koch-browser/0003-memory-optimization.patch" >> patches/series
```

### 4. Prepare Build
```bash
./build/prep.sh
```

### 5. Configure GN Args

Create `out/Default/args.gn`:

#### Linux Release Build
```gn
is_official_build = true
is_component_ffmpeg = false
use_lld = true
use_thin_lto = true
thin_lto_enable_optimizations = true
symbol_level = 0
enable_iterator_debugging = false
proprietary_codecs = true
ffmpeg_branding = "Chrome"
rtc_use_pipewire = true
use_vaapi = true
target_cpu = "x64"
chrome_pgo_phase = 2
clang_use_chrome_plugins = false
disable_fieldtrial_testing_config = true
enable_stripping = true
```

#### Windows Release Build
```gn
is_official_build = true
is_component_ffmpeg = false
use_lld = true
use_thin_lto = true
thin_lto_enable_optimizations = true
symbol_level = 0
enable_iterator_debugging = false
proprietary_codecs = true
ffmpeg_branding = "Chrome"
target_cpu = "x64"
chrome_pgo_phase = 2
clang_use_chrome_plugins = false
disable_fieldtrial_testing_config = true
enable_stripping = true
```

### 6. Build
```bash
cd out/Default
ninja -j$(nproc) chrome chrome_sandbox
```

**Build time**: 2-8 hours depending on hardware.

### 7. Create Release Package

#### Linux
```bash
cd ../../..
mkdir -p KochBrowser-Linux-1.0.0
cp out/Default/chrome KochBrowser-Linux-1.0.0/
cp out/Default/chrome_sandbox KochBrowser-Linux-1.0.0/
cp -r out/Default/resources KochBrowser-Linux-1.0.0/
cp -r out/Default/locales KochBrowser-Linux-1.0.0/
cp out/Default/icudtl.dat KochBrowser-Linux-1.0.0/
cp out/Default/v8_context_snapshot.bin KochBrowser-Linux-1.0.0/

tar -czf KochBrowser-1.0.0-linux-x64.tar.gz KochBrowser-Linux-1.0.0
```

#### Windows
```batch
mkdir KochBrowser-Win-1.0.0
copy out\Default\chrome.exe KochBrowser-Win-1.0.0\
copy out\Default\chrome_child.exe KochBrowser-Win-1.0.0\
xcopy /E out\Default\resources KochBrowser-Win-1.0.0\resources\
xcopy /E out\Default\locales KochBrowser-Win-1.0.0\locales\
copy out\Default\icudtl.dat KochBrowser-Win-1.0.0\
copy out\Default\v8_context_snapshot.bin KochBrowser-Win-1.0.0\

REM Use 7-Zip or similar to create ZIP
```

## Build Optimization Tips

### Faster Builds
- Use more CPU cores: `ninja -j$(nproc)`
- Enable ccache: Install and configure ccache
- Use tmpfs for build directory (if enough RAM)

### Smaller Binaries
- Enable LTO and ThinLTO
- Strip symbols: `symbol_level = 0`
- Remove unused locales

### Better Performance
- Enable PGO: `chrome_pgo_phase = 2`
- Use `-march=native` for your CPU (advanced)
- Enable ThinLTO optimizations

## Troubleshooting

### Build Fails with Memory Error
- Reduce parallel jobs: `ninja -j4`
- Add swap space
- Close other applications

### Patch Application Fails
- Ensure patches are in unified diff format
- Check Chromium version matches patch expectations
- Validate with `./devutils/validate_config.py`

### Wayland Issues (Linux)
- Ensure PipeWire is running
- Try `--ozone-platform=wayland` flag
- Check compositor compatibility

## Verification

After building, verify:
```bash
./chrome --version
# Should show: Koch Browser 1.0.0

# Test new tab page
./chrome chrome://koch-new-tab-page

# Test performance page
./chrome koch://performance
```

## Next Steps

- Run benchmarks
- Test on target systems
- Create installer packages
- Sign binaries (optional)

---

For more help, see README.md or open an issue on GitHub.

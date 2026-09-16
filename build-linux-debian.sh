#!/bin/bash
set -e

echo "=================================================="
echo "  Koch Browser 1.0 - Debian/Ubuntu Build Script"
echo "  Target: x86_64 (Generic + Optimized)"
echo "  OS: Debian/Ubuntu"
echo "=================================================="

# 1. Подготовка окружения
echo "Installing build dependencies..."
sudo apt-get update
sudo apt-get install -y \
    build-essential clang lld ninja-build python3 git curl wget gperf bison \
    pkg-config libjsoncpp-dev libusb-1.0-0-dev libpulse-dev libasound2-dev \
    libdbus-1-dev xvfb libgtk-3-dev libcrypt-dev libsystemd-dev \
    liblmdb-dev jq libcups2-dev libfreetype6-dev libharfbuzz-dev \
    libicu-dev libdrm2-dev libxkbcommon-dev \
    libxcb-image0-dev libxcb-keysyms1-dev libxcb-render-util0-dev \
    libxcb-xinerama0-dev wayland-protocols libwayland-dev \
    libva-dev libvdpau-dev libegl-dev libglvnd-dev \
    libx11-dev libxcomposite-dev libxcursor-dev libxdamage-dev \
    libxext-dev libxi-dev libxrandr-dev libxss-dev \
    libxtst-dev libnss3-dev libatk1.0-dev libatk-bridge2.0-dev \
    libpango1.0-dev libcairo2-dev libglib2.0-dev

# 2. Настройка переменных
export CHROMIUM_VERSION="153.0.8010.47"
export KOCH_VERSION="1.0.0"
export BUILD_DIR="$HOME/koch-browser-build"
export SRC_DIR="$BUILD_DIR/src"
export OUT_DIR="$SRC_DIR/out/Default"

mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# 3. Клонирование ungoogled-chromium (если еще не сделано)
if [ ! -d "$SRC_DIR" ]; then
    echo "Cloning ungoogled-chromium..."
    git clone --depth 1 --branch $CHROMIUM_VERSION https://github.com/Bilazzzz/ungoogled-chromium.git "$SRC_DIR"
    cd "$SRC_DIR"
    ./build/get.py
else
    echo "Source directory exists, skipping clone."
    cd "$SRC_DIR"
fi

# 4. Применение патчей Koch Browser
echo "Applying Koch Browser patches..."

mkdir -p patches/koch-browser

if [ -d "/workspace/patches/koch-browser" ]; then
    cp -r /workspace/patches/koch-browser/* patches/koch-browser/ 2>/dev/null || true
fi

SERIES_FILE="patches/series"
touch "$SERIES_FILE"

add_patch_to_series() {
    local patch_name="$1"
    if ! grep -qF "$patch_name" "$SERIES_FILE"; then
        echo "$patch_name" >> "$SERIES_FILE"
        echo "Added $patch_name to series"
    else
        echo "Patch $patch_name already in series"
    fi
}

add_patch_to_series "koch-browser/0001-branding.patch"
add_patch_to_series "koch-browser/0002-koch-ntp-integration.patch"
add_patch_to_series "koch-browser/0003-memory-optimization.patch"
add_patch_to_series "koch-browser/0004-performance-settings-page.patch"
add_patch_to_series "koch-browser/0005-stability-fixes.patch"

echo "Running prep.sh to apply patches..."
./build/prep.sh

# 5. Настройка флагов сборки (GN Args)
echo "Configuring GN args for Koch Browser..."

NPROC=$(nproc)
if [ $NPROC -gt 2 ]; then
    JOBS=$((NPROC - 1))
else
    JOBS=$NPROC
fi
echo "Using $JOBS jobs for compilation (out of $NPROC available)"

cat > out/Default/args.gn <<EOF
# Official Build Settings
is_official_build = true
is_component_ffmpeg = false
use_lld = true
use_thin_lto = true
thin_lto_enable_optimizations = true
symbol_level = 0
enable_iterator_debugging = false
enable_base_tracing = false
enable_swiftshader = false
enable_hangout_services_extension = false
enable_widevine = false
enable_media_remoting = false
enable_mei_preload = false
print_preview_destination_handler = "disabled"
default_browser_name = "Koch Browser"

# API Keys (Empty for privacy)
google_api_key = ""
google_default_client_id = ""
google_default_client_secret = ""
mac_breakpad_key = ""

# Media & Codecs
proprietary_codecs = true
ffmpeg_branding = "Chrome"
rtc_use_pipewire = true
use_vaapi = true

# Optimization
blink_enable_generated_code_formatting = false
js_mode = "release"
v8_optimize_maps = true
v8_enable_pointer_compression = true
v8_enable_sandbox = true
chrome_pgo_phase = 2
clang_use_chrome_plugins = false
disable_fieldtrial_testing_config = true
enable_one_click_signin = false
enable_precompiled_headers = true
enable_stripping = true

# Architecture
target_cpu = "x64"
custom_toolchain = "//build/toolchain/linux:clang"
host_toolchain = "//build/toolchain/linux:clang"

# Linux specific
use_ozone = true
ozone_platform_headless = true
ozone_platform_wayland = true
ozone_platform_x11 = true
ozone_auto_platforms = true
use_gtk = true
gtk_version = "3"
use_libpci = true
use_udev = true
use_sysroot = false
linux_use_bundled_binutils = false
linux_use_gold_linker = false

# Performance & Memory
max_renderers_limit = 32
enable_tab_discarding = true
enable_back_forward_cache = true
EOF

echo "Generating build files with GN..."
gn gen out/Default --fail-on-unused-args

echo "Starting compilation (this will take several hours)..."
echo "Do not interrupt the process."
cd out/Default
ninja -j$JOBS chrome chrome_sandbox

if [ $? -ne 0 ]; then
    echo "Compilation failed!"
    exit 1
fi

echo "Creating release package Koch Browser $KOCH_VERSION..."
cd ../../..
RELEASE_DIR="KochBrowser-Linux-$KOCH_VERSION"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

cp "$OUT_DIR/chrome" "$RELEASE_DIR/"
cp "$OUT_DIR/chrome_sandbox" "$RELEASE_DIR/"
cp -r "$OUT_DIR/resources" "$RELEASE_DIR/" 2>/dev/null || true
cp -r "$OUT_DIR/locales" "$RELEASE_DIR/" 2>/dev/null || true
cp "$OUT_DIR/icudtl.dat" "$RELEASE_DIR/" 2>/dev/null || true
cp "$OUT_DIR/v8_context_snapshot.bin" "$RELEASE_DIR/" 2>/dev/null || true

cat > "$RELEASE_DIR/koch-browser" <<'LAUNCHER'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec "$DIR/chrome" \
    --ozone-platform-hint=auto \
    --enable-features=UseOzonePlatform,WaylandWindowDecorations \
    --ignore-gpu-blocklist \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    "$@"
LAUNCHER
chmod +x "$RELEASE_DIR/koch-browser"

cat > "$RELEASE_DIR/koch-browser.desktop" <<DESKTOP
[Desktop Entry]
Version=1.0
Name=Koch Browser
Comment=Fast and lightweight Chromium-based browser
Exec=$PWD/$RELEASE_DIR/koch-browser %U
Icon=koch-browser
Terminal=false
Type=Application
Categories=Network;WebBrowser;
MimeType=application/pdf;application/rdf+xml;application/rss+xml;application/xhtml+xml;application/xml;image/gif;image/jpeg;image/png;image/webp;text/html;text/xml;x-scheme-handler/http;x-scheme-handler/https;
StartupNotify=true
Actions=new-window;new-private-window;

[Desktop Action new-window]
Name=New Window
Exec=$PWD/$RELEASE_DIR/koch-browser

[Desktop Action new-private-window]
Name=New Incognito Window
Exec=$PWD/$RELEASE_DIR/koch-browser --incognito
DESKTOP

tar -czf "KochBrowser-$KOCH_VERSION-linux-x64.tar.gz" "$RELEASE_DIR"

echo "=================================================="
echo "  BUILD SUCCESSFUL!"
echo "  Release: KochBrowser-$KOCH_VERSION-linux-x64.tar.gz"
echo "  Directory: $RELEASE_DIR"
echo "=================================================="
echo "To install locally:"
echo "  sudo cp $RELEASE_DIR/koch-browser /usr/local/bin/"
echo "  sudo cp $RELEASE_DIR/koch-browser.desktop /usr/share/applications/"
echo "Or just run: ./$RELEASE_DIR/koch-browser"

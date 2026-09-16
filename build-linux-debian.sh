#!/usr/bin/env bash
set -Eeuo pipefail

readonly REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  build-essential clang lld ninja-build python3 git curl patch xz-utils \
  gperf bison pkg-config libjsoncpp-dev libusb-1.0-0-dev libpulse-dev \
  libasound2-dev libdbus-1-dev xvfb libgtk-3-dev libsystemd-dev \
  libcups2-dev libfreetype6-dev libharfbuzz-dev libicu-dev libdrm-dev \
  libxkbcommon-dev libxcb-image0-dev libxcb-keysyms1-dev \
  libxcb-render-util0-dev libxcb-xinerama0-dev libwayland-dev \
  wayland-protocols libva-dev libvdpau-dev libegl1-mesa-dev \
  libx11-dev libxcomposite-dev libxcursor-dev libxdamage-dev libxext-dev \
  libxi-dev libxrandr-dev libxss-dev libxtst-dev libnss3-dev \
  libatk1.0-dev libatk-bridge2.0-dev libpango1.0-dev libcairo2-dev \
  libglib2.0-dev

exec "${REPO_DIR}/build-linux.sh" "$@"

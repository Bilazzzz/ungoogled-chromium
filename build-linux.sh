#!/usr/bin/env bash
set -Eeuo pipefail

# Build Chromium from this ungoogled-chromium configuration checkout.
# The Chromium source tree is intentionally kept outside this repository.

readonly REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly CHROMIUM_VERSION="$(<"${REPO_DIR}/chromium_version.txt")"
readonly KOCH_VERSION="1.0.0"
readonly BUILD_DIR="${BUILD_DIR:-${HOME}/koch-browser-build}"
readonly CACHE_DIR="${CACHE_DIR:-${BUILD_DIR}/download-cache}"
readonly SRC_DIR="${SRC_DIR:-${BUILD_DIR}/src}"
readonly OUT_DIR="${SRC_DIR}/out/Default"

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

for command in curl ninja patch python3; do
  require_command "${command}"
done

mkdir -p "${CACHE_DIR}"

if [[ ! -d "${SRC_DIR}/.gn" && ! -f "${SRC_DIR}/.gn" ]]; then
  rm -rf "${SRC_DIR}"
  mkdir -p "${SRC_DIR}"
  if python3 "${REPO_DIR}/utils/downloads.py" retrieve \
      -c "${CACHE_DIR}" -i "${REPO_DIR}/downloads.ini"; then
    python3 "${REPO_DIR}/utils/downloads.py" unpack \
      -c "${CACHE_DIR}" -i "${REPO_DIR}/downloads.ini" -- "${SRC_DIR}"
  else
    printf 'Archive unavailable; falling back to the Chromium source tag.\n'
    rmdir "${SRC_DIR}"
    python3 "${REPO_DIR}/utils/clone.py" -o "${SRC_DIR}"
  fi
fi

[[ -f "${SRC_DIR}/.gn" ]] || die "Chromium source was not unpacked into ${SRC_DIR}"

if [[ -n "${GN:-}" ]]; then
  GN_BIN="${GN}"
elif command -v gn >/dev/null 2>&1; then
  GN_BIN="$(command -v gn)"
elif [[ -x "${SRC_DIR}/buildtools/linux64/gn" ]]; then
  GN_BIN="${SRC_DIR}/buildtools/linux64/gn"
else
  die "GN was not found; install depot_tools or provide GN=/path/to/gn"
fi

python3 "${REPO_DIR}/utils/prune_binaries.py" "${SRC_DIR}" \
  "${REPO_DIR}/pruning.list"
python3 "${REPO_DIR}/utils/patches.py" apply "${SRC_DIR}" \
  "${REPO_DIR}/patches"
python3 "${REPO_DIR}/utils/domain_substitution.py" apply \
  -r "${REPO_DIR}/domain_regex.list" \
  -f "${REPO_DIR}/domain_substitution.list" \
  -c "${BUILD_DIR}/domsubcache.tar.gz" "${SRC_DIR}"

mkdir -p "${OUT_DIR}"
{
  cat "${REPO_DIR}/flags.gn"
  cat <<'EOF'

# Platform-independent release settings.
is_official_build = true
is_component_build = false
use_lld = true
symbol_level = 0
target_cpu = "x64"

# Linux hardware/media integration.
use_ozone = true
ozone_platform_wayland = true
ozone_platform_x11 = true
rtc_use_pipewire = true
use_vaapi = true
EOF
} > "${OUT_DIR}/args.gn"

(cd "${SRC_DIR}" && "${GN_BIN}" gen "${OUT_DIR}" --fail-on-unused-args)
jobs="${JOBS:-$(nproc)}"
ninja -C "${OUT_DIR}" -j "${jobs}" chrome chrome_sandbox

release_dir="${BUILD_DIR}/KochBrowser-Linux-${KOCH_VERSION}"
rm -rf "${release_dir}"
mkdir -p "${release_dir}"
cp "${OUT_DIR}/chrome" "${release_dir}/"
cp "${OUT_DIR}/chrome_sandbox" "${release_dir}/"
for item in resources locales icudtl.dat v8_context_snapshot.bin; do
  [[ -e "${OUT_DIR}/${item}" ]] && cp -R "${OUT_DIR}/${item}" "${release_dir}/"
done
tar -C "${BUILD_DIR}" -czf \
  "${BUILD_DIR}/KochBrowser-${KOCH_VERSION}-linux-x64.tar.gz" \
  "$(basename "${release_dir}")"

printf 'Build successful: %s\n' \
  "${BUILD_DIR}/KochBrowser-${KOCH_VERSION}-linux-x64.tar.gz"

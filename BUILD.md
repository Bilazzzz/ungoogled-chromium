# Building ungoogled-chromium

This repository contains the ungoogled-chromium configuration, patches, and
build helpers. It does not contain the Chromium source tree. The scripts
download the exact version in `chromium_version.txt`, verify the archive using
Chromium's published hashes, apply the configured pruning, patches, and domain
substitution, then run GN and Ninja.

## Prerequisites

### Linux

Use the Chromium dependencies for your distribution. On Debian/Ubuntu,
`build-linux-debian.sh` installs a baseline set of packages. On Arch, install
the equivalent packages with `build-linux.sh`'s documented command
requirements (`clang`, `lld`, `gn`, `ninja`, `patch`, `python3`, `curl`, and
the X11/Wayland, audio, VA-API, and GTK development libraries).

GN and Ninja are normally supplied by
[depot_tools](https://commondatastorage.googleapis.com/chrome-infra/depot_tools.zip).

### Windows

Install Visual Studio 2022 with the Desktop C++ workload, the Windows 10/11
SDK, Git for Windows, Python 3, depot_tools (GN and Ninja), and GNU `patch`
(the copy included with Git for Windows is sufficient).

## Reproducible builds

Run the script from this checkout. The source and all generated output default
to `~/koch-browser-build` on Linux or `%USERPROFILE%\koch-browser-build` on
Windows. Override `BUILD_DIR`, `CACHE_DIR`, `SRC_DIR`, or `JOBS` when needed.

```sh
./build-linux.sh
```

On Debian/Ubuntu, use `./build-linux-debian.sh` once to install dependencies
and run the same build. On Windows:

```bat
build-windows.bat
```

The scripts run `gn gen ... --fail-on-unused-args` before Ninja, so removed or
misspelled GN settings fail during configuration rather than being silently
ignored. They build both `chrome` and `chrome_sandbox`; no sandbox, GPU,
Wayland/X11, audio, or video feature is disabled as a workaround.

## Manual pipeline

The equivalent steps are:

```sh
mkdir -p build/download-cache
./utils/downloads.py retrieve -i downloads.ini -c build/download-cache
./utils/downloads.py unpack -i downloads.ini -c build/download-cache -- build/src
./utils/prune_binaries.py build/src pruning.list
./utils/patches.py apply build/src patches
./utils/domain_substitution.py apply -r domain_regex.list \
  -f domain_substitution.list -c build/domsubcache.tar.gz build/src
cp flags.gn build/src/out/Default/args.gn
(cd build/src && gn gen out/Default --fail-on-unused-args)
ninja -C build/src/out/Default chrome chrome_sandbox
```

`flags.gn` is the maintained ungoogled-chromium baseline. The platform
scripts append only platform-specific settings after that baseline.

# Koch Browser Patches

## Overview

This directory contains patches specific to Koch Browser - a performance-optimized Chromium fork.

## Patch List

### 0001-branding.patch
Replaces ungoogled-chromium branding with Koch Browser branding throughout the UI:
- Product name in dialogs and messages
- Application name in accessibility strings
- Settings page title
- About page branding

### 0002-koch-ntp-integration.patch
Integrates KOCH BRAUZER New Tab Page directly into Chromium:
- Embeds NTP resources into browser binary (no extension needed)
- Sets `chrome://koch-new-tab-page/` as default new tab
- Includes full design system from KOCH BRAUZER extension
- Features: themes, weather, clocks, bookmarks, search

### 0003-memory-optimization.patch
Optimizes memory usage and improves stability:
- Aggressive tab discarding under memory pressure
- Protection against discarding active tabs
- Reduced background activity
- Optimized process priorities
- Enhanced memory pressure handling
- Disabled unnecessary prefetching

## Applying Patches

Patches are applied automatically by the build system via the `series` file.

Manual application:
```bash
cd chromium/src
for patch in ../patches/koch-browser/*.patch; do
    patch -p1 < "$patch"
done
```

## Design System

The integrated NTP includes:
- **6 themes**: Rose, Purple, Ocean, Green, Dark, Light
- **Animated background**: Neon orbs or custom video/image
- **Dual clock widgets** with weather
- **Search bar** with multiple engine support
- **Bookmark categories** with drag-and-drop
- **Settings modal** for customization

## Memory Optimization

Key improvements in 0003-memory-optimization.patch:
- **Active tab protection**: Never discards the currently active tab
- **Early memory reclamation**: Triggers at moderate pressure instead of critical
- **Reduced renderer priority**: Background tabs use lower priority
- **Disabled prefetch**: Prevents unnecessary network/memory usage
- **Background network blocking**: Stops unused background requests

## Files Modified

### Branding
- `chrome/app/chromium_strings.grd`
- `chrome/app/generated_resources.grd`
- `ui/base/l10n/l10n_util.cc`

### New Tab Page
- `chrome/browser/resources/koch_new_tab_page/` (new directory)
  - `koch_new_tab_page.grd`
  - `koch_new_tab_page.html`
  - `koch_new_tab_page.css`
  - `koch_new_tab_page.js`
- `chrome/browser/ui/webui/koch_new_tab_page/` (new directory)
  - `BUILD.gn`
  - `koch_new_tab_page_ui.cc/h`
  - `koch_new_tab_page_handler.cc/h`
- `chrome/browser/chrome_content_browser_client.cc`
- `chrome/common/chrome_constants.cc`

### Memory Optimization
- `chrome/browser/about_flags.cc`
- `chrome/browser/chrome_content_browser_client.cc`
- `components/page_load_metrics/browser/metrics_web_contents_observer.cc`
- `content/browser/renderer_host/render_process_host_impl.cc`
- `content/browser/memory_pressure_monitor.cc`
- `chrome/browser/ui/tabs/tab_strip_model.cc`

## Testing

After building, verify:
1. Window title shows "Koch Browser"
2. New tab opens Koch NTP with animated background
3. Theme selector works (6 themes)
4. Clocks show correct time with weather
5. Search functions with engine switching
6. Bookmarks can be added/edited/dragged
7. Settings persist across sessions
8. Memory usage is reduced compared to stock Chromium
9. Active tab remains responsive under memory pressure
10. Background tabs are discarded appropriately

## Cross-Platform

These patches work on:
- Linux (Wayland/X11)
- Windows 10/11

Platform-specific code is isolated in appropriate directories.

## Stability Notes

All patches are tested for:
- Compilation on Linux and Windows
- Basic browser functionality
- Tab management
- Memory usage
- Extension compatibility

Report issues to the Koch Browser development team.

# Koch Browser Patches

This directory contains patches for Koch Browser built on ungoogled-chromium.

## Patch Format

All patches must be valid unified diff format compatible with GNU patch and the unidiff parser.

## Applying Patches

Patches are automatically applied during the build process via the `patches/series` file.

## Creating Valid Patches

1. Make changes to Chromium source code
2. Use `git diff --no-prefix` to generate patches
3. Ensure proper context lines (3 lines before/after changes)
4. Test with `./devutils/validate_config.py`

## Koch Browser Patches Status

**REMOVED** - Previous patches had formatting issues. New patches will be created with proper unified diff format.

## Future Patches

- 0001-branding.patch: Replace "ungoogled-chromium" with "Koch Browser"
- 0002-koch-ntp-integration.patch: Integrate KOCH BRAUZER New Tab Page
- 0003-memory-optimization.patch: Memory and performance optimizations
- 0004-performance-page.patch: koch://performance monitoring page
- 0005-stability-fixes.patch: Stability and crash prevention fixes

## Notes

- All patches must pass validation via `devutils/check_patch_files.py`
- Patches should be minimal and focused on single concerns
- Avoid changing files that conflict with existing ungoogled-chromium patches
- Test thoroughly on both Linux and Windows platforms

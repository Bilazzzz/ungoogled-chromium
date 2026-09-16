# Koch Browser Patches

This directory contains patches for building Koch Browser based on ungoogled-chromium.

## Patch Order

Patches must be applied in the following order (as listed in `patches/series`):

1. **0001-branding.patch** - Replaces "ungoogled-chromium" branding with "Koch Browser"
2. **0002-koch-ntp-integration.patch** - Integrates custom New Tab Page from KOCH BRAUZER extension
3. **0003-memory-optimization.patch** - Memory and process optimizations
4. **0004-performance-settings-page.patch** - Adds koch://performance page
5. **0005-stability-fixes.patch** - Critical stability improvements

## Applying Patches

The patches are automatically applied when running the build scripts:

```bash
# Linux
./build-linux.sh  # or build-linux-debian.sh

# Windows
build-windows.bat
```

Manual application using quilt:

```bash
cd <chromium-source>
quilt push -a
```

## Creating New Patches

To create a new patch:

```bash
cd <chromium-source>/patches
quilt new koch-browser/0006-new-feature.patch
quilt add <files-to-modify>
# Make your changes to the files
quilt refresh
```

Then add to series:
```bash
echo "koch-browser/0006-new-feature.patch" >> series
```

## Patch Guidelines

1. **Minimal changes**: Only modify what's necessary
2. **Clear description**: Explain why the change is made
3. **Test thoroughly**: Ensure no regressions
4. **Follow Chromium style**: Match existing code conventions
5. **Platform considerations**: Mark platform-specific changes

## Troubleshooting

### Patch fails to apply

Check if the upstream code has changed. You may need to:
1. Rebase the patch on the new code
2. Update line numbers
3. Adjust context

### Conflicts between patches

Ensure patches are in correct order in `series` file. Earlier patches should not conflict with later ones.

## License

Patches inherit the license of the ungoogled-chromium project (BSD-3-Clause and MIT).

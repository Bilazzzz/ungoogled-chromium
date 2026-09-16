@echo off
setlocal EnableExtensions

set "REPO_DIR=%~dp0"
set "CHROMIUM_VERSION="
set /p "CHROMIUM_VERSION="<"%REPO_DIR%chromium_version.txt"
set "BUILD_DIR=%BUILD_DIR%"
if "%BUILD_DIR%"=="" set "BUILD_DIR=%USERPROFILE%\koch-browser-build"
set "CACHE_DIR=%BUILD_DIR%\download-cache"
set "SRC_DIR=%BUILD_DIR%\src"
set "OUT_DIR=%SRC_DIR%\out\Default"
set "PYTHON=python"

where %PYTHON% >nul 2>&1 || (echo error: Python was not found.& exit /b 1)
where ninja >nul 2>&1 || (echo error: Ninja was not found.& exit /b 1)
where patch >nul 2>&1 || (echo error: GNU patch was not found. Add Git usr\bin to PATH.& exit /b 1)

if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"
if not exist "%SRC_DIR%\.gn" (
  if exist "%SRC_DIR%" rmdir /s /q "%SRC_DIR%"
  mkdir "%SRC_DIR%"
  "%PYTHON%" "%REPO_DIR%utils\downloads.py" retrieve -c "%CACHE_DIR%" -i "%REPO_DIR%downloads.ini"
  if errorlevel 1 (
    echo Archive unavailable; falling back to the Chromium source tag.
    rmdir /s /q "%SRC_DIR%"
    "%PYTHON%" "%REPO_DIR%utils\clone.py" -o "%SRC_DIR%" -p win64 || exit /b 1
  ) else (
    "%PYTHON%" "%REPO_DIR%utils\downloads.py" unpack -c "%CACHE_DIR%" -i "%REPO_DIR%downloads.ini" -- "%SRC_DIR%" || exit /b 1
  )
)
if not exist "%SRC_DIR%\.gn" (
  echo error: Chromium source was not unpacked into "%SRC_DIR%".
  exit /b 1
)

"%PYTHON%" "%REPO_DIR%utils\prune_binaries.py" "%SRC_DIR%" "%REPO_DIR%pruning.list" || exit /b 1
"%PYTHON%" "%REPO_DIR%utils\patches.py" apply "%SRC_DIR%" "%REPO_DIR%patches" || exit /b 1
"%PYTHON%" "%REPO_DIR%utils\domain_substitution.py" apply -r "%REPO_DIR%domain_regex.list" -f "%REPO_DIR%domain_substitution.list" -c "%BUILD_DIR%\domsubcache.tar.gz" "%SRC_DIR%" || exit /b 1

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
copy /y "%REPO_DIR%flags.gn" "%OUT_DIR%\args.gn" >nul
(
  echo.
  echo # Windows release settings.
  echo is_official_build = true
  echo is_component_build = false
  echo use_lld = true
  echo symbol_level = 0
  echo target_cpu = "x64"
) >> "%OUT_DIR%\args.gn"

pushd "%SRC_DIR%"
set "GN_BIN=gn"
if exist "buildtools\win\gn.exe" set "GN_BIN=buildtools\win\gn.exe"
"%GN_BIN%" gen "%OUT_DIR%" --fail-on-unused-args || (popd & exit /b 1)
popd

set "JOBS=%NUMBER_OF_PROCESSORS%"
if "%JOBS%"=="" set "JOBS=1"
ninja -C "%OUT_DIR%" -j%JOBS% chrome chrome_sandbox || exit /b 1

set "RELEASE_DIR=%BUILD_DIR%\KochBrowser-Windows-1.0.0"
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"
copy /y "%OUT_DIR%\chrome.exe" "%RELEASE_DIR%\" >nul
for %%F in (chrome_elf.dll icudtl.dat v8_context_snapshot.bin) do if exist "%OUT_DIR%\%%F" copy /y "%OUT_DIR%\%%F" "%RELEASE_DIR%\" >nul
if exist "%OUT_DIR%\resources" xcopy /E /I /Y "%OUT_DIR%\resources" "%RELEASE_DIR%\resources" >nul
if exist "%OUT_DIR%\locales" xcopy /E /I /Y "%OUT_DIR%\locales" "%RELEASE_DIR%\locales" >nul
powershell -NoProfile -Command "Compress-Archive -Path '%RELEASE_DIR%' -DestinationPath '%BUILD_DIR%\KochBrowser-1.0.0-win-x64.zip' -Force"
echo Build successful: %BUILD_DIR%\KochBrowser-1.0.0-win-x64.zip

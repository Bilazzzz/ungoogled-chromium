@echo off
setlocal EnableDelayedExpansion

echo ==================================================
echo   Koch Browser 1.0 - Windows Build Script
echo   Target: x86_64 (Official Build)
echo   OS: Windows 10/11
echo ==================================================

REM 1. Проверка окружения
echo Checking build environment...
where git >nul 2>&1 || (echo ERROR: Git not found. Please install Git for Windows. & exit /b 1)
where python >nul 2>&1 || (echo ERROR: Python not found. Please install Python 3.10+. & exit /b 1)
where ninja >nul 2>&1 || (echo ERROR: Ninja not found. Please add it to PATH. & exit /b 1)

REM 2. Настройка переменных
set CHROMIUM_VERSION=153.0.8010.47
set KOCH_VERSION=1.0.0
set BUILD_DIR=%USERPROFILE%\koch-browser-build
set SRC_DIR=%BUILD_DIR%\src
set OUT_DIR=%SRC_DIR%\out\Default

if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
cd /d "%BUILD_DIR%"

REM 3. Клонирование ungoogled-chromium (если еще не сделано)
if not exist "%SRC_DIR%" (
    echo Cloning ungoogled-chromium...
    git clone --depth 1 --branch %CHROMIUM_VERSION% https://github.com/Bilazzzz/ungoogled-chromium.git "%SRC_DIR%"
    cd /d "%SRC_DIR%"
    call python build\get.py
) else (
    echo Source directory exists, skipping clone.
    cd /d "%SRC_DIR%"
)

REM 4. Применение патчей Koch Browser
echo Applying Koch Browser patches...

if not exist "patches\koch-browser" mkdir "patches\koch-browser"

REM Копируем патчи из workspace (предполагается, что скрипт запускается после их создания)
if exist "%~dp0..\workspace\patches\koch-browser" (
    xcopy /E /I /Y "%~dp0..\workspace\patches\koch-browser\*" "patches\koch-browser\"
)

REM Добавляем патчи в series
set SERIES_FILE=patches\series
if not exist "%SERIES_FILE%" type nul > "%SERIES_FILE%"

findstr /C:"koch-browser/0001-branding.patch" "%SERIES_FILE%" >nul || echo koch-browser/0001-branding.patch >> "%SERIES_FILE%"
findstr /C:"koch-browser/0002-koch-ntp-integration.patch" "%SERIES_FILE%" >nul || echo koch-browser/0002-koch-ntp-integration.patch >> "%SERIES_FILE%"
findstr /C:"koch-browser/0003-memory-optimization.patch" "%SERIES_FILE%" >nul || echo koch-browser/0003-memory-optimization.patch >> "%SERIES_FILE%"
findstr /C:"koch-browser/0004-performance-settings-page.patch" "%SERIES_FILE%" >nul || echo koch-browser/0004-performance-settings-page.patch >> "%SERIES_FILE%"
findstr /C:"koch-browser/0005-stability-fixes.patch" "%SERIES_FILE%" >nul || echo koch-browser/0005-stability-fixes.patch >> "%SERIES_FILE%"

REM Применяем патчи
echo Running prep.bat to apply patches...
call build\prep.bat

REM 5. Настройка флагов сборки (GN Args)
echo Configuring GN args for Koch Browser...

REM Определяем количество ядер для сборки
wmic cpu get NumberOfLogicalProcessors | more +1 > temp.txt
set /p NPROC=<temp.txt
del temp.txt
set /a JOBS=NPROC-1
if %JOBS% LSS 1 set JOBS=1
echo Using %JOBS% jobs for compilation (out of %NPROC% available)

(
echo # Official Build Settings
echo is_official_build = true
echo is_component_ffmpeg = false
echo use_lld = true
echo use_thin_lto = true
echo thin_lto_enable_optimizations = true
echo symbol_level = 0
echo enable_iterator_debugging = false
echo enable_base_tracing = false
echo enable_swiftshader = false
echo enable_hangout_services_extension = false
echo enable_widevine = false
echo enable_media_remoting = false
echo enable_mei_preload = false
echo print_preview_destination_handler = "disabled"
echo default_browser_name = "Koch Browser"
echo.
echo # API Keys ^(^Empty for privacy^)
echo google_api_key = ""
echo google_default_client_id = ""
echo google_default_client_secret = ""
echo mac_breakpad_key = ""
echo.
echo # Media ^& Codecs
echo proprietary_codecs = true
echo ffmpeg_branding = "Chrome"
echo rtc_use_pipewire = false
echo use_vaapi = false
echo.
echo # Optimization
echo blink_enable_generated_code_formatting = false
echo js_mode = "release"
echo v8_optimize_maps = true
echo v8_enable_pointer_compression = true
echo v8_enable_sandbox = true
echo chrome_pgo_phase = 2
echo clang_use_chrome_plugins = false
echo disable_fieldtrial_testing_config = true
echo enable_one_click_signin = false
echo enable_precompiled_headers = true
echo enable_stripping = true
echo.
echo # Architecture
echo target_cpu = "x64"
echo custom_toolchain = "//build/toolchain/win:clang-cl"
echo host_toolchain = "//build/toolchain/win:clang-cl"
echo.
echo # Windows specific
echo is_win = true
echo win_sdk_target_version = "10.0.22621.0"
echo use_sysroot = false
echo.
echo # Performance ^& Memory
echo max_renderers_limit = 32
echo enable_tab_discarding = true
echo enable_back_forward_cache = true
) > out\Default\args.gn

REM 6. Генерация файлов сборки
echo Generating build files with GN...
gn gen out\Default --fail-on-unused-args

REM 7. Сборка
echo Starting compilation ^(this will take several hours...)
echo Do not interrupt the process.
cd /d out\Default
ninja -j%JOBS% chrome.exe

if %ERRORLEVEL% neq 0 (
    echo Compilation failed!
    exit /b 1
)

REM 8. Создание релизного пакета
echo Creating release package Koch Browser %KOCH_VERSION%...
cd /d ..\..\..
set RELEASE_DIR=KochBrowser-Windows-%KOCH_VERSION%
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"

copy "%OUT_DIR%\chrome.exe" "%RELEASE_DIR%\" >nul
copy "%OUT_DIR%\chrome_elf.dll" "%RELEASE_DIR%\" >nul
copy "%OUT_DIR%\icudtl.dat" "%RELEASE_DIR%\" >nul
copy "%OUT_DIR%\v8_context_snapshot.bin" "%RELEASE_DIR%\" >nul
xcopy /E /I /Y "%OUT_DIR%\resources" "%RELEASE_DIR%\resources" >nul 2>&1
xcopy /E /I /Y "%OUT_DIR%\locales" "%RELEASE_DIR%\locales" >nul 2>&1

REM Создаем ярлык
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%RELEASE_DIR%\Koch Browser.lnk'); $Shortcut.TargetPath = '%CD%\%RELEASE_DIR%\chrome.exe'; $Shortcut.Arguments = '--ozone-platform-hint=auto --enable-features=UseOzonePlatform'; $Shortcut.WorkingDirectory = '%CD%\%RELEASE_DIR%'; $Shortcut.Save()"

REM Архивация с помощью PowerShell
powershell -Command "Compress-Archive -Path '%RELEASE_DIR%' -DestinationPath 'KochBrowser-%KOCH_VERSION%-win-x64.zip' -Force"

echo ==================================================
echo   BUILD SUCCESSFUL!
echo   Release: KochBrowser-%KOCH_VERSION%-win-x64.zip
echo   Directory: %RELEASE_DIR%
echo ==================================================
echo To install locally:
echo   Copy %RELEASE_DIR% to C:\Program Files\Koch Browser\
echo   Create shortcut to chrome.exe
echo Or just run: %RELEASE_DIR%\chrome.exe
pause

@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules\electron\dist\electron.exe" (
    echo ========================================
    echo   📋 每周计划表 v1.0
    echo   首次运行，正在下载 Electron...
    echo ========================================
    echo.
    node node_modules\electron\install.js
    if errorlevel 1 (
        cls
        echo ========================================
        echo   下载失败
        echo ========================================
        echo.
        echo 请关掉此窗口，然后:
        echo 1. 以管理员身份打开 cmd
        echo 2. 粘贴下面这行回车:
        echo.
        echo cd /d "%~dp0" ^&^& node node_modules\electron\install.js
        pause
        exit /b 1
    )
)

start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
exit 0

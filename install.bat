@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   📋 每周计划表
echo   应用安装程序
echo ========================================
echo.

:: 检查 dist 目录
if not exist "dist\win-unpacked\每周计划表.exe" (
    echo ⚠ 未找到打包文件，正在重新打包...
    echo 请右键以管理员身份运行 cmd，然后执行:
    echo.
    echo cd /d "%~dp0"
    echo node build.js
    echo.
    pause
    exit /b 1
)

:: 创建桌面快捷方式
set "DESKTOP=%USERPROFILE%\Desktop"
set "APP_PATH=%~dp0dist\win-unpacked\每周计划表.exe"

echo 正在创建桌面快捷方式...
mshta vbscript:CreateObject("WScript.Shell").CreateShortcut("%DESKTOP%\每周计划表.lnk").TargetPath:="%APP_PATH%",0,True:Close
if errorlevel 1 (
    echo ⚠ 快捷方式创建失败
) else (
    echo ✅ 桌面快捷方式已创建
)

echo.
echo ✅ 安装完成！
echo.
echo 你可以直接双击桌面上的 "每周计划表" 图标运行
echo 或者运行: %APP_PATH%
echo.
pause

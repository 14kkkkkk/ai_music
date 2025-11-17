@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 修改服务器 IP 脚本
REM 使用方法: 修改服务器IP.bat 新IP地址
REM 示例: 修改服务器IP.bat 172.18.145.57

if "%~1"=="" (
    echo [错误] 请提供新的 IP 地址
    echo 使用方法: 修改服务器IP.bat 新IP地址
    echo 示例: 修改服务器IP.bat 172.18.145.57
    pause
    exit /b 1
)

set NEW_IP=%~1
set OLD_IP=47.252.36.81

echo ==========================================
echo   修改服务器 IP
echo ==========================================
echo.
echo 旧 IP: %OLD_IP%
echo 新 IP: %NEW_IP%
echo.

REM 1. 修改 .env 文件
echo [1/3] 修改 .env 文件...
if exist ".env" (
    powershell -Command "(Get-Content .env) -replace 'http://%OLD_IP%', 'http://%NEW_IP%' | Set-Content .env"
    echo [√] .env 文件已更新
) else (
    echo [×] .env 文件不存在
)

REM 2. 修改 .env.example 文件
echo [2/3] 修改 .env.example 文件...
if exist ".env.example" (
    powershell -Command "(Get-Content .env.example) -replace 'http://%OLD_IP%', 'http://%NEW_IP%' | Set-Content .env.example"
    echo [√] .env.example 文件已更新
) else (
    echo [!] .env.example 文件不存在（可选）
)

REM 3. 重启服务
echo [3/3] 重启服务...
where pm2 >nul 2>nul
if %errorlevel% equ 0 (
    call pm2 restart all
    echo [√] 服务已重启
) else (
    echo [!] PM2 未安装，请手动重启服务
)

echo.
echo ==========================================
echo   修改完成！
echo ==========================================
echo.
echo 新的服务地址:
echo   主服务: http://%NEW_IP%:3001
echo   文件服务: http://%NEW_IP%:8081
echo   健康检查: http://%NEW_IP%:3001/health
echo.
echo 验证修改:
echo   curl http://%NEW_IP%:3001/health
echo.
echo [√] IP 地址修改成功！
echo.
pause


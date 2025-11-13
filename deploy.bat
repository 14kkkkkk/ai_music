@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM AI 音乐服务 - Windows 一键部署脚本
REM 服务器: 47.252.36.81
REM 使用方法: deploy.bat

echo ==========================================
echo   AI 音乐服务 - 一键部署脚本
echo   服务器: 47.252.36.81
echo ==========================================
echo.

REM 检查 Node.js
echo [1/8] 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装
    echo 请先安装 Node.js ^(^>= 18.0.0^)
    echo 访问: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [√] Node.js 已安装: %NODE_VERSION%
echo.

REM 检查 npm
echo [2/8] 检查 npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] npm 未安装
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [√] npm 已安装: %NPM_VERSION%
echo.

REM 检查配置文件
echo [3/8] 检查配置文件...
if not exist ".env" (
    echo [警告] .env 文件不存在
    echo 正在从 .env.example 复制...
    copy .env.example .env >nul
    echo [√] .env 文件已创建
) else (
    echo [√] .env 文件已存在
)
echo.

REM 显示配置信息
echo [4/8] 配置信息:
echo   SUNO_API_KEY: 28f61cf2a6012f2a1204f8569768f979
echo   CALLBACK_BASE_URL: http://47.252.36.81:8081
echo   PORT: 3001
echo   FILE_SERVER_PORT: 8081
echo.

REM 安装依赖
echo [5/8] 安装依赖...
call npm install --production
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [√] 依赖安装完成
echo.

REM 创建必要的目录
echo [6/8] 创建必要的目录...
if not exist "uploads" mkdir uploads
if not exist "data" mkdir data
if not exist "logs" mkdir logs
echo [√] 目录创建完成
echo.

REM 检查 PM2
echo [7/8] 检查 PM2...
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [警告] PM2 未安装，正在安装...
    call npm install -g pm2
    if %errorlevel% neq 0 (
        echo [错误] PM2 安装失败
        pause
        exit /b 1
    )
    echo [√] PM2 安装完成
) else (
    for /f "tokens=*" %%i in ('pm2 --version') do set PM2_VERSION=%%i
    echo [√] PM2 已安装: !PM2_VERSION!
)
echo.

REM 启动服务
echo [8/8] 启动服务...

REM 停止旧服务（如果存在）
pm2 delete ai-music-service 2>nul
pm2 delete ai-music-file-server 2>nul

REM 启动新服务
call pm2 start ecosystem.config.js
if %errorlevel% neq 0 (
    echo [错误] 服务启动失败
    pause
    exit /b 1
)
call pm2 save
echo [√] 服务启动完成
echo.

REM 等待服务启动
echo 等待服务启动...
timeout /t 3 /nobreak >nul

REM 验证部署
echo.
echo ==========================================
echo   验证部署
echo ==========================================
echo.

REM 检查服务状态
echo 检查服务状态...
call pm2 status

echo.
echo 测试健康检查...

REM 测试主服务
curl -s http://localhost:3001/health >nul 2>nul
if %errorlevel% equ 0 (
    echo [√] 主服务健康检查通过
) else (
    echo [×] 主服务健康检查失败
)

REM 测试文件服务器
curl -s http://localhost:8081/health >nul 2>nul
if %errorlevel% equ 0 (
    echo [√] 文件服务器健康检查通过
) else (
    echo [×] 文件服务器健康检查失败
)

echo.
echo ==========================================
echo   部署完成！
echo ==========================================
echo.
echo 服务地址:
echo   主服务: http://47.252.36.81:3001
echo   文件服务: http://47.252.36.81:8081
echo   健康检查: http://47.252.36.81:3001/health
echo.
echo 常用命令:
echo   查看状态: pm2 status
echo   查看日志: pm2 logs
echo   重启服务: pm2 restart all
echo   停止服务: pm2 stop all
echo.
echo 下一步:
echo   1. 确保防火墙已开放 3001 和 8081 端口
echo   2. 确保云服务器安全组已配置
echo   3. 从外网测试: curl http://47.252.36.81:3001/health
echo   4. 运行完整测试: node test-complete.js
echo.
echo [√] 部署成功！
echo.
pause


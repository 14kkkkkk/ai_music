@echo off
echo ========================================
echo   AI 音乐服务 - 启动脚本
echo ========================================
echo.

echo [1/3] 检查环境...
if not exist node_modules (
    echo 未找到 node_modules，正在安装依赖...
    call npm install
)

echo.
echo [2/3] 检查配置...
if not exist .env (
    echo 未找到 .env 文件，正在复制示例配置...
    copy .env.example .env
    echo.
    echo ⚠️  请编辑 .env 文件，配置 SUNO_API_KEY 和 CALLBACK_BASE_URL
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] 启动服务...
echo.
echo 主服务端口: 3001
echo 文件服务器端口: 8081
echo.
echo 按 Ctrl+C 停止服务
echo.

call npm run start:all


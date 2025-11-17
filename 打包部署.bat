@echo off
chcp 65001 >nul
echo ========================================
echo 🎵 AI 音乐服务 - 打包部署脚本
echo ========================================
echo.

:: 设置变量
set PROJECT_NAME=ai-music-service
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set OUTPUT_FILE=%PROJECT_NAME%-%TIMESTAMP%.zip

echo 📦 开始打包项目...
echo.

:: 检查是否安装了 7-Zip
where 7z >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到 7-Zip
    echo 请安装 7-Zip 或使用手动打包方式
    echo.
    pause
    exit /b 1
)

:: 创建临时目录
set TEMP_DIR=temp_deploy_%TIMESTAMP%
mkdir %TEMP_DIR%

echo ✅ 复制必要文件...

:: 复制核心文件
xcopy /E /I /Y services %TEMP_DIR%\services
xcopy /E /I /Y routes %TEMP_DIR%\routes
xcopy /E /I /Y types %TEMP_DIR%\types
xcopy /E /I /Y utils %TEMP_DIR%\utils

:: 复制配置文件
copy /Y index.js %TEMP_DIR%\
copy /Y package.json %TEMP_DIR%\
copy /Y ecosystem.config.js %TEMP_DIR%\
copy /Y .env %TEMP_DIR%\
copy /Y .env.example %TEMP_DIR%\

:: 复制部署脚本
copy /Y 一键部署.sh %TEMP_DIR%\
copy /Y 部署前检查.sh %TEMP_DIR%\

:: 复制文档
copy /Y 部署到服务器指南.md %TEMP_DIR%\
copy /Y 服务配置对比说明.md %TEMP_DIR%\
copy /Y API接口文档-供中台和前端调用.md %TEMP_DIR%\ 2>nul

:: 创建必要的空目录
mkdir %TEMP_DIR%\logs
mkdir %TEMP_DIR%\temp_audio
mkdir %TEMP_DIR%\data

:: 创建 README
echo # AI 音乐服务部署包 > %TEMP_DIR%\README.txt
echo. >> %TEMP_DIR%\README.txt
echo 部署步骤： >> %TEMP_DIR%\README.txt
echo 1. 解压此文件到服务器 /opt/ai-music-service/ >> %TEMP_DIR%\README.txt
echo 2. 编辑 .env 文件，配置正确的参数 >> %TEMP_DIR%\README.txt
echo 3. 运行: chmod +x 一键部署.sh >> %TEMP_DIR%\README.txt
echo 4. 运行: ./一键部署.sh >> %TEMP_DIR%\README.txt
echo. >> %TEMP_DIR%\README.txt
echo 详细说明请查看：部署到服务器指南.md >> %TEMP_DIR%\README.txt

echo ✅ 文件复制完成
echo.

:: 打包
echo 📦 正在打包...
7z a -tzip %OUTPUT_FILE% .\%TEMP_DIR%\* >nul

if %errorlevel% equ 0 (
    echo ✅ 打包成功！
    echo.
    echo 📁 输出文件: %OUTPUT_FILE%
    
    :: 获取文件大小
    for %%A in (%OUTPUT_FILE%) do set SIZE=%%~zA
    set /a SIZE_MB=%SIZE% / 1024 / 1024
    echo 📊 文件大小: %SIZE_MB% MB
    echo.
    
    :: 清理临时目录
    echo 🗑️  清理临时文件...
    rmdir /S /Q %TEMP_DIR%
    echo ✅ 清理完成
    echo.
    
    echo ========================================
    echo 🎉 打包完成！
    echo ========================================
    echo.
    echo 📤 下一步操作：
    echo 1. 上传 %OUTPUT_FILE% 到服务器
    echo    scp %OUTPUT_FILE% root@47.252.36.81:/opt/
    echo.
    echo 2. 在服务器上解压
    echo    cd /opt
    echo    unzip %OUTPUT_FILE% -d ai-music-service
    echo.
    echo 3. 运行部署脚本
    echo    cd ai-music-service
    echo    chmod +x 一键部署.sh
    echo    ./一键部署.sh
    echo.
    echo 详细说明请查看：部署到服务器指南.md
    echo.
) else (
    echo ❌ 打包失败！
    rmdir /S /Q %TEMP_DIR%
    pause
    exit /b 1
)

pause


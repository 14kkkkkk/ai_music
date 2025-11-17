#!/bin/bash

echo "========================================"
echo "🔧 修复依赖问题"
echo "========================================"
echo ""

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：未找到 package.json"
    echo "请在项目根目录运行此脚本"
    exit 1
fi

echo "📦 清理旧的依赖..."
rm -rf node_modules
rm -f package-lock.json

echo ""
echo "📥 重新安装依赖..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 依赖安装成功！"
    echo ""
    echo "📋 检查关键依赖..."
    
    # 检查关键依赖
    MISSING=0
    
    if [ ! -d "node_modules/uuid" ]; then
        echo "❌ uuid 未安装"
        MISSING=1
    else
        echo "✅ uuid 已安装"
    fi
    
    if [ ! -d "node_modules/p-queue" ]; then
        echo "❌ p-queue 未安装"
        MISSING=1
    else
        echo "✅ p-queue 已安装"
    fi
    
    if [ ! -d "node_modules/express" ]; then
        echo "❌ express 未安装"
        MISSING=1
    else
        echo "✅ express 已安装"
    fi
    
    if [ ! -d "node_modules/axios" ]; then
        echo "❌ axios 未安装"
        MISSING=1
    else
        echo "✅ axios 已安装"
    fi
    
    if [ ! -d "node_modules/winston" ]; then
        echo "❌ winston 未安装"
        MISSING=1
    else
        echo "✅ winston 已安装"
    fi
    
    echo ""
    
    if [ $MISSING -eq 0 ]; then
        echo "✅ 所有关键依赖都已安装"
        echo ""
        echo "🔄 重启服务..."
        pm2 restart ai-music-service
        
        echo ""
        echo "⏳ 等待服务启动..."
        sleep 3
        
        echo ""
        echo "📊 查看服务状态..."
        pm2 status
        
        echo ""
        echo "🧪 测试健康检查..."
        sleep 2
        curl -s http://localhost:3001/health
        echo ""
        
        echo ""
        echo "========================================"
        echo "✅ 修复完成！"
        echo "========================================"
        echo ""
        echo "查看日志: pm2 logs ai-music-service"
        echo "查看状态: pm2 status"
    else
        echo "❌ 部分依赖安装失败"
        echo "请手动检查并安装缺失的依赖"
    fi
else
    echo ""
    echo "❌ 依赖安装失败"
    echo "请检查网络连接和 npm 配置"
    exit 1
fi


#!/bin/bash

# ============================================
# AI 音乐服务 - 一键部署脚本
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "🚀 AI 音乐服务 - 一键部署"
echo -e "==========================================${NC}"
echo ""

# 1. 检查是否在正确的目录
echo -e "${BLUE}1️⃣  检查当前目录...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 当前目录正确${NC}"
echo ""

# 2. 检查 .env 文件
echo -e "${BLUE}2️⃣  检查配置文件...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，从 .env.example 复制...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  请编辑 .env 文件，配置正确的参数后重新运行此脚本${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.example 文件也不存在${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ .env 文件存在${NC}"
echo ""

# 3. 创建必要的目录
echo -e "${BLUE}3️⃣  创建必要的目录...${NC}"
mkdir -p logs
mkdir -p temp_audio
mkdir -p data
echo -e "${GREEN}✅ 目录创建完成${NC}"
echo ""

# 4. 安装依赖
echo -e "${BLUE}4️⃣  安装依赖...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules 已存在，跳过安装${NC}"
    echo -e "${YELLOW}   如需重新安装，请先删除 node_modules 目录${NC}"
else
    echo "正在安装依赖..."
    npm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
fi
echo ""

# 5. 检查 PM2
echo -e "${BLUE}5️⃣  检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 未安装，正在安装...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 安装完成${NC}"
else
    echo -e "${GREEN}✅ PM2 已安装${NC}"
fi
echo ""

# 6. 停止旧服务
echo -e "${BLUE}6️⃣  停止旧服务...${NC}"
if pm2 list | grep -q "ai-music-service"; then
    echo "正在停止旧服务..."
    pm2 stop ai-music-service || true
    pm2 delete ai-music-service || true
    echo -e "${GREEN}✅ 旧服务已停止${NC}"
else
    echo -e "${YELLOW}⚠️  没有运行中的服务${NC}"
fi
echo ""

# 7. 启动新服务
echo -e "${BLUE}7️⃣  启动新服务...${NC}"
pm2 start ecosystem.config.js
echo -e "${GREEN}✅ 服务启动成功${NC}"
echo ""

# 8. 保存 PM2 配置
echo -e "${BLUE}8️⃣  保存 PM2 配置...${NC}"
pm2 save
echo -e "${GREEN}✅ PM2 配置已保存${NC}"
echo ""

# 9. 设置 PM2 开机自启
echo -e "${BLUE}9️⃣  设置开机自启...${NC}"
pm2 startup || echo -e "${YELLOW}⚠️  请手动运行 PM2 提示的命令来设置开机自启${NC}"
echo ""

# 10. 等待服务启动
echo -e "${BLUE}🔟 等待服务启动...${NC}"
sleep 3
echo ""

# 11. 检查服务状态
echo -e "${BLUE}1️⃣1️⃣  检查服务状态...${NC}"
pm2 status
echo ""

# 12. 测试服务
echo -e "${BLUE}1️⃣2️⃣  测试服务...${NC}"
echo "正在测试健康检查接口..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ 服务运行正常${NC}"
    echo ""
    echo "服务信息："
    curl -s http://localhost:3001/ | head -20
else
    echo -e "${RED}❌ 服务可能未正常启动${NC}"
    echo "请查看日志："
    echo "  pm2 logs ai-music-service"
fi
echo ""

# 完成
echo -e "${GREEN}=========================================="
echo "🎉 部署完成！"
echo -e "==========================================${NC}"
echo ""
echo "📝 常用命令："
echo "  查看日志:   pm2 logs ai-music-service"
echo "  查看状态:   pm2 status"
echo "  重启服务:   pm2 restart ai-music-service"
echo "  停止服务:   pm2 stop ai-music-service"
echo "  删除服务:   pm2 delete ai-music-service"
echo ""
echo "🌐 服务地址："
echo "  健康检查:   http://localhost:3001/health"
echo "  服务信息:   http://localhost:3001/"
echo "  API 文档:   查看 API接口文档-供中台和前端调用.md"
echo ""
echo -e "${YELLOW}⚠️  注意事项：${NC}"
echo "  1. 确保防火墙开放了 3001 端口"
echo "  2. 确保 .env 中的 SERVER_IP 配置正确"
echo "  3. 确保 OSS_SIGNED_URL_API 可访问"
echo "  4. 音乐服务不需要文件服务器（已移除）"
echo ""


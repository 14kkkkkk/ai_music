#!/bin/bash

# AI 音乐服务 - 一键部署脚本
# 服务器: 47.252.36.81
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  AI 音乐服务 - 一键部署脚本"
echo "  服务器: 47.252.36.81"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Node.js
echo -e "${YELLOW}[1/8] 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    echo "请先安装 Node.js (>= 18.0.0)"
    echo "访问: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js 已安装: $NODE_VERSION${NC}"
echo ""

# 检查 npm
echo -e "${YELLOW}[2/8] 检查 npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: npm 未安装${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm 已安装: $NPM_VERSION${NC}"
echo ""

# 检查配置文件
echo -e "${YELLOW}[3/8] 检查配置文件...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}错误: .env 文件不存在${NC}"
    echo "正在从 .env.example 复制..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env 文件已创建${NC}"
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi
echo ""

# 显示配置信息
echo -e "${YELLOW}[4/8] 配置信息:${NC}"
echo "  SUNO_API_KEY: 28f61cf2a6012f2a1204f8569768f979"
echo "  CALLBACK_BASE_URL: http://47.252.36.81:8081"
echo "  PORT: 3001"
echo "  FILE_SERVER_PORT: 8081"
echo ""

# 安装依赖
echo -e "${YELLOW}[5/8] 安装依赖...${NC}"
npm install --production
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 创建必要的目录
echo -e "${YELLOW}[6/8] 创建必要的目录...${NC}"
mkdir -p uploads data logs
echo -e "${GREEN}✓ 目录创建完成${NC}"
echo ""

# 检查 PM2
echo -e "${YELLOW}[7/8] 检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 安装完成${NC}"
else
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✓ PM2 已安装: $PM2_VERSION${NC}"
fi
echo ""

# 启动服务
echo -e "${YELLOW}[8/8] 启动服务...${NC}"

# 停止旧服务（如果存在）
pm2 delete ai-music-service 2>/dev/null || true
pm2 delete ai-music-file-server 2>/dev/null || true

# 启动新服务
pm2 start ecosystem.config.js
pm2 save

echo -e "${GREEN}✓ 服务启动完成${NC}"
echo ""

# 等待服务启动
echo "等待服务启动..."
sleep 3

# 验证部署
echo ""
echo "=========================================="
echo "  验证部署"
echo "=========================================="
echo ""

# 检查服务状态
echo -e "${YELLOW}检查服务状态...${NC}"
pm2 status

echo ""
echo -e "${YELLOW}测试健康检查...${NC}"

# 测试主服务
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ 主服务健康检查通过${NC}"
else
    echo -e "${RED}✗ 主服务健康检查失败${NC}"
fi

# 测试文件服务器
if curl -s http://localhost:8081/health > /dev/null; then
    echo -e "${GREEN}✓ 文件服务器健康检查通过${NC}"
else
    echo -e "${RED}✗ 文件服务器健康检查失败${NC}"
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "服务地址:"
echo "  主服务: http://47.252.36.81:3001"
echo "  文件服务: http://47.252.36.81:8081"
echo "  健康检查: http://47.252.36.81:3001/health"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs"
echo "  重启服务: pm2 restart all"
echo "  停止服务: pm2 stop all"
echo ""
echo "下一步:"
echo "  1. 确保防火墙已开放 3001 和 8081 端口"
echo "  2. 确保云服务器安全组已配置"
echo "  3. 从外网测试: curl http://47.252.36.81:3001/health"
echo "  4. 运行完整测试: node test-complete.js"
echo ""
echo -e "${GREEN}🎉 部署成功！${NC}"


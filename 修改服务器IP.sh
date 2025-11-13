#!/bin/bash

# 修改服务器 IP 脚本
# 使用方法: bash 修改服务器IP.sh 新IP地址
# 示例: bash 修改服务器IP.sh 172.18.145.57

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请提供新的 IP 地址${NC}"
    echo "使用方法: bash 修改服务器IP.sh 新IP地址"
    echo "示例: bash 修改服务器IP.sh 172.18.145.57"
    exit 1
fi

NEW_IP=$1
OLD_IP="47.252.36.81"

echo "=========================================="
echo "  修改服务器 IP"
echo "=========================================="
echo ""
echo "旧 IP: $OLD_IP"
echo "新 IP: $NEW_IP"
echo ""

# 1. 修改 .env 文件
echo -e "${YELLOW}[1/3] 修改 .env 文件...${NC}"
if [ -f ".env" ]; then
    sed -i "s|http://$OLD_IP|http://$NEW_IP|g" .env
    echo -e "${GREEN}✓ .env 文件已更新${NC}"
else
    echo -e "${RED}✗ .env 文件不存在${NC}"
fi

# 2. 修改 .env.example 文件
echo -e "${YELLOW}[2/3] 修改 .env.example 文件...${NC}"
if [ -f ".env.example" ]; then
    sed -i "s|http://$OLD_IP|http://$NEW_IP|g" .env.example
    echo -e "${GREEN}✓ .env.example 文件已更新${NC}"
else
    echo -e "${YELLOW}! .env.example 文件不存在（可选）${NC}"
fi

# 3. 重启服务
echo -e "${YELLOW}[3/3] 重启服务...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo -e "${GREEN}✓ 服务已重启${NC}"
else
    echo -e "${YELLOW}! PM2 未安装，请手动重启服务${NC}"
fi

echo ""
echo "=========================================="
echo "  修改完成！"
echo "=========================================="
echo ""
echo "新的服务地址:"
echo "  主服务: http://$NEW_IP:3001"
echo "  文件服务: http://$NEW_IP:8081"
echo "  健康检查: http://$NEW_IP:3001/health"
echo ""
echo "验证修改:"
echo "  curl http://$NEW_IP:3001/health"
echo ""
echo -e "${GREEN}✓ IP 地址修改成功！${NC}"


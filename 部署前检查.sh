#!/bin/bash

# ============================================
# AI 音乐服务 - 部署前检查脚本
# ============================================

echo "🔍 开始部署前检查..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
PASS=0
FAIL=0
WARN=0

# 1. 检查 Node.js 版本
echo "1️⃣  检查 Node.js 版本..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js 已安装: $NODE_VERSION${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Node.js 未安装${NC}"
    ((FAIL++))
fi
echo ""

# 2. 检查 npm 版本
echo "2️⃣  检查 npm 版本..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm 已安装: $NPM_VERSION${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ npm 未安装${NC}"
    ((FAIL++))
fi
echo ""

# 3. 检查 PM2
echo "3️⃣  检查 PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✅ PM2 已安装: $PM2_VERSION${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  PM2 未安装，建议安装: npm install -g pm2${NC}"
    ((WARN++))
fi
echo ""

# 4. 检查 .env 文件
echo "4️⃣  检查 .env 文件..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env 文件存在${NC}"
    ((PASS++))
    
    # 检查必要的配置项
    echo "   检查必要配置项..."
    
    if grep -q "SUNO_API_KEY=" .env; then
        echo -e "   ${GREEN}✅ SUNO_API_KEY 已配置${NC}"
    else
        echo -e "   ${RED}❌ SUNO_API_KEY 未配置${NC}"
        ((FAIL++))
    fi
    
    if grep -q "PORT=3001" .env; then
        echo -e "   ${GREEN}✅ PORT=3001 已配置${NC}"
    else
        echo -e "   ${YELLOW}⚠️  PORT 配置可能不正确${NC}"
        ((WARN++))
    fi
    
    if grep -q "OSS_SIGNED_URL_API=" .env; then
        echo -e "   ${GREEN}✅ OSS_SIGNED_URL_API 已配置${NC}"
    else
        echo -e "   ${RED}❌ OSS_SIGNED_URL_API 未配置${NC}"
        ((FAIL++))
    fi
    
    if grep -q "CALLBACK_BASE_URL=" .env; then
        echo -e "   ${GREEN}✅ CALLBACK_BASE_URL 已配置${NC}"
    else
        echo -e "   ${RED}❌ CALLBACK_BASE_URL 未配置${NC}"
        ((FAIL++))
    fi
else
    echo -e "${RED}❌ .env 文件不存在${NC}"
    echo -e "${YELLOW}   请从 .env.example 复制并修改配置${NC}"
    ((FAIL++))
fi
echo ""

# 5. 检查必要的目录
echo "5️⃣  检查必要的目录..."
DIRS=("services" "routes" "types" "utils" "logs" "temp_audio")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "   ${GREEN}✅ $dir/ 目录存在${NC}"
    else
        if [ "$dir" == "logs" ] || [ "$dir" == "temp_audio" ]; then
            echo -e "   ${YELLOW}⚠️  $dir/ 目录不存在（启动时会自动创建）${NC}"
            ((WARN++))
        else
            echo -e "   ${RED}❌ $dir/ 目录不存在${NC}"
            ((FAIL++))
        fi
    fi
done
echo ""

# 6. 检查必要的文件
echo "6️⃣  检查必要的文件..."
FILES=(
    "index.js"
    "package.json"
    "ecosystem.config.js"
    "services/taskManager.js"
    "services/ossService.js"
    "services/callbackService.js"
    "services/sunoApi.js"
    "routes/music.js"
    "types/task.js"
    "utils/logger.js"
)
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅ $file 存在${NC}"
    else
        echo -e "   ${RED}❌ $file 不存在${NC}"
        ((FAIL++))
    fi
done
echo ""

# 7. 检查 node_modules
echo "7️⃣  检查依赖安装..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules 目录存在${NC}"
    
    # 检查关键依赖
    if [ -d "node_modules/p-queue" ]; then
        echo -e "   ${GREEN}✅ p-queue 已安装${NC}"
    else
        echo -e "   ${RED}❌ p-queue 未安装${NC}"
        ((FAIL++))
    fi
    
    if [ -d "node_modules/uuid" ]; then
        echo -e "   ${GREEN}✅ uuid 已安装${NC}"
    else
        echo -e "   ${RED}❌ uuid 未安装${NC}"
        ((FAIL++))
    fi
    
    if [ -d "node_modules/express" ]; then
        echo -e "   ${GREEN}✅ express 已安装${NC}"
    else
        echo -e "   ${RED}❌ express 未安装${NC}"
        ((FAIL++))
    fi
    
    ((PASS++))
else
    echo -e "${RED}❌ node_modules 目录不存在${NC}"
    echo -e "${YELLOW}   请运行: npm install${NC}"
    ((FAIL++))
fi
echo ""

# 8. 检查端口占用
echo "8️⃣  检查端口占用..."
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":3001 "; then
        echo -e "${YELLOW}⚠️  端口 3001 已被占用${NC}"
        ((WARN++))
    else
        echo -e "${GREEN}✅ 端口 3001 可用${NC}"
        ((PASS++))
    fi
else
    echo -e "${YELLOW}⚠️  无法检查端口占用（netstat 未安装）${NC}"
    ((WARN++))
fi
echo ""

# 总结
echo "=========================================="
echo "📊 检查结果汇总"
echo "=========================================="
echo -e "${GREEN}✅ 通过: $PASS${NC}"
echo -e "${YELLOW}⚠️  警告: $WARN${NC}"
echo -e "${RED}❌ 失败: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！可以开始部署。${NC}"
    echo ""
    echo "下一步操作："
    echo "1. 确认 .env 配置正确"
    echo "2. 运行: npm install（如果还没安装依赖）"
    echo "3. 运行: pm2 start ecosystem.config.js"
    echo "4. 运行: pm2 logs 查看日志"
    exit 0
else
    echo -e "${RED}❌ 检查未通过，请修复上述问题后再部署。${NC}"
    exit 1
fi


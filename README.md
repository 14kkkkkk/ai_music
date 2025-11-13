# AI 音乐服务 - 部署包

> 独立的 AI 音乐生成服务，可部署到服务器供其他中台系统调用

---

## 📋 服务说明

本服务提供完整的 AI 音乐生成功能，包括：

- ✅ **歌词生成** - AI 自动创作歌词
- ✅ **音乐生成** - 根据歌词/描述生成音乐
- ✅ **音频上传** - 上传音频文件
- ✅ **音乐延长** - 延长已有音乐
- ✅ **添加人声** - 为伴奏添加人声
- ✅ **添加伴奏** - 为人声添加伴奏
- ✅ **任务管理** - 查询和管理任务状态

---

## 🚀 快速部署

### 步骤 1: 安装依赖

```bash
npm install
```

### 步骤 2: 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
nano .env
```

**已配置的生产环境**:
```bash
SUNO_API_KEY=28f61cf2a6012f2a1204f8569768f979  # Suno API 密钥（已配置）
CALLBACK_BASE_URL=http://47.252.36.81:8081     # 服务器公网地址（已配置）
```

### 步骤 3: 启动服务

**开发环境**:
```bash
# 启动主服务和文件服务器
npm run start:all
```

**生产环境（使用 PM2）**:
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
npm run pm2:start

# 查看状态
npm run pm2:status

# 查看日志
npm run pm2:logs

# 重启服务
npm run pm2:restart

# 停止服务
npm run pm2:stop
```

---

## 📡 服务地址

### 生产环境（服务器）
- **主服务**: `http://47.252.36.81:3001` - 提供 API 接口
- **文件服务器**: `http://47.252.36.81:8081` - 提供音频文件访问
- **健康检查**: `http://47.252.36.81:3001/health`

### 本地开发
- **主服务**: `http://localhost:3001`
- **文件服务器**: `http://localhost:8081`

---

## 🔌 API 接口

### 基础信息

```bash
# 服务信息
GET http://47.252.36.81:3001/

# 健康检查
GET http://47.252.36.81:3001/health
```

### 歌词生成

```bash
# 生成歌词
POST http://47.252.36.81:3001/api/music/generate-lyrics
Content-Type: application/json

{
  "prompt": "一首关于春天的歌"
}

# 查询歌词详情
GET http://47.252.36.81:3001/api/music/lyrics/:taskId
```

### 音乐生成

```bash
# 生成音乐
POST http://47.252.36.81:3001/api/music/generate
Content-Type: application/json

{
  "customMode": true,
  "model": "V5",
  "prompt": "[Verse]\n歌词内容...",
  "title": "歌曲标题",
  "tags": "流行, 抒情"
}
```

### 文件上传

```bash
# 上传音频
POST http://localhost:3001/api/upload/audio
Content-Type: multipart/form-data

audio: <file>
```

### 任务管理

```bash
# 获取任务状态
GET http://localhost:3001/api/music/task/:taskId

# 获取所有任务
GET http://localhost:3001/api/music/tasks

# 删除任务
DELETE http://localhost:3001/api/music/task/:taskId
```

完整 API 文档请参考项目根目录的 `AI音乐服务-API对接文档.md`

---

## 📂 目录结构

```
ai_music_service_deploy/
├── index.js                 # 主服务入口
├── file-server.js           # 文件服务器
├── package.json             # 项目配置
├── ecosystem.config.js      # PM2 配置
├── .env                     # 环境配置
├── routes/                  # 路由
│   ├── music.js             # 音乐相关路由
│   ├── upload.js            # 上传路由
│   └── callback.js          # 回调路由
├── services/                # 服务层
│   ├── sunoApi.js           # Suno API 客户端
│   └── taskStore.js         # 任务存储
├── utils/                   # 工具
│   └── logger.js            # 日志工具
├── data/                    # 数据存储
│   └── tasks.json           # 任务数据
├── uploads/                 # 上传文件
├── logs/                    # 日志文件
└── README.md                # 本文档
```

---

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| SUNO_API_KEY | Suno API 密钥 | 是 | - |
| SUNO_API_BASE_URL | Suno API 地址 | 否 | https://api.sunoapi.org/api/v1 |
| PORT | 主服务端口 | 否 | 3001 |
| FILE_SERVER_PORT | 文件服务器端口 | 否 | 8081 |
| CALLBACK_BASE_URL | 回调地址 | 是 | - |
| NODE_ENV | 运行环境 | 否 | production |
| LOG_LEVEL | 日志级别 | 否 | info |

---

## 🌐 部署到服务器

### 1. 上传文件

```bash
# 压缩部署包
tar -czf ai_music_service.tar.gz ai_music_service_deploy/

# 上传到服务器
scp ai_music_service.tar.gz user@server:/path/to/deploy/

# 解压
ssh user@server
cd /path/to/deploy/
tar -xzf ai_music_service.tar.gz
cd ai_music_service_deploy/
```

### 2. 安装依赖

```bash
npm install --production
```

### 3. 配置环境

```bash
# 编辑 .env 文件
nano .env

# 修改以下配置
CALLBACK_BASE_URL=http://your-server-ip:3001
```

### 4. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 3001/tcp
sudo ufw allow 8081/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=8081/tcp
sudo firewall-cmd --reload
```

### 5. 启动服务

```bash
# 使用 PM2
npm install -g pm2
npm run pm2:start

# 设置开机自启
pm2 startup
pm2 save
```

---

## 📊 监控和维护

### 查看服务状态

```bash
pm2 status
```

### 查看日志

```bash
# 实时日志
pm2 logs

# 查看特定服务
pm2 logs ai-music-service

# 查看文件日志
tail -f logs/combined.log
tail -f logs/error.log
```

### 重启服务

```bash
pm2 restart all
# 或
pm2 restart ai-music-service
```

---

## ⚠️ 注意事项

1. **CALLBACK_BASE_URL 必须公网可访问**
   - 开发环境使用 ngrok
   - 生产环境使用服务器公网 IP 或域名

2. **防火墙配置**
   - 确保端口 3001 和 8081 已开放

3. **磁盘空间**
   - 上传的音频文件会占用磁盘空间
   - 建议定期清理旧文件

4. **日志管理**
   - 日志文件会持续增长
   - 建议配置日志轮转

---

## 🔍 故障排查

### 服务无法启动

```bash
# 检查端口是否被占用
netstat -tulpn | grep 3001

# 检查日志
cat logs/error.log
```

### API 调用失败

```bash
# 检查 Suno API 密钥
echo $SUNO_API_KEY

# 测试连接
curl http://localhost:3001/health
```

### 文件上传失败

```bash
# 检查 uploads 目录权限
ls -la uploads/

# 检查回调地址
echo $CALLBACK_BASE_URL
```

---

**版本**: v1.0  
**最后更新**: 2024-01-01


# 如何修改服务器 IP 地址

> 如果你的服务器 IP 发生变化，按照以下步骤修改配置

---

## 🎯 场景说明

**当前配置的 IP**: `47.252.36.81`  
**需要改为**: `172.18.145.57`（或其他 IP）

---

## 🚀 方法 1: 使用一键修改脚本（推荐）

### Linux/Mac 服务器

```bash
# SSH 登录服务器
ssh root@172.18.145.57

# 进入部署目录
cd /root/ai_music_service_deploy

# 添加执行权限
chmod +x 修改服务器IP.sh

# 运行脚本（替换为你的新 IP）
bash 修改服务器IP.sh 172.18.145.57
```

### Windows 服务器

```cmd
cd C:\ai_music_service_deploy
修改服务器IP.bat 172.18.145.57
```

**脚本会自动完成**:
- ✅ 修改 `.env` 文件
- ✅ 修改 `.env.example` 文件
- ✅ 重启服务

---

## 🔧 方法 2: 手动修改

### 步骤 1: 修改 .env 文件

```bash
# 编辑 .env 文件
nano .env

# 或使用 vi
vi .env
```

**修改以下内容**:
```bash
# 修改前
CALLBACK_BASE_URL=http://47.252.36.81:8081

# 修改后
CALLBACK_BASE_URL=http://172.18.145.57:8081
```

**完整的 .env 文件应该是**:
```bash
# Suno API 配置
SUNO_API_KEY=28f61cf2a6012f2a1204f8569768f979
SUNO_API_BASE_URL=https://api.sunoapi.org/api/v1

# 服务配置
PORT=3001
FILE_SERVER_PORT=8081
CALLBACK_BASE_URL=http://172.18.145.57:8081

# 环境配置
NODE_ENV=production
LOG_LEVEL=info
```

### 步骤 2: 重启服务

```bash
# 使用 PM2 重启
pm2 restart all

# 或使用 npm 脚本
npm run pm2:restart
```

### 步骤 3: 验证修改

```bash
# 在服务器上测试
curl http://localhost:3001/health

# 从外网测试（使用新 IP）
curl http://172.18.145.57:3001/health
```

---

## 📋 需要修改的文件清单

### 必须修改（影响服务运行）

| 文件 | 需要修改的内容 | 是否必须 |
|------|---------------|---------|
| `.env` | `CALLBACK_BASE_URL` | ✅ 必须 |

### 可选修改（不影响服务运行，仅文档）

| 文件 | 说明 | 是否必须 |
|------|------|---------|
| `.env.example` | 示例配置文件 | ❌ 可选 |
| `README.md` | 项目说明文档 | ❌ 可选 |
| `API接口文档-供中台和前端调用.md` | API 文档 | ❌ 可选 |
| `API快速参考卡片.md` | 快速参考 | ❌ 可选 |
| `AI音乐服务.postman_collection.json` | Postman 集合 | ❌ 可选 |

**注意**: 文档中的 IP 地址仅供参考，不影响服务运行。只需修改 `.env` 文件即可。

---

## ✅ 验证修改是否成功

### 1. 检查配置文件

```bash
# 查看 .env 文件
cat .env | grep CALLBACK_BASE_URL

# 应该显示新的 IP
# CALLBACK_BASE_URL=http://172.18.145.57:8081
```

### 2. 检查服务状态

```bash
# 查看 PM2 状态
pm2 status

# 应该看到两个服务都在运行
# ai-music-service        online
# ai-music-file-server    online
```

### 3. 测试健康检查

```bash
# 本地测试
curl http://localhost:3001/health

# 外网测试（使用新 IP）
curl http://172.18.145.57:3001/health
```

**期望响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T10:00:00.000Z",
  "uptime": 100
}
```

### 4. 测试 API 接口

```bash
# 测试生成歌词接口
curl -X POST http://172.18.145.57:3001/api/music/generate-lyrics \
  -H "Content-Type: application/json" \
  -d '{"prompt": "一首关于测试的歌"}'
```

---

## 🔥 常见问题

### Q1: 修改后服务无法访问？

**检查清单**:
1. ✅ 确认新 IP 地址正确
2. ✅ 确认防火墙已开放 3001 和 8081 端口
3. ✅ 确认云服务器安全组已配置
4. ✅ 确认服务已重启：`pm2 status`

**解决方法**:
```bash
# 重新开放防火墙端口
sudo ufw allow 3001/tcp
sudo ufw allow 8081/tcp
sudo ufw reload

# 重启服务
pm2 restart all
```

### Q2: 回调不工作？

**原因**: `CALLBACK_BASE_URL` 配置错误

**解决方法**:
```bash
# 1. 检查 .env 文件
cat .env | grep CALLBACK_BASE_URL

# 2. 确认格式正确
# CALLBACK_BASE_URL=http://172.18.145.57:8081

# 3. 重启服务
pm2 restart all
```

### Q3: 需要修改端口吗？

**不需要！** 只需要修改 IP 地址，端口保持不变：
- 主服务端口: `3001`
- 文件服务器端口: `8081`

如果需要修改端口，需要同时修改：
```bash
# .env 文件
PORT=新端口号
FILE_SERVER_PORT=新端口号
CALLBACK_BASE_URL=http://新IP:新端口号
```

---

## 📝 完整示例

### 从 47.252.36.81 改为 172.18.145.57

```bash
# 1. SSH 登录服务器
ssh root@172.18.145.57

# 2. 进入目录
cd /root/ai_music_service_deploy

# 3. 使用脚本修改（推荐）
chmod +x 修改服务器IP.sh
bash 修改服务器IP.sh 172.18.145.57

# 或手动修改
nano .env
# 将 CALLBACK_BASE_URL=http://47.252.36.81:8081
# 改为 CALLBACK_BASE_URL=http://172.18.145.57:8081

# 4. 重启服务
pm2 restart all

# 5. 验证
curl http://172.18.145.57:3001/health
```

---

## 🎯 快速命令参考

```bash
# 一键修改（Linux/Mac）
bash 修改服务器IP.sh 172.18.145.57

# 一键修改（Windows）
修改服务器IP.bat 172.18.145.57

# 手动修改
nano .env
# 修改 CALLBACK_BASE_URL

# 重启服务
pm2 restart all

# 验证
curl http://172.18.145.57:3001/health
```

---

## 📞 需要帮助？

如果遇到问题：
1. 查看错误日志：`pm2 logs`
2. 查看服务状态：`pm2 status`
3. 查看配置文件：`cat .env`

---

**最后更新**: 2025-11-13  
**适用版本**: v1.0.0


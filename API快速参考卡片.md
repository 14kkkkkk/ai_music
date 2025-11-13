# AI 音乐服务 - API 快速参考卡片

> **服务地址**: `http://47.252.36.81:3001`
> **文件服务**: `http://47.252.36.81:8081`
> **完整文档**: 查看 `API接口文档-供中台和前端调用.md`

---

## 🚀 快速开始

### 1. 生成音乐（最简单）

```javascript
// 发起请求
const res = await fetch('http://47.252.36.81:3001/api/music/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customMode: false,
    model: 'V5',
    prompt: '一首轻快的流行歌曲'
  })
});
const { data } = await res.json();
const taskId = data.taskId;

// 轮询查询结果（每 5 秒）
const checkStatus = setInterval(async () => {
  const res = await fetch(`http://47.252.36.81:3001/api/music/task/${taskId}/detail`);
  const { data } = await res.json();

  if (data.status === 'SUCCESS') {
    clearInterval(checkStatus);
    console.log('音频URL:', data.response.clips[0].audioUrl);
  }
}, 5000);
```

---

## 📋 接口速查表

### 基础服务

| 接口 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/` | GET | 服务信息 |

### 歌词生成

| 接口 | 方法 | 必需参数 | 说明 |
|------|------|---------|------|
| `/api/music/generate-lyrics` | POST | `prompt` | 生成歌词 |
| `/api/music/lyrics/:taskId` | GET | - | 查询歌词 |

### 音乐生成

| 接口 | 方法 | 必需参数 | 说明 |
|------|------|---------|------|
| `/api/music/generate` | POST | `customMode`, `model`, `prompt` | 生成音乐 |

**参数说明**:
- `customMode`: `false`=简单模式, `true`=自定义模式
- `model`: `V5` 推荐
- `prompt`: 简单模式=描述，自定义模式=歌词

### 文件上传

| 接口 | 方法 | 必需参数 | 说明 |
|------|------|---------|------|
| `/api/upload/audio` | POST | `audio` (file) | 上传音频 |
| `/api/upload/list` | GET | - | 文件列表 |
| `/api/upload/audio/:filename` | DELETE | - | 删除文件 |

### 任务管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/music/tasks` | GET | 所有任务 |
| `/api/music/task/:taskId` | GET | 任务状态 |
| `/api/music/task/:taskId/detail` | GET | 任务详情（完整） |
| `/api/music/task/:taskId` | DELETE | 删除任务 |

### 高级功能

| 接口 | 方法 | 必需参数 | 说明 |
|------|------|---------|------|
| `/api/music/add-vocals` | POST | `uploadUrl`, `prompt`, `style` | 添加人声 |
| `/api/music/add-instrumental` | POST | `uploadUrl`, `tags` | 添加伴奏 |

---

## 🔄 任务状态

| 状态 | 说明 | 下一步 |
|------|------|--------|
| `PENDING` | 处理中 | 继续轮询 |
| `TEXT_SUCCESS` | 歌词已生成 | 继续轮询 |
| `FIRST_SUCCESS` | 第一版音乐已生成 | 继续轮询 |
| `SUCCESS` | ✅ 完成 | 获取结果 |
| `ERROR` | ❌ 失败 | 查看错误信息 |

---

## 📦 请求/响应示例

### 生成歌词

**请求**:
```json
POST /api/music/generate-lyrics
{
  "prompt": "一首关于梦想的歌"
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123..."
  }
}
```

### 生成音乐（简单模式）

**请求**:
```json
POST /api/music/generate
{
  "customMode": false,
  "model": "V5",
  "prompt": "一首轻快的流行歌曲"
}
```

### 生成音乐（自定义模式）

**请求**:
```json
POST /api/music/generate
{
  "customMode": true,
  "model": "V5",
  "prompt": "[Verse]\n歌词内容\n[Chorus]\n副歌",
  "title": "我的歌曲",
  "tags": "流行, 轻快"
}
```

### 查询任务详情

**请求**:
```
GET /api/music/task/abc123/detail
```

**响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123",
    "status": "SUCCESS",
    "response": {
      "clips": [
        {
          "audioUrl": "https://cdn.suno.ai/xxx.mp3",
          "imageUrl": "https://cdn.suno.ai/xxx.jpg",
          "title": "歌曲标题"
        }
      ]
    }
  }
}
```

---

## ⚡ 最佳实践

### 1. 轮询间隔
- 歌词生成: **3-5 秒**
- 音乐生成: **5-10 秒**

### 2. 超时处理
```javascript
let attempts = 0;
const maxAttempts = 60; // 最多轮询 60 次

const checkStatus = setInterval(async () => {
  attempts++;
  if (attempts > maxAttempts) {
    clearInterval(checkStatus);
    console.error('超时');
    return;
  }
  // ... 查询逻辑
}, 5000);
```

### 3. 错误处理
```javascript
try {
  const res = await fetch('http://localhost:3001/api/music/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* ... */ })
  });
  
  const data = await res.json();
  
  if (data.code !== 200) {
    throw new Error(data.msg);
  }
  
  // 处理成功
} catch (error) {
  console.error('请求失败:', error.message);
}
```

---

## 🎯 常用工作流

### 流程 1: 生成歌词 → 生成音乐
```
1. POST /api/music/generate-lyrics
2. GET /api/music/lyrics/:taskId (轮询)
3. POST /api/music/generate (使用生成的歌词)
4. GET /api/music/task/:taskId/detail (轮询)
```

### 流程 2: 上传音频 → 添加人声
```
1. POST /api/upload/audio
2. POST /api/music/add-vocals (使用上传的 URL)
3. GET /api/music/task/:taskId/detail (轮询)
```

---

## 📞 快速帮助

- **完整文档**: `API接口文档-供中台和前端调用.md`
- **测试工具**: `node test-complete.js`
- **部署指南**: `AI音乐服务-部署指南.md`
- **日志位置**: `logs/combined.log`

---

**版本**: v1.0.0 | **状态**: ✅ 所有接口测试通过


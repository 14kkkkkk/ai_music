# AI 音乐服务 - API 快速参考

> 快速查找和使用 API 接口

---

## 🔗 基础信息

- **主服务地址**: `http://localhost:3001`
- **文件服务器**: `http://localhost:8081`
- **API 版本**: v1.0.0

---

## 📋 接口列表

### 1️⃣ 基础服务

```bash
# 服务信息
GET /

# 健康检查
GET /health
```

---

### 2️⃣ 歌词生成

```bash
# 生成歌词
POST /api/music/generate-lyrics
{
  "prompt": "一首关于春天的歌"
}

# 查询歌词详情
GET /api/music/lyrics/:taskId
```

---

### 3️⃣ 音乐生成

```bash
# 生成音乐（简单模式）
POST /api/music/generate
{
  "customMode": false,
  "model": "V5",
  "prompt": "一首轻快的流行歌曲"
}

# 生成音乐（自定义模式）
POST /api/music/generate
{
  "customMode": true,
  "model": "V5",
  "prompt": "[Verse]\n歌词内容...",
  "title": "歌曲标题",
  "tags": "流行, 抒情",
  "negativeTags": "无"
}

# 延长音乐
POST /api/music/extend
{
  "audioId": "音频ID",
  "prompt": "延长描述",
  "continueAt": 120,
  "tags": "流行",
  "title": "延长版"
}
```

---

### 4️⃣ 音频处理

```bash
# 上传音频
POST /api/upload/audio
Content-Type: multipart/form-data
audio: <file>

# 添加人声
POST /api/music/add-vocals
{
  "uploadUrl": "音频URL",
  "prompt": "歌词内容",
  "model": "V5",
  "title": "歌曲标题",
  "tags": "流行",
  "gender": "f"
}

# 添加伴奏
POST /api/music/add-instrumental
{
  "uploadUrl": "音频URL",
  "model": "V5",
  "title": "歌曲标题",
  "tags": "流行"
}
```

---

### 5️⃣ 任务管理

```bash
# 获取任务状态
GET /api/music/task/:taskId

# 获取任务详情（从 Suno API）
GET /api/music/task/:taskId/detail

# 获取所有任务
GET /api/music/tasks

# 删除任务
DELETE /api/music/task/:taskId
```

---

### 6️⃣ 文件管理

```bash
# 获取文件列表
GET /api/upload/list

# 删除文件
DELETE /api/upload/audio/:filename
```

---

## 🎯 常用参数

### 模型版本 (model)
- `V3_5` - 版本 3.5
- `V4` - 版本 4
- `V4_5` - 版本 4.5
- `V4_5PLUS` - 版本 4.5 Plus
- `V5` - 版本 5（推荐）

### 性别 (gender)
- `f` - 女声
- `m` - 男声

### 任务状态 (status)
- `pending` - 等待中
- `text` - 文本处理完成
- `first` - 首次生成完成
- `complete` - 完成
- `failed` - 失败

---

## 💡 使用示例

### 完整流程：生成歌词 + 生成音乐

```javascript
// 1. 生成歌词
const lyricsRes = await axios.post('http://localhost:3001/api/music/generate-lyrics', {
  prompt: '一首关于春天的歌'
});
const lyricsTaskId = lyricsRes.data.data.taskId;

// 2. 轮询歌词结果
let lyrics = '';
while (true) {
  const detailRes = await axios.get(`http://localhost:3001/api/music/lyrics/${lyricsTaskId}`);
  if (detailRes.data.data.status === 'SUCCESS') {
    lyrics = detailRes.data.data.response.data[0].text;
    break;
  }
  await sleep(3000);
}

// 3. 生成音乐
const musicRes = await axios.post('http://localhost:3001/api/music/generate', {
  customMode: true,
  model: 'V5',
  prompt: lyrics,
  title: '春天的歌',
  tags: '流行, 抒情'
});
const musicTaskId = musicRes.data.data.taskId;

// 4. 轮询音乐结果
while (true) {
  const taskRes = await axios.get(`http://localhost:3001/api/music/task/${musicTaskId}`);
  if (taskRes.data.data.status === 'complete') {
    const audioUrl = taskRes.data.data.clips[0].audio_url;
    console.log('音乐生成完成:', audioUrl);
    break;
  }
  await sleep(5000);
}
```

---

## 🔍 响应格式

### 成功响应

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "xxx",
    ...
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "msg": "错误信息"
}
```

---

## ⚡ 快速测试

```bash
# 测试健康检查
curl http://localhost:3001/health

# 测试生成歌词
curl -X POST http://localhost:3001/api/music/generate-lyrics \
  -H "Content-Type: application/json" \
  -d '{"prompt": "测试"}'

# 测试获取任务列表
curl http://localhost:3001/api/music/tasks
```

---

**提示**: 更详细的文档请参考 `README.md` 和 `部署成功报告.md`


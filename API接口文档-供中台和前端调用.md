# AI 音乐服务 - API 接口文档

> **适用对象**: 中台开发者、前端开发者、客户端开发者
> **服务地址**: `http://47.252.36.81:3001`
> **文件服务**: `http://47.252.36.81:8081`
> **API Key**: `28f61cf2a6012f2a1204f8569768f979`
> **版本**: v1.0.0
> **最后更新**: 2025-11-13

---

## 📋 目录

- [1. 服务概述](#1-服务概述)
- [2. 基础接口](#2-基础接口)
- [3. 歌词生成](#3-歌词生成)
- [4. 音乐生成](#4-音乐生成)
- [5. 文件上传](#5-文件上传)
- [6. 任务管理](#6-任务管理)
- [7. 高级功能](#7-高级功能)
- [8. 错误码说明](#8-错误码说明)
- [9. 完整示例](#9-完整示例)

---

## 1. 服务概述

### 1.1 服务说明

AI 音乐服务提供基于 Suno API 的音乐生成能力，包括：
- ✅ AI 歌词生成
- ✅ AI 音乐生成（简单模式/自定义模式）
- ✅ 音频文件上传
- ✅ 添加人声到伴奏
- ✅ 添加伴奏到人声
- ✅ 任务状态查询

### 1.2 接口列表

| 分类 | 接口数量 | 说明 |
|------|---------|------|
| 基础服务 | 2 | 服务信息、健康检查 |
| 歌词生成 | 2 | 生成歌词、查询歌词 |
| 音乐生成 | 2 | 简单模式、自定义模式 |
| 文件上传 | 3 | 上传、列表、删除 |
| 任务管理 | 3 | 查询任务、任务详情、删除任务 |
| 高级功能 | 2 | 添加人声、添加伴奏 |
| **总计** | **14** | - |

### 1.3 通用说明

#### 请求头
```
Content-Type: application/json
```

#### 响应格式
```json
{
  "code": 200,
  "msg": "success",
  "data": { ... }
}
```

#### 状态码
- `200`: 成功
- `400`: 参数错误
- `500`: 服务器错误

---

## 2. 基础接口

### 2.1 获取服务信息

**接口**: `GET /`

**说明**: 获取服务基本信息

**请求示例**:
```bash
curl http://47.252.36.81:3001/
```

**响应示例**:
```json
{
  "service": "AI 音乐生成服务",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "lyrics": "/api/music/generate-lyrics",
    "generate": "/api/music/generate",
    "upload": "/api/upload/audio"
  }
}
```

---

### 2.2 健康检查

**接口**: `GET /health`

**说明**: 检查服务运行状态

**请求示例**:
```bash
curl http://47.252.36.81:3001/health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T10:00:00.000Z",
  "uptime": 3600
}
```

---

## 3. 歌词生成

### 3.1 生成歌词

**接口**: `POST /api/music/generate-lyrics`

**说明**: 根据提示词生成歌词

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | ✅ | 歌词描述，如"一首关于爱情的歌" |

**请求示例**:
```bash
curl -X POST http://localhost:3001/api/music/generate-lyrics \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一首关于城市夜晚的歌"
  }'
```

**JavaScript 示例**:
```javascript
const response = await fetch('http://localhost:3001/api/music/generate-lyrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: '一首关于城市夜晚的歌'
  })
});
const data = await response.json();
console.log('任务ID:', data.data.taskId);
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123def456..."
  }
}
```

**后续操作**: 使用返回的 `taskId` 调用 [3.2 查询歌词详情](#32-查询歌词详情) 获取生成结果

---

### 3.2 查询歌词详情

**接口**: `GET /api/music/lyrics/:taskId`

**说明**: 查询歌词生成任务的详情和结果

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | string | ✅ | 任务ID（从3.1接口获取） |

**请求示例**:
```bash
curl http://localhost:3001/api/music/lyrics/abc123def456
```

**JavaScript 示例**:
```javascript
const taskId = 'abc123def456';
const response = await fetch(`http://localhost:3001/api/music/lyrics/${taskId}`);
const data = await response.json();

if (data.data.status === 'SUCCESS') {
  const lyrics = data.data.metadata.lyrics;
  const title = data.data.metadata.title;
  console.log('歌词:', lyrics);
  console.log('标题:', title);
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123def456",
    "status": "SUCCESS",
    "metadata": {
      "lyrics": "[Verse]\n城市的夜晚...\n[Chorus]\n灯火阑珊...",
      "title": "城市夜曲",
      "type": "lyrics"
    },
    "created_at": "2025-11-13T10:00:00.000Z",
    "updated_at": "2025-11-13T10:00:05.000Z"
  }
}
```

**状态说明**:
- `PENDING`: 生成中，请继续轮询
- `SUCCESS`: 生成成功，可获取歌词
- `ERROR`: 生成失败

**轮询建议**: 每 3-5 秒查询一次，直到状态变为 `SUCCESS` 或 `ERROR`

---

## 4. 音乐生成

### 4.1 生成音乐

**接口**: `POST /api/music/generate`

**说明**: 生成音乐，支持简单模式和自定义模式

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| customMode | boolean | ✅ | `false`=简单模式, `true`=自定义模式 |
| model | string | ✅ | 模型版本: `V3_5`, `V4`, `V4_5`, `V4_5PLUS`, `V5` |
| prompt | string | ✅ | 简单模式=描述，自定义模式=歌词 |
| title | string | ❌ | 歌曲标题（自定义模式推荐） |
| tags | string | ❌ | 音乐风格，如"流行, 轻快"（自定义模式推荐） |
| instrumental | boolean | ❌ | 是否纯音乐（无人声），默认 `false` |
| negativeTags | string | ❌ | 负面标签，默认"无" |

**请求示例 - 简单模式**:
```bash
curl -X POST http://localhost:3001/api/music/generate \
  -H "Content-Type: application/json" \
  -d '{
    "customMode": false,
    "model": "V5",
    "prompt": "一首轻快的流行歌曲，充满活力和正能量"
  }'
```

**请求示例 - 自定义模式**:
```bash
curl -X POST http://localhost:3001/api/music/generate \
  -H "Content-Type: application/json" \
  -d '{
    "customMode": true,
    "model": "V5",
    "prompt": "[Verse]\n城市的夜晚静悄悄\n[Chorus]\n灯火阑珊处",
    "title": "城市夜曲",
    "tags": "流行, 抒情"
  }'
```

**JavaScript 示例**:
```javascript
// 简单模式
const response = await fetch('http://localhost:3001/api/music/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customMode: false,
    model: 'V5',
    prompt: '一首轻快的流行歌曲'
  })
});

// 自定义模式
const response2 = await fetch('http://localhost:3001/api/music/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customMode: true,
    model: 'V5',
    prompt: '[Verse]\n歌词内容\n[Chorus]\n副歌',
    title: '我的歌曲',
    tags: '流行, 轻快'
  })
});
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "xyz789abc123..."
  }
}
```

**后续操作**: 使用返回的 `taskId` 调用 [6.2 查询任务详情](#62-查询任务详情) 获取生成结果

---

## 5. 文件上传

### 5.1 上传音频文件

**接口**: `POST /api/upload/audio`

**说明**: 上传音频文件（用于添加人声/伴奏功能）

**请求类型**: `multipart/form-data`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audio | file | ✅ | 音频文件（MP3/WAV/FLAC） |

**请求示例**:
```bash
curl -X POST http://localhost:3001/api/upload/audio \
  -F "audio=@/path/to/your-audio.mp3"
```

**JavaScript 示例**:
```javascript
// 使用 FormData
const formData = new FormData();
formData.append('audio', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/upload/audio', {
  method: 'POST',
  body: formData
});
const data = await response.json();
console.log('文件URL:', data.data.url);
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "filename": "audio-1763035872021-770367678.mp3",
    "url": "https://your-domain.com/uploads/audio-1763035872021-770367678.mp3",
    "size": 1024000
  }
}
```

**注意事项**:
- 支持格式: MP3, WAV, FLAC
- 文件大小限制: 建议不超过 50MB
- 返回的 `url` 可用于 [7.1 添加人声](#71-添加人声) 和 [7.2 添加伴奏](#72-添加伴奏)

---

### 5.2 获取文件列表

**接口**: `GET /api/upload/list`

**说明**: 获取已上传的文件列表

**请求示例**:
```bash
curl http://localhost:3001/api/upload/list
```

**JavaScript 示例**:
```javascript
const response = await fetch('http://localhost:3001/api/upload/list');
const data = await response.json();
console.log('文件列表:', data.data);
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "filename": "audio-1763035872021-770367678.mp3",
      "url": "https://your-domain.com/uploads/audio-1763035872021-770367678.mp3",
      "size": 1024000,
      "uploadTime": "2025-11-13T10:00:00.000Z"
    }
  ]
}
```

---

### 5.3 删除文件

**接口**: `DELETE /api/upload/audio/:filename`

**说明**: 删除已上传的文件

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | ✅ | 文件名（从5.1或5.2获取） |

**请求示例**:
```bash
curl -X DELETE http://localhost:3001/api/upload/audio/audio-1763035872021-770367678.mp3
```

**JavaScript 示例**:
```javascript
const filename = 'audio-1763035872021-770367678.mp3';
const response = await fetch(`http://localhost:3001/api/upload/audio/${filename}`, {
  method: 'DELETE'
});
const data = await response.json();
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "File deleted successfully"
}
```

---

## 6. 任务管理

### 6.1 获取所有任务

**接口**: `GET /api/music/tasks`

**说明**: 获取所有任务列表

**请求示例**:
```bash
curl http://localhost:3001/api/music/tasks
```

**JavaScript 示例**:
```javascript
const response = await fetch('http://localhost:3001/api/music/tasks');
const data = await response.json();
console.log('任务列表:', data.data);
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "taskId": "abc123",
      "status": "complete",
      "type": "music",
      "created_at": "2025-11-13T10:00:00.000Z",
      "updated_at": "2025-11-13T10:01:00.000Z"
    }
  ]
}
```

---

### 6.2 查询任务详情

**接口**: `GET /api/music/task/:taskId/detail`

**说明**: 查询任务详情（从 Suno API 获取完整信息）

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | string | ✅ | 任务ID |

**请求示例**:
```bash
curl http://localhost:3001/api/music/task/abc123/detail
```

**JavaScript 示例**:
```javascript
const taskId = 'abc123';
const response = await fetch(`http://localhost:3001/api/music/task/${taskId}/detail`);
const data = await response.json();

if (data.data.status === 'SUCCESS') {
  const clips = data.data.response.clips;
  clips.forEach(clip => {
    console.log('音频URL:', clip.audioUrl);
    console.log('标题:', clip.title);
  });
}
```

**响应示例**:
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
          "id": "clip-id-1",
          "title": "城市夜曲",
          "audioUrl": "https://cdn.suno.ai/xxx.mp3",
          "imageUrl": "https://cdn.suno.ai/xxx.jpg",
          "duration": 180
        }
      ]
    }
  }
}
```

**状态说明**:
- `PENDING`: 处理中
- `TEXT_SUCCESS`: 歌词已生成
- `FIRST_SUCCESS`: 第一版音乐已生成
- `SUCCESS`: 完成
- `ERROR`: 失败

**轮询建议**: 每 5-10 秒查询一次，直到状态变为 `SUCCESS` 或 `ERROR`

---

### 6.3 获取任务状态

**接口**: `GET /api/music/task/:taskId`

**说明**: 快速查询任务状态（本地缓存）

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | string | ✅ | 任务ID |

**请求示例**:
```bash
curl http://localhost:3001/api/music/task/abc123
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "abc123",
    "status": "pending",
    "created_at": "2025-11-13T10:00:00.000Z"
  }
}
```

---

### 6.4 删除任务

**接口**: `DELETE /api/music/task/:taskId`

**说明**: 删除任务记录

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | string | ✅ | 任务ID |

**请求示例**:
```bash
curl -X DELETE http://localhost:3001/api/music/task/abc123
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "Task deleted successfully"
}
```

---

## 7. 高级功能

### 7.1 添加人声

**接口**: `POST /api/music/add-vocals`

**说明**: 为上传的伴奏音频添加 AI 人声

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| uploadUrl | string | ✅ | 伴奏音频URL（从5.1获取） |
| prompt | string | ✅ | 歌词内容 |
| style | string | ✅ | 音乐风格，如"流行" |
| title | string | ❌ | 歌曲标题 |
| vocalGender | string | ❌ | 人声性别: `f`=女声, `m`=男声，默认`f` |
| negativeTags | string | ❌ | 负面标签，默认"无" |

**请求示例**:
```bash
curl -X POST http://localhost:3001/api/music/add-vocals \
  -H "Content-Type: application/json" \
  -d '{
    "uploadUrl": "https://your-domain.com/uploads/audio-xxx.mp3",
    "prompt": "[Verse]\n城市的夜晚\n[Chorus]\n灯火阑珊",
    "style": "流行",
    "title": "城市夜曲",
    "vocalGender": "f"
  }'
```

**JavaScript 示例**:
```javascript
const response = await fetch('http://localhost:3001/api/music/add-vocals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uploadUrl: 'https://your-domain.com/uploads/audio-xxx.mp3',
    prompt: '[Verse]\n歌词内容\n[Chorus]\n副歌',
    style: '流行',
    title: '我的歌曲',
    vocalGender: 'f'
  })
});
const data = await response.json();
console.log('任务ID:', data.data.taskId);
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "vocals-task-id"
  }
}
```

---

### 7.2 添加伴奏

**接口**: `POST /api/music/add-instrumental`

**说明**: 为上传的人声音频添加 AI 伴奏

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| uploadUrl | string | ✅ | 人声音频URL（从5.1获取） |
| tags | string | ✅ | 音乐风格标签，如"流行, 轻快" |
| title | string | ❌ | 歌曲标题 |
| negativeTags | string | ❌ | 负面标签，默认"无" |

**请求示例**:
```bash
curl -X POST http://localhost:3001/api/music/add-instrumental \
  -H "Content-Type: application/json" \
  -d '{
    "uploadUrl": "https://your-domain.com/uploads/audio-xxx.mp3",
    "tags": "流行, 轻快",
    "title": "城市夜曲"
  }'
```

**JavaScript 示例**:
```javascript
const response = await fetch('http://localhost:3001/api/music/add-instrumental', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uploadUrl: 'https://your-domain.com/uploads/audio-xxx.mp3',
    tags: '流行, 轻快',
    title: '我的歌曲'
  })
});
const data = await response.json();
console.log('任务ID:', data.data.taskId);
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "instrumental-task-id"
  }
}
```

---

## 8. 错误码说明

### 8.1 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 8.2 业务错误码

| code | msg | 说明 | 解决方案 |
|------|-----|------|---------|
| 200 | success | 成功 | - |
| 400 | Missing required parameter | 缺少必需参数 | 检查请求参数 |
| 400 | Invalid file format | 文件格式不支持 | 使用 MP3/WAV/FLAC 格式 |
| 404 | Task not found | 任务不存在 | 检查 taskId 是否正确 |
| 404 | File not found | 文件不存在 | 检查文件名是否正确 |
| 500 | Failed to generate lyrics | 歌词生成失败 | 重试或联系技术支持 |
| 500 | Failed to generate music | 音乐生成失败 | 重试或联系技术支持 |
| 500 | Failed to upload file | 文件上传失败 | 检查文件大小和格式 |

### 8.3 错误响应示例

```json
{
  "code": 400,
  "msg": "prompt is required"
}
```

```json
{
  "code": 404,
  "msg": "Task not found"
}
```

```json
{
  "code": 500,
  "msg": "Failed to generate music"
}
```

---

## 9. 完整示例

### 9.1 生成歌词 + 音乐（完整流程）

```javascript
// ========== 步骤 1: 生成歌词 ==========
const lyricsResponse = await fetch('http://localhost:3001/api/music/generate-lyrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: '一首关于梦想的励志歌曲'
  })
});
const lyricsData = await lyricsResponse.json();
const lyricsTaskId = lyricsData.data.taskId;
console.log('歌词任务ID:', lyricsTaskId);

// ========== 步骤 2: 轮询查询歌词 ==========
let lyrics = '';
let title = '';
while (true) {
  await new Promise(resolve => setTimeout(resolve, 3000)); // 等待 3 秒

  const detailResponse = await fetch(`http://localhost:3001/api/music/lyrics/${lyricsTaskId}`);
  const detailData = await detailResponse.json();

  if (detailData.data.status === 'SUCCESS') {
    lyrics = detailData.data.metadata.lyrics;
    title = detailData.data.metadata.title;
    console.log('歌词生成成功!');
    console.log('标题:', title);
    console.log('歌词:', lyrics);
    break;
  } else if (detailData.data.status === 'ERROR') {
    console.error('歌词生成失败');
    throw new Error('歌词生成失败');
  }

  console.log('歌词生成中...', detailData.data.status);
}

// ========== 步骤 3: 使用歌词生成音乐 ==========
const musicResponse = await fetch('http://localhost:3001/api/music/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customMode: true,
    model: 'V5',
    prompt: lyrics,
    title: title,
    tags: '流行, 励志'
  })
});
const musicData = await musicResponse.json();
const musicTaskId = musicData.data.taskId;
console.log('音乐任务ID:', musicTaskId);

// ========== 步骤 4: 轮询查询音乐 ==========
while (true) {
  await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒

  const musicDetailResponse = await fetch(`http://localhost:3001/api/music/task/${musicTaskId}/detail`);
  const musicDetailData = await musicDetailResponse.json();

  if (musicDetailData.data.status === 'SUCCESS') {
    const clips = musicDetailData.data.response.clips;
    console.log('音乐生成成功!');
    clips.forEach((clip, index) => {
      console.log(`音频 ${index + 1}:`, clip.audioUrl);
      console.log(`封面 ${index + 1}:`, clip.imageUrl);
    });
    break;
  } else if (musicDetailData.data.status === 'ERROR') {
    console.error('音乐生成失败');
    throw new Error('音乐生成失败');
  }

  console.log('音乐生成中...', musicDetailData.data.status);
}

console.log('✅ 完成！');
```

---

### 9.2 上传音频 + 添加人声（完整流程）

```javascript
// ========== 步骤 1: 上传伴奏音频 ==========
const formData = new FormData();
formData.append('audio', instrumentalFile); // instrumentalFile 是 File 对象

const uploadResponse = await fetch('http://localhost:3001/api/upload/audio', {
  method: 'POST',
  body: formData
});
const uploadData = await uploadResponse.json();
const audioUrl = uploadData.data.url;
console.log('音频上传成功:', audioUrl);

// ========== 步骤 2: 添加人声 ==========
const vocalsResponse = await fetch('http://localhost:3001/api/music/add-vocals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uploadUrl: audioUrl,
    prompt: '[Verse]\n梦想在前方\n[Chorus]\n勇敢去追寻',
    style: '流行',
    title: '追梦',
    vocalGender: 'f'
  })
});
const vocalsData = await vocalsResponse.json();
const vocalsTaskId = vocalsData.data.taskId;
console.log('人声任务ID:', vocalsTaskId);

// ========== 步骤 3: 轮询查询结果 ==========
while (true) {
  await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒

  const detailResponse = await fetch(`http://localhost:3001/api/music/task/${vocalsTaskId}/detail`);
  const detailData = await detailResponse.json();

  if (detailData.data.status === 'SUCCESS') {
    const clips = detailData.data.response.clips;
    console.log('人声添加成功!');
    clips.forEach((clip, index) => {
      console.log(`完整歌曲 ${index + 1}:`, clip.audioUrl);
    });
    break;
  } else if (detailData.data.status === 'ERROR') {
    console.error('人声添加失败');
    throw new Error('人声添加失败');
  }

  console.log('人声添加中...', detailData.data.status);
}

console.log('✅ 完成！');
```

---

### 9.3 React 组件示例

```jsx
import React, { useState } from 'react';

function MusicGenerator() {
  const [prompt, setPrompt] = useState('');
  const [taskId, setTaskId] = useState('');
  const [status, setStatus] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // 生成音乐
  const handleGenerate = async () => {
    setLoading(true);
    try {
      // 1. 生成音乐
      const response = await fetch('http://localhost:3001/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customMode: false,
          model: 'V5',
          prompt: prompt
        })
      });
      const data = await response.json();
      const newTaskId = data.data.taskId;
      setTaskId(newTaskId);

      // 2. 轮询查询结果
      pollTaskStatus(newTaskId);
    } catch (error) {
      console.error('生成失败:', error);
      setLoading(false);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/music/task/${taskId}/detail`);
        const data = await response.json();
        setStatus(data.data.status);

        if (data.data.status === 'SUCCESS') {
          clearInterval(interval);
          const clips = data.data.response.clips;
          if (clips && clips.length > 0) {
            setAudioUrl(clips[0].audioUrl);
          }
          setLoading(false);
        } else if (data.data.status === 'ERROR') {
          clearInterval(interval);
          setLoading(false);
          alert('生成失败');
        }
      } catch (error) {
        clearInterval(interval);
        setLoading(false);
        console.error('查询失败:', error);
      }
    }, 5000); // 每 5 秒查询一次
  };

  return (
    <div>
      <h2>AI 音乐生成器</h2>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="输入音乐描述，如：一首轻快的流行歌曲"
        style={{ width: '300px', padding: '8px' }}
      />

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt}
        style={{ marginLeft: '10px', padding: '8px 16px' }}
      >
        {loading ? '生成中...' : '生成音乐'}
      </button>

      {taskId && (
        <div style={{ marginTop: '20px' }}>
          <p>任务ID: {taskId}</p>
          <p>状态: {status}</p>
        </div>
      )}

      {audioUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3>生成成功！</h3>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
          <p><a href={audioUrl} target="_blank">下载音频</a></p>
        </div>
      )}
    </div>
  );
}

export default MusicGenerator;
```

---

### 9.4 Vue 组件示例

```vue
<template>
  <div class="music-generator">
    <h2>AI 音乐生成器</h2>

    <input
      v-model="prompt"
      type="text"
      placeholder="输入音乐描述，如：一首轻快的流行歌曲"
      class="input"
    />

    <button
      @click="handleGenerate"
      :disabled="loading || !prompt"
      class="button"
    >
      {{ loading ? '生成中...' : '生成音乐' }}
    </button>

    <div v-if="taskId" class="status">
      <p>任务ID: {{ taskId }}</p>
      <p>状态: {{ status }}</p>
    </div>

    <div v-if="audioUrl" class="result">
      <h3>生成成功！</h3>
      <audio controls :src="audioUrl" class="audio" />
      <p><a :href="audioUrl" target="_blank">下载音频</a></p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      prompt: '',
      taskId: '',
      status: '',
      audioUrl: '',
      loading: false,
      pollInterval: null
    };
  },
  methods: {
    async handleGenerate() {
      this.loading = true;
      try {
        // 1. 生成音乐
        const response = await fetch('http://localhost:3001/api/music/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customMode: false,
            model: 'V5',
            prompt: this.prompt
          })
        });
        const data = await response.json();
        this.taskId = data.data.taskId;

        // 2. 轮询查询结果
        this.pollTaskStatus();
      } catch (error) {
        console.error('生成失败:', error);
        this.loading = false;
      }
    },

    pollTaskStatus() {
      this.pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/music/task/${this.taskId}/detail`);
          const data = await response.json();
          this.status = data.data.status;

          if (data.data.status === 'SUCCESS') {
            clearInterval(this.pollInterval);
            const clips = data.data.response.clips;
            if (clips && clips.length > 0) {
              this.audioUrl = clips[0].audioUrl;
            }
            this.loading = false;
          } else if (data.data.status === 'ERROR') {
            clearInterval(this.pollInterval);
            this.loading = false;
            alert('生成失败');
          }
        } catch (error) {
          clearInterval(this.pollInterval);
          this.loading = false;
          console.error('查询失败:', error);
        }
      }, 5000); // 每 5 秒查询一次
    }
  },
  beforeUnmount() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
};
</script>

<style scoped>
.input {
  width: 300px;
  padding: 8px;
}
.button {
  margin-left: 10px;
  padding: 8px 16px;
}
.status {
  margin-top: 20px;
}
.result {
  margin-top: 20px;
}
.audio {
  width: 100%;
}
</style>
```

---

## 📞 技术支持

### 联系方式
- **文档**: 查看 `README.md` 和 `AI音乐服务-部署指南.md`
- **测试**: 运行 `node test-complete.js` 测试所有接口
- **日志**: 查看 `logs/combined.log` 和 `logs/error.log`

### 常见问题

**Q: 如何知道任务是否完成？**
A: 轮询调用 `/api/music/task/:taskId/detail`，直到 `status` 变为 `SUCCESS` 或 `ERROR`

**Q: 轮询间隔建议多久？**
A: 歌词生成建议 3-5 秒，音乐生成建议 5-10 秒

**Q: 如何处理超时？**
A: 建议设置最大轮询次数（如 60 次），超时后提示用户稍后查看

**Q: 音频 URL 有效期多久？**
A: Suno API 返回的 URL 通常有效期较长，建议及时下载保存

**Q: 支持批量生成吗？**
A: 支持，可以并发调用接口，但建议控制并发数量（如 3-5 个）

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-13
**接口状态**: ✅ 所有 13 个接口测试通过


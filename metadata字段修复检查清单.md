# Metadata 字段修复检查清单

## ✅ 已修复的接口

### 1. 歌词生成接口 `/api/music/generate-lyrics`

**修复前的回调格式：**
```json
{
  "taskId": "...",
  "taskType": "lyrics_generation",  // ❌ 已移除
  "status": "completed",
  "result": { ... },
  "error": null
}
```

**修复后的回调格式：**
```json
{
  "taskId": "...",
  "status": "completed",
  "result": {
    "lyrics": "...",
    "title": "...",
    "sunoTaskId": "..."
  },
  "metadata": {  // ✅ 新增
    "type": "lyrics",
    "prompt": "一首关于夏天海边的歌"
  },
  "error": null,
  "completedAt": "2025-11-24T10:30:00.000Z"
}
```

### 2. 音乐生成接口 `/api/music/generate`

**修复前的回调格式：**
```json
{
  "taskId": "...",
  "taskType": "music_generation",  // ❌ 已移除
  "status": "completed",
  "result": { ... },
  "error": null
}
```

**修复后的回调格式：**
```json
{
  "taskId": "...",
  "status": "completed",
  "result": {
    "clips": [...],
    "sunoTaskId": "..."
  },
  "metadata": {  // ✅ 新增
    "type": "music",
    "prompt": "流行音乐，轻快的节奏",
    "model": "chirp-v3-5",
    "title": "夏日海边",
    "tags": "流行, 轻快"
  },
  "error": null,
  "completedAt": "2025-11-24T10:35:00.000Z"
}
```

### 3. 添加人声接口 `/api/music/add-vocals`

**修复前的回调格式：**
```json
{
  "taskId": "...",
  "taskType": "add_vocals",  // ❌ 已移除
  "status": "completed",
  "result": { ... },
  "error": null
}
```

**修复后的回调格式：**
```json
{
  "taskId": "...",
  "status": "completed",
  "result": {
    "clips": [...],
    "sunoTaskId": "..."
  },
  "metadata": {  // ✅ 新增
    "type": "vocals",
    "prompt": "[Verse 1]\\n海风轻轻吹过...",
    "style": "流行"
  },
  "error": null,
  "completedAt": "2025-11-24T10:40:00.000Z"
}
```

## 📝 修改的文件

### 1. `services/taskManager.js`

**修改位置：** `notifyBackend` 方法（第 600-644 行）

**修改内容：**
- ✅ 添加了 `metadata` 字段的构建逻辑
- ✅ 根据任务类型（`TaskType.LYRICS_GENERATION`、`TaskType.MUSIC_GENERATION`、`TaskType.ADD_VOCALS`）构建不同的 metadata
- ❌ 移除了 `taskType` 字段（改用 `metadata.type`）

### 2. `services/callbackService.js`

**修改位置：** 日志输出（第 27-33、53-60、67-76 行）

**修改内容：**
- ✅ 将日志中的 `payload.taskType` 改为 `payload.metadata?.type`
- ✅ 添加了 `metadataType` 字段到日志输出

## 🔍 Metadata 字段详细说明

### 歌词生成任务

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `metadata.type` | string | 任务类型 | `"lyrics"` |
| `metadata.prompt` | string | 用户输入的提示词 | `"一首关于夏天海边的歌"` |

### 音乐生成任务

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `metadata.type` | string | 任务类型 | `"music"` |
| `metadata.prompt` | string | 用户输入的提示词 | `"流行音乐，轻快的节奏"` |
| `metadata.model` | string | 使用的模型 | `"chirp-v3-5"` |
| `metadata.title` | string | 歌曲标题 | `"夏日海边"` |
| `metadata.tags` | string | 歌曲标签 | `"流行, 轻快"` |

### 添加人声任务

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `metadata.type` | string | 任务类型 | `"vocals"` |
| `metadata.prompt` | string | 歌词内容 | `"[Verse 1]\\n海风轻轻吹过..."` |
| `metadata.style` | string | 音乐风格 | `"流行"` |

## 🧪 测试方法

### 方法1: 使用测试脚本

```bash
# 测试单个接口（歌词生成）
node test-lyrics-callback.js

# 测试所有接口
node test-all-callbacks.js
```

### 方法2: 手动测试

1. 启动一个本地回调服务器（端口 3002）
2. 调用任意异步接口，设置 `callbackUrl` 为 `http://localhost:3002/callback/xxx`
3. 等待任务完成
4. 检查回调数据中是否包含 `metadata` 字段

### 方法3: 使用 Postman

导入 `AI音乐服务.postman_collection.json`，运行以下请求：

1. **生成歌词** - 检查回调中的 `metadata.type` 是否为 `"lyrics"`
2. **生成音乐** - 检查回调中的 `metadata.type` 是否为 `"music"`
3. **添加人声** - 检查回调中的 `metadata.type` 是否为 `"vocals"`

## ✅ 验证清单

- [x] 歌词生成接口回调包含 `metadata` 字段
- [x] 音乐生成接口回调包含 `metadata` 字段
- [x] 添加人声接口回调包含 `metadata` 字段
- [x] `metadata.type` 字段正确标识任务类型
- [x] `metadata.prompt` 字段包含用户输入
- [x] 失败回调也包含 `metadata` 字段
- [x] 日志输出使用 `metadata.type` 替代 `taskType`
- [x] 代码中不再使用 `taskType` 字段

## 🎯 影响范围

### 受影响的组件

- ✅ `services/taskManager.js` - 任务管理器
- ✅ `services/callbackService.js` - 回调服务

### 不受影响的组件

- ✅ `routes/music.js` - 路由层（无需修改）
- ✅ `routes/callback.js` - 内部回调处理（无需修改）
- ✅ `services/sunoApi.js` - Suno API 调用（无需修改）
- ✅ `services/ossService.js` - OSS 服务（无需修改）

## 📌 注意事项

1. **向后兼容性**：移除了 `taskType` 字段，中台需要改用 `metadata.type`
2. **失败回调**：即使任务失败，回调中也会包含 `metadata` 字段
3. **字段顺序**：`metadata` 字段在 `result` 之后，`error` 之前
4. **空值处理**：如果任务失败，`result` 为 `null`，但 `metadata` 仍然存在

## 🔄 中台需要的调整

如果中台之前使用了 `taskType` 字段，需要改为使用 `metadata.type`：

```javascript
// 修改前
if (data.taskType === 'lyrics_generation') {
  // ...
}

// 修改后
if (data.metadata.type === 'lyrics') {
  // ...
}
```


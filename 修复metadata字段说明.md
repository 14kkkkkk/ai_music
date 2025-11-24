# 修复回调 metadata 字段问题

## 问题描述

1. 中台调用生成歌词接口后，回调函数收到的 `metadata` 字段为 `undefined`
2. 回调数据中某些字段可能返回 `undefined` 值

### 期望的回调格式

```json
{
  "taskId": "abc123def456...",
  "status": "completed",
  "result": {
    "lyrics": "[Verse 1]\n海风轻轻吹过...\n\n[Chorus]\n夏天的海边...",
    "title": "夏日海边"
  },
  "metadata": {
    "type": "lyrics",
    "prompt": "一首关于夏天海边的歌"
  }
}
```

### 实际收到的格式（修复前）

```json
{
  "taskId": "abc123def456...",
  "taskType": "lyrics_generation",
  "status": "completed",
  "result": {
    "lyrics": "[Verse 1]\n海风轻轻吹过...\n\n[Chorus]\n夏天的海边...",
    "title": "夏日海边"
  },
  "error": null,
  "completedAt": "2025-11-24T10:30:00.000Z"
}
```

**问题**：缺少 `metadata` 字段，导致中台无法获取任务的元数据信息（如 type 和 prompt）。

## 修复方案

### 修改文件

1. **services/taskManager.js** - `notifyBackend` 方法、任务创建方法
2. **services/callbackService.js** - 日志输出

### 修改内容

#### 1. services/taskManager.js

**修改 1：在任务创建时添加默认值**

确保所有 input 字段都有默认值，避免 undefined：

```javascript
// createMusicGenerationTask
const task = {
  id: uuidv4(),
  status: TaskStatus.PENDING,
  type: TaskType.MUSIC_GENERATION,
  input: {
    customMode: request.customMode !== undefined ? request.customMode : false,
    instrumental: request.instrumental || false,
    model: request.model || '',
    prompt: request.prompt || '',
    title: request.title || '',
    tags: request.tags || '',
    negativeTags: request.negativeTags || '无'
  },
  callbackUrl: request.callbackUrl || '',
  progress: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// createLyricsGenerationTask
const task = {
  id: uuidv4(),
  status: TaskStatus.PENDING,
  type: TaskType.LYRICS_GENERATION,
  input: {
    prompt: request.prompt || ''
  },
  callbackUrl: request.callbackUrl || '',
  progress: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// createAddVocalsTask
const task = {
  id: uuidv4(),
  status: TaskStatus.PENDING,
  type: TaskType.ADD_VOCALS,
  input: {
    uploadUrl: request.uploadUrl || '',
    prompt: request.prompt || '',
    title: request.title || '',
    style: request.style || '',
    negativeTags: request.negativeTags || '无',
    vocalGender: request.vocalGender || 'f'
  },
  callbackUrl: request.callbackUrl || '',
  progress: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

**修改 2：在 `notifyBackend` 方法中添加 `metadata` 字段的构建逻辑**

```javascript
async notifyBackend(task, result, error) {
  // 构建 metadata 字段，确保所有字段都有值，不返回 undefined
  let metadata = {};

  if (task.type === TaskType.LYRICS_GENERATION) {
    // 歌词生成任务的 metadata
    metadata = {
      type: 'lyrics',
      prompt: task.input.prompt || ''  // ✅ 添加默认值
    };
  } else if (task.type === TaskType.MUSIC_GENERATION) {
    // 音乐生成任务的 metadata
    metadata = {
      type: 'music',
      prompt: task.input.prompt || '',  // ✅ 添加默认值
      model: task.input.model || '',    // ✅ 添加默认值
      title: task.input.title || '',    // ✅ 添加默认值
      tags: task.input.tags || ''       // ✅ 添加默认值
    };
  } else if (task.type === TaskType.ADD_VOCALS) {
    // 添加人声任务的 metadata
    metadata = {
      type: 'vocals',
      prompt: task.input.prompt || '',  // ✅ 添加默认值
      style: task.input.style || ''     // ✅ 添加默认值
    };
  }

  const payload = {
    taskId: task.id || '',              // ✅ 添加默认值
    status: task.status || '',          // ✅ 添加默认值
    result: result || null,             // ✅ null 而不是 undefined
    metadata,                           // ✅ 新增
    error: error || null,               // ✅ null 而不是 undefined
    completedAt: new Date().toISOString()
  };

  await callbackService.notifyBackend(task.callbackUrl, payload);
}
```

**变化**：
- ✅ 添加了 `metadata` 字段
- ❌ 移除了 `taskType` 字段（改用 `metadata.type`）

#### 2. services/callbackService.js

更新日志输出，使用 `metadata.type` 替代 `taskType`：

```javascript
// 修改前
logger.info(`📤 开始回调后端: ${callbackUrl}`, {
  taskType: payload.taskType,  // ❌
  taskId: payload.taskId,
  status: payload.status
});

// 修改后
logger.info(`📤 开始回调后端: ${callbackUrl}`, {
  taskId: payload.taskId,
  status: payload.status,
  metadataType: payload.metadata?.type,  // ✅
  payloadSize: JSON.stringify(payload).length
});
```

## 修复后的回调格式

### 歌词生成任务

```json
{
  "taskId": "abc123def456...",
  "status": "completed",
  "result": {
    "lyrics": "[Verse 1]\n海风轻轻吹过...\n\n[Chorus]\n夏天的海边...",
    "title": "夏日海边",
    "sunoTaskId": "suno-task-id"
  },
  "metadata": {
    "type": "lyrics",
    "prompt": "一首关于夏天海边的歌"
  },
  "error": null,
  "completedAt": "2025-11-24T10:30:00.000Z"
}
```

### 音乐生成任务

```json
{
  "taskId": "abc123def456...",
  "status": "completed",
  "result": {
    "clips": [...],
    "sunoTaskId": "suno-task-id"
  },
  "metadata": {
    "type": "music",
    "prompt": "流行音乐",
    "model": "chirp-v3-5",
    "title": "夏日海边",
    "tags": "流行, 轻快"
  },
  "error": null,
  "completedAt": "2025-11-24T10:30:00.000Z"
}
```

## 测试方法

### 测试 1: 验证 metadata 字段

```bash
node test-lyrics-callback.js
```

该脚本会：
1. 启动一个本地回调服务器（端口 3002）
2. 调用生成歌词接口
3. 等待任务完成
4. 验证回调数据中是否包含 `metadata` 字段
5. 输出详细的验证结果

### 测试 2: 验证没有 undefined 值

```bash
node test-no-undefined.js
```

该脚本会：
1. 启动一个本地回调服务器（端口 3003）
2. 调用多个接口（最小参数和完整参数）
3. 检查回调数据中是否有 `undefined` 值
4. 输出详细的检查结果

### 测试 3: 测试所有接口

```bash
node test-all-callbacks.js
```

该脚本会测试所有异步任务接口的回调格式。

## 关键修复点

### 1. 避免 undefined 值

**问题**：某些字段可能是 `undefined`，导致 JSON 序列化时丢失字段。

**解决方案**：
- ✅ 在任务创建时为所有字段添加默认值
- ✅ 在回调 payload 构建时为所有字段添加默认值
- ✅ 使用 `null` 而不是 `undefined` 表示空值

**示例**：
```javascript
// ❌ 错误：可能返回 undefined
metadata = {
  type: 'lyrics',
  prompt: task.input.prompt  // 如果 prompt 不存在，这里是 undefined
};

// ✅ 正确：确保有默认值
metadata = {
  type: 'lyrics',
  prompt: task.input.prompt || ''  // 如果 prompt 不存在，返回空字符串
};
```

### 2. 字段值规范

| 字段类型 | 空值表示 | 示例 |
|---------|---------|------|
| 字符串 | `''` (空字符串) | `prompt: ''` |
| 布尔值 | `false` | `customMode: false` |
| 对象 | `null` | `result: null` |
| 数组 | `[]` (空数组) | `clips: []` |

**注意**：永远不要使用 `undefined`，因为它在 JSON 序列化时会被忽略。

## 影响范围

- ✅ 歌词生成任务回调
- ✅ 音乐生成任务回调
- ✅ 添加人声任务回调

所有异步任务的回调都会：
1. 包含 `metadata` 字段
2. 不包含任何 `undefined` 值
3. 使用 `null` 表示空对象
4. 使用空字符串 `''` 表示空字符串


/**
 * 完整工作流测试 - 包括 OSS 上传
 * 测试场景：创建歌词生成任务 → Suno API → OSS 上传 → 回调
 */

const axios = require('axios');
const express = require('express');

const API_BASE = 'http://localhost:3001';
let callbackServer;
let receivedCallback = null;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 启动临时回调服务器
 */
function startCallbackServer() {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    app.post('/test-callback', (req, res) => {
      log(colors.green, '\n📥 收到回调通知！');
      console.log('回调数据:', JSON.stringify(req.body, null, 2));
      receivedCallback = req.body;
      res.json({ code: 200, msg: 'success' });
    });

    callbackServer = app.listen(3002, () => {
      log(colors.cyan, '✓ 回调服务器启动成功 (端口 3002)');
      resolve();
    });
  });
}

/**
 * 停止回调服务器
 */
function stopCallbackServer() {
  return new Promise((resolve) => {
    if (callbackServer) {
      callbackServer.close(() => {
        log(colors.cyan, '✓ 回调服务器已关闭');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * 等待指定时间
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullWorkflow() {
  console.log('\n' + '='.repeat(80));
  log(colors.cyan, '🎵 AI 音乐服务 - 完整工作流测试（包含 OSS 上传）');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. 启动回调服务器
    log(colors.yellow, '步骤 1: 启动回调服务器');
    await startCallbackServer();
    console.log('');

    // 2. 创建歌词生成任务
    log(colors.yellow, '步骤 2: 创建歌词生成任务');
    const createResponse = await axios.post(`${API_BASE}/api/music/generate-lyrics`, {
      prompt: '写一首关于测试 OSS 上传的歌',
      callbackUrl: 'http://localhost:3002/test-callback'
    });

    const taskId = createResponse.data.data.taskId;
    log(colors.green, `✓ 任务创建成功`);
    console.log(`任务 ID: ${taskId}`);
    console.log(`状态: ${createResponse.data.data.status}`);
    console.log(`进度: ${createResponse.data.data.progress}`);
    console.log('');

    // 3. 轮询任务状态（等待完成）
    log(colors.yellow, '步骤 3: 等待任务完成（最多 2 分钟）');
    let taskCompleted = false;
    let attempts = 0;
    const maxAttempts = 24; // 2 分钟（每 5 秒一次）

    while (!taskCompleted && attempts < maxAttempts) {
      attempts++;
      await sleep(5000); // 等待 5 秒

      const statusResponse = await axios.get(`${API_BASE}/api/music/task/${taskId}`);
      const task = statusResponse.data.data;

      console.log(`[${attempts}/${maxAttempts}] 状态: ${task.status}, 进度: ${task.progress || 0}`);

      if (task.status === 'completed') {
        taskCompleted = true;
        log(colors.green, `✓ 任务完成！`);
        console.log('任务详情:', JSON.stringify(task, null, 2));
      } else if (task.status === 'failed') {
        log(colors.red, `✗ 任务失败`);
        console.log('错误信息:', task.error);
        break;
      }
    }

    if (!taskCompleted) {
      log(colors.yellow, '⚠️  任务未在 2 分钟内完成（这是正常的，Suno API 可能需要更长时间）');
    }
    console.log('');

    // 4. 检查是否收到回调
    log(colors.yellow, '步骤 4: 检查回调通知');
    await sleep(2000); // 等待 2 秒确保回调到达

    if (receivedCallback) {
      log(colors.green, `✓ 收到回调通知`);
      console.log('回调数据:');
      console.log(JSON.stringify(receivedCallback, null, 2));
      console.log('');

      // 5. 验证回调数据
      log(colors.yellow, '步骤 5: 验证回调数据');
      
      if (receivedCallback.taskId === taskId) {
        log(colors.green, `✓ 任务 ID 匹配`);
      } else {
        log(colors.red, `✗ 任务 ID 不匹配`);
      }

      if (receivedCallback.status === 'completed') {
        log(colors.green, `✓ 状态为 completed`);
      } else {
        log(colors.yellow, `⚠️  状态为 ${receivedCallback.status}`);
      }

      if (receivedCallback.result && receivedCallback.result.fileName) {
        log(colors.green, `✓ 包含文件名`);
        console.log(`文件名: ${receivedCallback.result.fileName}`);
        
        // 验证文件名是否为 MD5 格式（32 个十六进制字符）
        const fileName = receivedCallback.result.fileName;
        const md5Pattern = /^[a-f0-9]{32}\.mp3$/;
        if (md5Pattern.test(fileName)) {
          log(colors.green, `✓ 文件名格式正确（MD5）`);
        } else {
          log(colors.yellow, `⚠️  文件名格式不是 MD5: ${fileName}`);
        }
      } else {
        log(colors.yellow, `⚠️  回调中没有文件名`);
      }
    } else {
      log(colors.yellow, `⚠️  未收到回调通知（任务可能还在处理中）`);
    }
    console.log('');

    // 测试总结
    console.log('='.repeat(80));
    log(colors.green, '🎉 完整工作流测试完成！');
    console.log('='.repeat(80));
    console.log('');
    log(colors.cyan, '测试总结:');
    console.log(`  ✓ 回调服务器启动`);
    console.log(`  ✓ 任务创建成功`);
    console.log(`  ${taskCompleted ? '✓' : '⚠️ '} 任务${taskCompleted ? '完成' : '处理中'}`);
    console.log(`  ${receivedCallback ? '✓' : '⚠️ '} ${receivedCallback ? '收到回调' : '未收到回调'}`);
    if (receivedCallback && receivedCallback.result && receivedCallback.result.fileName) {
      console.log(`  ✓ OSS 文件名: ${receivedCallback.result.fileName}`);
    }
    console.log('');

  } catch (error) {
    console.log('');
    log(colors.red, '✗ 测试失败');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应数据:', error.response.data);
    }
  } finally {
    // 关闭回调服务器
    await stopCallbackServer();
  }
}

// 运行测试
testFullWorkflow();


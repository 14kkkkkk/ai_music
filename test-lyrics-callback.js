/**
 * 测试歌词生成回调的 metadata 字段
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 模拟中台的回调接收服务器
const express = require('express');
const app = express();
app.use(express.json());

let receivedCallback = null;

// 回调接收端点
app.post('/callback/lyrics', (req, res) => {
  console.log('\n✅ 收到回调数据:');
  console.log(JSON.stringify(req.body, null, 2));
  
  receivedCallback = req.body;
  
  // 检查 metadata 字段
  if (req.body.metadata) {
    console.log('\n✅ metadata 字段存在:');
    console.log('  - type:', req.body.metadata.type);
    console.log('  - prompt:', req.body.metadata.prompt);
  } else {
    console.log('\n❌ metadata 字段不存在!');
  }
  
  res.json({ code: 200, msg: 'success' });
});

// 启动回调服务器
const callbackServer = app.listen(3002, () => {
  console.log('📡 回调服务器已启动: http://localhost:3002');
  runTest();
});

async function runTest() {
  try {
    console.log('\n🚀 开始测试歌词生成接口...\n');
    
    // 1. 调用生成歌词接口
    const response = await axios.post(`${BASE_URL}/api/music/generate-lyrics`, {
      prompt: '一首关于夏天海边的歌',
      callbackUrl: 'http://localhost:3002/callback/lyrics'
    });
    
    console.log('📝 任务已创建:');
    console.log('  - taskId:', response.data.data.taskId);
    console.log('  - status:', response.data.data.status);
    
    const taskId = response.data.data.taskId;
    
    // 2. 等待任务完成（轮询）
    console.log('\n⏳ 等待任务完成...');
    
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 最多等待5分钟
    
    while (!completed && attempts < maxAttempts) {
      await sleep(5000); // 每5秒查询一次
      attempts++;
      
      const statusResponse = await axios.get(`${BASE_URL}/api/music/task/${taskId}`);
      const status = statusResponse.data.data.status;
      
      console.log(`  [${attempts}/${maxAttempts}] 当前状态: ${status}`);
      
      if (status === 'completed' || status === 'failed') {
        completed = true;
        
        if (status === 'completed') {
          console.log('\n✅ 任务完成!');
          console.log('\n任务详情:');
          console.log(JSON.stringify(statusResponse.data.data, null, 2));
        } else {
          console.log('\n❌ 任务失败!');
          console.log('错误:', statusResponse.data.data.error);
        }
      }
    }
    
    if (!completed) {
      console.log('\n⏰ 任务超时');
    }
    
    // 3. 等待回调
    console.log('\n⏳ 等待回调...');
    await sleep(3000);
    
    // 4. 验证回调数据
    if (receivedCallback) {
      console.log('\n✅ 回调验证成功!');
      console.log('\n回调数据结构:');
      console.log('  - taskId:', receivedCallback.taskId);
      console.log('  - status:', receivedCallback.status);
      console.log('  - result:', receivedCallback.result ? '✅ 存在' : '❌ 不存在');
      console.log('  - metadata:', receivedCallback.metadata ? '✅ 存在' : '❌ 不存在');
      
      if (receivedCallback.metadata) {
        console.log('\nmetadata 内容:');
        console.log('  - type:', receivedCallback.metadata.type);
        console.log('  - prompt:', receivedCallback.metadata.prompt);
      }
      
      if (receivedCallback.result) {
        console.log('\nresult 内容:');
        console.log('  - lyrics:', receivedCallback.result.lyrics ? '✅ 存在' : '❌ 不存在');
        console.log('  - title:', receivedCallback.result.title);
      }
    } else {
      console.log('\n❌ 未收到回调!');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  } finally {
    // 关闭服务器
    callbackServer.close();
    console.log('\n👋 测试结束');
    process.exit(0);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


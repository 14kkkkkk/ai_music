/**
 * 测试所有异步任务接口的回调 metadata 字段
 */

const axios = require('axios');
const express = require('express');

const BASE_URL = 'http://localhost:3001';
const CALLBACK_PORT = 3002;

// 存储收到的回调
const callbacks = {
  lyrics: null,
  music: null,
  vocals: null
};

// 创建回调服务器
const app = express();
app.use(express.json());

// 歌词生成回调
app.post('/callback/lyrics', (req, res) => {
  console.log('\n✅ 收到歌词生成回调');
  callbacks.lyrics = req.body;
  validateCallback('lyrics', req.body);
  res.json({ code: 200, msg: 'success' });
});

// 音乐生成回调
app.post('/callback/music', (req, res) => {
  console.log('\n✅ 收到音乐生成回调');
  callbacks.music = req.body;
  validateCallback('music', req.body);
  res.json({ code: 200, msg: 'success' });
});

// 添加人声回调
app.post('/callback/vocals', (req, res) => {
  console.log('\n✅ 收到添加人声回调');
  callbacks.vocals = req.body;
  validateCallback('vocals', req.body);
  res.json({ code: 200, msg: 'success' });
});

// 验证回调数据
function validateCallback(type, data) {
  console.log(`\n📋 验证 ${type} 回调数据:`);
  
  const checks = [
    { field: 'taskId', exists: !!data.taskId },
    { field: 'status', exists: !!data.status },
    { field: 'result', exists: data.result !== undefined },
    { field: 'metadata', exists: !!data.metadata },
    { field: 'metadata.type', exists: !!data.metadata?.type },
    { field: 'metadata.prompt', exists: !!data.metadata?.prompt },
    { field: 'error', exists: data.error !== undefined },
    { field: 'completedAt', exists: !!data.completedAt }
  ];
  
  checks.forEach(check => {
    const icon = check.exists ? '✅' : '❌';
    console.log(`  ${icon} ${check.field}: ${check.exists ? '存在' : '不存在'}`);
  });
  
  if (data.metadata) {
    console.log(`\n  metadata 内容:`);
    console.log(`    - type: ${data.metadata.type}`);
    console.log(`    - prompt: ${data.metadata.prompt?.substring(0, 50)}...`);
    if (data.metadata.model) console.log(`    - model: ${data.metadata.model}`);
    if (data.metadata.title) console.log(`    - title: ${data.metadata.title}`);
    if (data.metadata.tags) console.log(`    - tags: ${data.metadata.tags}`);
    if (data.metadata.style) console.log(`    - style: ${data.metadata.style}`);
  }
}

// 启动回调服务器
const callbackServer = app.listen(CALLBACK_PORT, () => {
  console.log(`📡 回调服务器已启动: http://localhost:${CALLBACK_PORT}`);
  console.log('\n开始测试所有接口...\n');
  runTests();
});

async function runTests() {
  try {
    // 测试1: 歌词生成
    await testLyricsGeneration();
    
    // 等待一段时间再测试下一个
    await sleep(2000);
    
    // 测试2: 音乐生成
    await testMusicGeneration();
    
    // 等待一段时间再测试下一个
    await sleep(2000);
    
    // 测试3: 添加人声（需要先上传音频）
    // await testAddVocals();
    
    // 等待所有回调
    console.log('\n⏳ 等待所有回调完成...');
    await sleep(5000);
    
    // 输出总结
    printSummary();
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  } finally {
    callbackServer.close();
    console.log('\n👋 测试结束');
    process.exit(0);
  }
}

async function testLyricsGeneration() {
  console.log('🎵 测试1: 歌词生成接口\n');
  
  const response = await axios.post(`${BASE_URL}/api/music/generate-lyrics`, {
    prompt: '一首关于夏天海边的歌',
    callbackUrl: `http://localhost:${CALLBACK_PORT}/callback/lyrics`
  });
  
  console.log('✅ 任务已创建:', response.data.data.taskId);
}

async function testMusicGeneration() {
  console.log('🎵 测试2: 音乐生成接口\n');
  
  const response = await axios.post(`${BASE_URL}/api/music/generate`, {
    model: 'chirp-v3-5',
    prompt: '流行音乐，轻快的节奏',
    title: '夏日海边',
    tags: '流行, 轻快',
    callbackUrl: `http://localhost:${CALLBACK_PORT}/callback/music`
  });
  
  console.log('✅ 任务已创建:', response.data.data.taskId);
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  
  const tests = [
    { name: '歌词生成', data: callbacks.lyrics },
    { name: '音乐生成', data: callbacks.music },
    // { name: '添加人声', data: callbacks.vocals }
  ];
  
  tests.forEach(test => {
    console.log(`\n${test.name}:`);
    if (test.data) {
      const hasMetadata = !!test.data.metadata;
      const hasType = !!test.data.metadata?.type;
      const hasPrompt = !!test.data.metadata?.prompt;
      
      console.log(`  回调状态: ${hasMetadata && hasType && hasPrompt ? '✅ 通过' : '❌ 失败'}`);
      console.log(`  - metadata: ${hasMetadata ? '✅' : '❌'}`);
      console.log(`  - metadata.type: ${hasType ? '✅' : '❌'}`);
      console.log(`  - metadata.prompt: ${hasPrompt ? '✅' : '❌'}`);
    } else {
      console.log('  回调状态: ⏳ 未收到回调');
    }
  });
  
  console.log('\n' + '='.repeat(60));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


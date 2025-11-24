/**
 * 测试回调数据中不包含 undefined 值
 */

const axios = require('axios');
const express = require('express');

const BASE_URL = 'http://localhost:3001';
const CALLBACK_PORT = 3003;

// 创建回调服务器
const app = express();
app.use(express.json());

let testResults = [];

// 检查对象中是否有 undefined 值
function checkForUndefined(obj, path = '') {
  const issues = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (value === undefined) {
      issues.push(`❌ ${currentPath} 是 undefined`);
    } else if (value === null) {
      // null 是允许的
      console.log(`  ✅ ${currentPath}: null (允许)`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // 递归检查嵌套对象
      const nestedIssues = checkForUndefined(value, currentPath);
      issues.push(...nestedIssues);
    } else if (Array.isArray(value)) {
      // 检查数组元素
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          const nestedIssues = checkForUndefined(item, `${currentPath}[${index}]`);
          issues.push(...nestedIssues);
        }
      });
    } else {
      console.log(`  ✅ ${currentPath}: ${typeof value} (${JSON.stringify(value).substring(0, 50)})`);
    }
  }
  
  return issues;
}

// 歌词生成回调
app.post('/callback/lyrics', (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('📝 收到歌词生成回调');
  console.log('='.repeat(60));
  
  const issues = checkForUndefined(req.body);
  
  if (issues.length > 0) {
    console.log('\n❌ 发现 undefined 值:');
    issues.forEach(issue => console.log(issue));
    testResults.push({ type: 'lyrics', passed: false, issues });
  } else {
    console.log('\n✅ 所有字段都有明确的值，没有 undefined');
    testResults.push({ type: 'lyrics', passed: true, issues: [] });
  }
  
  res.json({ code: 200, msg: 'success' });
});

// 音乐生成回调
app.post('/callback/music', (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('🎵 收到音乐生成回调');
  console.log('='.repeat(60));
  
  const issues = checkForUndefined(req.body);
  
  if (issues.length > 0) {
    console.log('\n❌ 发现 undefined 值:');
    issues.forEach(issue => console.log(issue));
    testResults.push({ type: 'music', passed: false, issues });
  } else {
    console.log('\n✅ 所有字段都有明确的值，没有 undefined');
    testResults.push({ type: 'music', passed: true, issues: [] });
  }
  
  res.json({ code: 200, msg: 'success' });
});

// 启动回调服务器
const callbackServer = app.listen(CALLBACK_PORT, () => {
  console.log(`📡 回调服务器已启动: http://localhost:${CALLBACK_PORT}`);
  console.log('\n开始测试...\n');
  runTests();
});

async function runTests() {
  try {
    // 测试1: 歌词生成（最小参数）
    console.log('🧪 测试1: 歌词生成（最小参数）');
    await axios.post(`${BASE_URL}/api/music/generate-lyrics`, {
      prompt: '测试歌词',
      callbackUrl: `http://localhost:${CALLBACK_PORT}/callback/lyrics`
    });
    console.log('✅ 任务已创建\n');
    
    await sleep(2000);
    
    // 测试2: 音乐生成（最小参数）
    console.log('🧪 测试2: 音乐生成（最小参数）');
    await axios.post(`${BASE_URL}/api/music/generate`, {
      model: 'chirp-v3-5',
      prompt: '测试音乐',
      callbackUrl: `http://localhost:${CALLBACK_PORT}/callback/music`
    });
    console.log('✅ 任务已创建\n');
    
    await sleep(2000);
    
    // 测试3: 音乐生成（完整参数）
    console.log('🧪 测试3: 音乐生成（完整参数）');
    await axios.post(`${BASE_URL}/api/music/generate`, {
      model: 'chirp-v3-5',
      prompt: '测试音乐',
      title: '测试标题',
      tags: '流行, 轻快',
      customMode: true,
      instrumental: false,
      callbackUrl: `http://localhost:${CALLBACK_PORT}/callback/music`
    });
    console.log('✅ 任务已创建\n');
    
    // 等待回调
    console.log('⏳ 等待回调...');
    await sleep(10000);
    
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

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  
  console.log(`\n总测试数: ${testResults.length}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  
  if (failed > 0) {
    console.log('\n失败详情:');
    testResults.filter(r => !r.passed).forEach(result => {
      console.log(`\n${result.type}:`);
      result.issues.forEach(issue => console.log(`  ${issue}`));
    });
  } else {
    console.log('\n🎉 所有测试通过！回调数据中没有 undefined 值。');
  }
  
  console.log('\n' + '='.repeat(60));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


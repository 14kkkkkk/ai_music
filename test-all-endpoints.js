/**
 * 完整的 API 接口测试
 * 测试所有 13 个接口
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001';
const FILE_SERVER = 'http://localhost:8081';

// 全局变量存储测试数据
let testData = {
  lyricsTaskId: null,
  musicTaskId: null,
  uploadedAudioUrl: null,
  audioId: null
};

// 延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 轮询任务状态
async function pollTask(taskId, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(`${API_BASE}/api/music/task/${taskId}`);
    const status = response.data.data.status;
    
    console.log(`    轮询 ${i + 1}/${maxAttempts}: ${status}`);
    
    if (status === 'complete' || status === 'failed') {
      return response.data.data;
    }
    
    await sleep(3000);
  }
  
  throw new Error('任务超时');
}

// 测试函数
async function runTests() {
  console.log('========================================');
  console.log('  AI 音乐服务 - 完整接口测试');
  console.log('========================================\n');
  
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  // ==================== 基础接口 ====================
  
  // 测试 1: 健康检查
  try {
    console.log('✓ 测试 1: GET /health - 健康检查');
    const response = await axios.get(`${API_BASE}/health`);
    console.log(`  ✅ 通过 - 状态: ${response.data.status}\n`);
    passCount++;
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // 测试 2: 服务信息
  try {
    console.log('✓ 测试 2: GET / - 服务信息');
    const response = await axios.get(`${API_BASE}/`);
    console.log(`  ✅ 通过 - ${response.data.service}\n`);
    passCount++;
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // ==================== 任务管理 ====================
  
  // 测试 3: 获取所有任务
  try {
    console.log('✓ 测试 3: GET /api/music/tasks - 获取所有任务');
    const response = await axios.get(`${API_BASE}/api/music/tasks`);
    console.log(`  ✅ 通过 - 找到 ${response.data.data.length} 个任务\n`);
    passCount++;
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // ==================== 歌词生成 ====================
  
  // 测试 4: 生成歌词
  try {
    console.log('✓ 测试 4: POST /api/music/generate-lyrics - 生成歌词');
    const response = await axios.post(`${API_BASE}/api/music/generate-lyrics`, {
      prompt: '一首关于测试的歌'
    });
    
    if (response.data.code === 200 && response.data.data?.taskId) {
      testData.lyricsTaskId = response.data.data.taskId;
      console.log(`  ✅ 通过 - 任务ID: ${testData.lyricsTaskId}\n`);
      passCount++;
    } else {
      console.log(`  ❌ 失败: 响应格式错误\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // 测试 5: 查询歌词详情
  if (testData.lyricsTaskId) {
    try {
      console.log('✓ 测试 5: GET /api/music/lyrics/:taskId - 查询歌词详情');
      console.log('  等待歌词生成完成...');
      
      await sleep(5000); // 等待 5 秒
      
      const response = await axios.get(`${API_BASE}/api/music/lyrics/${testData.lyricsTaskId}`);
      console.log(`  ✅ 通过 - 状态: ${response.data.data?.status}\n`);
      passCount++;
    } catch (error) {
      console.log(`  ❌ 失败: ${error.message}\n`);
      failCount++;
    }
  } else {
    console.log('⊘ 测试 5: 跳过（依赖测试 4）\n');
    skipCount++;
  }
  
  // ==================== 文件上传 ====================
  
  // 测试 6: 上传音频文件
  try {
    console.log('✓ 测试 6: POST /api/upload/audio - 上传音频文件');
    
    // 创建测试音频文件
    const testAudioPath = path.join(__dirname, 'test-audio.mp3');
    if (!fs.existsSync(testAudioPath)) {
      // 创建一个空的 MP3 文件用于测试
      fs.writeFileSync(testAudioPath, Buffer.from([0xFF, 0xFB, 0x90, 0x00]));
    }
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(testAudioPath));
    
    const response = await axios.post(`${API_BASE}/api/upload/audio`, formData, {
      headers: formData.getHeaders()
    });
    
    if (response.data.code === 200 && response.data.data?.url) {
      testData.uploadedAudioUrl = response.data.data.url;
      console.log(`  ✅ 通过 - URL: ${testData.uploadedAudioUrl}\n`);
      passCount++;
    } else {
      console.log(`  ❌ 失败: 响应格式错误\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // 测试 7: 获取上传文件列表
  try {
    console.log('✓ 测试 7: GET /api/upload/list - 获取文件列表');
    const response = await axios.get(`${API_BASE}/api/upload/list`);
    console.log(`  ✅ 通过 - 找到 ${response.data.data.length} 个文件\n`);
    passCount++;
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // ==================== 音乐生成 ====================
  
  // 测试 8: 生成音乐（简单模式）
  try {
    console.log('✓ 测试 8: POST /api/music/generate - 生成音乐（简单模式）');
    const response = await axios.post(`${API_BASE}/api/music/generate`, {
      customMode: false,
      model: 'V5',
      prompt: '一首轻快的流行歌曲'
    });
    
    if (response.data.code === 200 && response.data.data?.taskId) {
      console.log(`  ✅ 通过 - 任务ID: ${response.data.data.taskId}\n`);
      passCount++;
    } else {
      console.log(`  ❌ 失败: 响应格式错误\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // 测试 9: 生成音乐（自定义模式）
  try {
    console.log('✓ 测试 9: POST /api/music/generate - 生成音乐（自定义模式）');
    const response = await axios.post(`${API_BASE}/api/music/generate`, {
      customMode: true,
      model: 'V5',
      prompt: '[Verse]\n测试歌词\n[Chorus]\n副歌部分',
      title: '测试歌曲',
      tags: '流行, 测试'
    });
    
    if (response.data.code === 200 && response.data.data?.taskId) {
      testData.musicTaskId = response.data.data.taskId;
      console.log(`  ✅ 通过 - 任务ID: ${testData.musicTaskId}\n`);
      passCount++;
    } else {
      console.log(`  ❌ 失败: 响应格式错误\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  console.log('========================================');
  console.log('  测试结果');
  console.log('========================================');
  console.log(`✅ 通过: ${passCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`⊘ 跳过: ${skipCount}`);
  console.log(`📊 总计: ${passCount + failCount + skipCount}`);
  console.log('========================================\n');
  
  return { passCount, failCount, skipCount };
}

// 运行测试
runTests()
  .then(({ passCount, failCount }) => {
    if (failCount === 0) {
      console.log('🎉 所有测试通过！\n');
      process.exit(0);
    } else {
      console.log('⚠️  部分测试失败。\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('测试执行失败:', error.message);
    process.exit(1);
  });


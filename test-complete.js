/**
 * 完整的 13 个接口测试
 * 包含详细的测试步骤和结果展示
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001';
const FILE_SERVER = 'http://localhost:8081';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// 延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 全局测试数据
let testData = {
  lyricsTaskId: null,
  musicTaskId: null,
  uploadedAudioUrl: null,
  audioId: null,
  generatedLyrics: null
};

let passCount = 0;
let failCount = 0;

// 测试函数
async function test(name, fn) {
  try {
    log(colors.cyan, `\n▶ ${name}`);
    const result = await fn();
    log(colors.green, `  ✅ 通过`);
    if (result) {
      console.log(`  ${colors.blue}→ ${result}${colors.reset}`);
    }
    passCount++;
    return true;
  } catch (error) {
    log(colors.red, `  ❌ 失败: ${error.message}`);
    if (error.response?.data) {
      console.log(`  ${colors.yellow}响应:${colors.reset}`, JSON.stringify(error.response.data, null, 2));
    }
    failCount++;
    return false;
  }
}

// 开始测试
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  log(colors.cyan, '                  AI 音乐服务 - 完整接口测试 (13/13)');
  console.log('='.repeat(80));
  
  // ==================== 基础服务 (2) ====================
  console.log('\n' + '─'.repeat(80));
  log(colors.yellow, '📋 基础服务 (2/13)');
  console.log('─'.repeat(80));
  
  await test('1. GET / - 服务信息', async () => {
    const res = await axios.get(`${API_BASE}/`);
    return `服务: ${res.data.service}`;
  });
  
  await test('2. GET /health - 健康检查', async () => {
    const res = await axios.get(`${API_BASE}/health`);
    return `状态: ${res.data.status}, 运行时间: ${Math.floor(res.data.uptime)}秒`;
  });
  
  // ==================== 任务管理 (4) ====================
  console.log('\n' + '─'.repeat(80));
  log(colors.yellow, '📊 任务管理 (4/13)');
  console.log('─'.repeat(80));
  
  await test('3. GET /api/music/tasks - 获取所有任务', async () => {
    const res = await axios.get(`${API_BASE}/api/music/tasks`);
    return `找到 ${res.data.data.length} 个任务`;
  });
  
  // ==================== 歌词生成 (2) ====================
  console.log('\n' + '─'.repeat(80));
  log(colors.yellow, '📝 歌词生成 (2/13)');
  console.log('─'.repeat(80));
  
  await test('4. POST /api/music/generate-lyrics - 生成歌词', async () => {
    const res = await axios.post(`${API_BASE}/api/music/generate-lyrics`, {
      prompt: '一首关于测试的轻快歌曲'
    });
    testData.lyricsTaskId = res.data.data.taskId;
    return `任务ID: ${testData.lyricsTaskId}`;
  });
  
  await test('5. GET /api/music/lyrics/:taskId - 查询歌词详情', async () => {
    if (!testData.lyricsTaskId) throw new Error('依赖测试 4');
    
    log(colors.blue, '  等待 5 秒...');
    await sleep(5000);
    
    const res = await axios.get(`${API_BASE}/api/music/lyrics/${testData.lyricsTaskId}`);
    const status = res.data.data.status;
    
    // 提取歌词（如果已生成）
    if (status === 'SUCCESS' && res.data.data.response?.data) {
      const lyricsData = res.data.data.response.data[0];
      if (lyricsData) {
        testData.generatedLyrics = lyricsData.text;
        return `状态: ${status}, 标题: ${lyricsData.title}`;
      }
    }
    
    return `状态: ${status}`;
  });
  
  // ==================== 文件上传 (2) ====================
  console.log('\n' + '─'.repeat(80));
  log(colors.yellow, '📁 文件上传 (2/13)');
  console.log('─'.repeat(80));
  
  await test('6. POST /api/upload/audio - 上传音频文件', async () => {
    // 使用已存在的测试文件
    const testAudioPath = path.join(__dirname, 'test-audio.mp3');
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(testAudioPath));
    
    const res = await axios.post(`${API_BASE}/api/upload/audio`, formData, {
      headers: formData.getHeaders()
    });
    
    testData.uploadedAudioUrl = res.data.data.url;
    return `URL: ${testData.uploadedAudioUrl}`;
  });
  
  await test('7. GET /api/upload/list - 获取文件列表', async () => {
    const res = await axios.get(`${API_BASE}/api/upload/list`);
    return `找到 ${res.data.data.length} 个文件`;
  });
  
  // ==================== 音乐生成 (2) ====================
  console.log('\n' + '─'.repeat(80));
  log(colors.yellow, '🎵 音乐生成 (2/13)');
  console.log('─'.repeat(80));
  
  await test('8. POST /api/music/generate - 生成音乐（简单模式）', async () => {
    const res = await axios.post(`${API_BASE}/api/music/generate`, {
      customMode: false,
      model: 'V5',
      prompt: '一首轻快的流行歌曲，充满活力'
    });
    return `任务ID: ${res.data.data.taskId}`;
  });
  
  await test('9. POST /api/music/generate - 生成音乐（自定义模式）', async () => {
    const lyrics = testData.generatedLyrics || '[Verse]\n测试歌词\n[Chorus]\n副歌部分';
    
    const res = await axios.post(`${API_BASE}/api/music/generate`, {
      customMode: true,
      model: 'V5',
      prompt: lyrics,
      title: '测试歌曲',
      tags: '流行, 测试'
    });
    
    testData.musicTaskId = res.data.data.taskId;
    return `任务ID: ${testData.musicTaskId}`;
  });
  
  // ==================== 任务查询 (2) ====================
  console.log('\n' + '─'.repeat(80));
  log(colors.yellow, '🔍 任务查询 (2/13)');
  console.log('─'.repeat(80));
  
  await test('10. GET /api/music/task/:taskId - 获取任务状态', async () => {
    if (!testData.musicTaskId) throw new Error('依赖测试 9');
    
    const res = await axios.get(`${API_BASE}/api/music/task/${testData.musicTaskId}`);
    return `状态: ${res.data.data.status}`;
  });
  
  await test('11. GET /api/music/task/:taskId/detail - 获取任务详情（Suno API）', async () => {
    if (!testData.musicTaskId) throw new Error('依赖测试 9');
    
    const res = await axios.get(`${API_BASE}/api/music/task/${testData.musicTaskId}/detail`);
    
    // 提取 audioId（如果有）
    if (res.data.data?.response?.clips && res.data.data.response.clips.length > 0) {
      testData.audioId = res.data.data.response.clips[0].id;
      return `状态: ${res.data.data.status}, 找到 ${res.data.data.response.clips.length} 个音频`;
    }
    
    return `状态: ${res.data.data.status}`;
  });
  
  // ==================== 高级功能 (2) ====================
  console.log('\n' + '─'.repeat(80));
  log(colors.yellow, '🎹 高级功能 (2/13)');
  console.log('─'.repeat(80));
  
  await test('12. POST /api/music/add-vocals - 添加人声', async () => {
    if (!testData.uploadedAudioUrl) throw new Error('依赖测试 6');

    const res = await axios.post(`${API_BASE}/api/music/add-vocals`, {
      uploadUrl: testData.uploadedAudioUrl,
      prompt: '[Verse]\n测试人声\n[Chorus]\n副歌',
      title: '测试人声',
      style: '流行',
      vocalGender: 'f'
    });

    return `任务ID: ${res.data.data.taskId}`;
  });

  await test('13. POST /api/music/add-instrumental - 添加伴奏', async () => {
    if (!testData.uploadedAudioUrl) throw new Error('依赖测试 6');

    const res = await axios.post(`${API_BASE}/api/music/add-instrumental`, {
      uploadUrl: testData.uploadedAudioUrl,
      title: '测试伴奏',
      tags: '流行'
    });

    return `任务ID: ${res.data.data.taskId}`;
  });
  
  // ==================== 测试总结 ====================
  console.log('\n' + '='.repeat(80));
  log(colors.cyan, '                           测试结果');
  console.log('='.repeat(80));
  
  console.log(`\n✅ 通过: ${colors.green}${passCount}/13${colors.reset}`);
  console.log(`❌ 失败: ${colors.red}${failCount}/13${colors.reset}`);
  console.log(`📊 成功率: ${colors.cyan}${((passCount / 13) * 100).toFixed(1)}%${colors.reset}`);
  
  console.log('\n' + '='.repeat(80));
  
  if (failCount === 0) {
    log(colors.green, '\n🎉 恭喜！所有 13 个接口测试通过！');
    log(colors.cyan, '\n服务已完全就绪，可以部署到生产环境。\n');
    process.exit(0);
  } else {
    log(colors.yellow, `\n⚠️  ${failCount} 个接口测试失败，请检查日志。\n`);
    process.exit(1);
  }
}

// 运行测试
runAllTests().catch(error => {
  log(colors.red, '\n❌ 测试执行失败:', error.message);
  process.exit(1);
});


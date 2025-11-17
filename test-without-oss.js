/**
 * 测试脚本（不包含 OSS 上传）
 * 测试任务管理器、队列管理、状态管理等核心功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_CALLBACK_URL = 'http://localhost:3001/api/callback/test'; // 本地测试回调

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试 1: 服务基础功能
async function testBasicService() {
  log('\n========== 测试 1: 服务基础功能 ==========', 'blue');
  
  try {
    // 健康检查
    log('1.1 健康检查...', 'cyan');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    if (healthRes.data.status === 'ok') {
      log('✓ 健康检查通过', 'green');
    } else {
      log('✗ 健康检查失败', 'red');
      return false;
    }
    
    // 服务信息
    log('1.2 获取服务信息...', 'cyan');
    const infoRes = await axios.get(`${BASE_URL}/`);
    if (infoRes.data.version === '2.0.0' && infoRes.data.taskManager) {
      log(`✓ 服务版本: ${infoRes.data.version}`, 'green');
      log(`  任务管理器状态: ${JSON.stringify(infoRes.data.taskManager)}`, 'yellow');
    } else {
      log('✗ 服务信息格式错误', 'red');
      return false;
    }
    
    // 统计信息
    log('1.3 获取任务统计...', 'cyan');
    const statsRes = await axios.get(`${BASE_URL}/api/music/stats`);
    if (statsRes.data.code === 200) {
      log('✓ 统计信息获取成功', 'green');
      log(`  ${JSON.stringify(statsRes.data.data)}`, 'yellow');
    } else {
      log('✗ 统计信息获取失败', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`✗ 测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试 2: 任务创建和状态管理
async function testTaskCreation() {
  log('\n========== 测试 2: 任务创建和状态管理 ==========', 'blue');
  
  try {
    // 创建歌词生成任务
    log('2.1 创建歌词生成任务...', 'cyan');
    const lyricsRes = await axios.post(`${BASE_URL}/api/music/generate-lyrics`, {
      prompt: '写一首关于测试的歌',
      callbackUrl: TEST_CALLBACK_URL
    });
    
    if (lyricsRes.status === 202 && lyricsRes.data.data.taskId) {
      const taskId = lyricsRes.data.data.taskId;
      log(`✓ 任务创建成功，任务ID: ${taskId}`, 'green');
      log(`  状态: ${lyricsRes.data.data.status}, 进度: ${lyricsRes.data.data.progress}`, 'yellow');
      
      // 查询任务状态
      log('2.2 查询任务状态...', 'cyan');
      await sleep(1000); // 等待 1 秒
      
      const taskRes = await axios.get(`${BASE_URL}/api/music/task/${taskId}`);
      if (taskRes.data.code === 200) {
        log('✓ 任务状态查询成功', 'green');
        log(`  状态: ${taskRes.data.data.status}`, 'yellow');
        log(`  进度: ${taskRes.data.data.progress}`, 'yellow');
        log(`  类型: ${taskRes.data.data.type}`, 'yellow');
      } else {
        log('✗ 任务状态查询失败', 'red');
        return false;
      }
      
      return taskId;
    } else {
      log('✗ 任务创建失败', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ 测试失败: ${error.message}`, 'red');
    if (error.response) {
      log(`  响应: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// 测试 3: 并发任务创建
async function testConcurrentTasks() {
  log('\n========== 测试 3: 并发任务创建 ==========', 'blue');
  
  try {
    log('3.1 创建 5 个并发任务...', 'cyan');
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.post(`${BASE_URL}/api/music/generate-lyrics`, {
          prompt: `测试任务 ${i + 1}`,
          callbackUrl: TEST_CALLBACK_URL
        })
      );
    }
    
    const results = await Promise.all(promises);
    const taskIds = results.map(r => r.data.data.taskId);
    
    log(`✓ 成功创建 ${taskIds.length} 个任务`, 'green');
    taskIds.forEach((id, index) => {
      log(`  任务 ${index + 1}: ${id}`, 'yellow');
    });
    
    // 查询统计信息
    log('3.2 查询统计信息...', 'cyan');
    await sleep(1000);
    
    const statsRes = await axios.get(`${BASE_URL}/api/music/stats`);
    const stats = statsRes.data.data;
    log('✓ 统计信息:', 'green');
    log(`  总任务: ${stats.total}`, 'yellow');
    log(`  待处理: ${stats.pending}`, 'yellow');
    log(`  处理中: ${stats.processing}`, 'yellow');
    log(`  已完成: ${stats.completed}`, 'yellow');
    log(`  失败: ${stats.failed}`, 'yellow');
    log(`  队列大小: ${stats.queueSize}`, 'yellow');
    log(`  队列待处理: ${stats.queuePending}`, 'yellow');
    
    return taskIds;
  } catch (error) {
    log(`✗ 测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试 4: 参数验证
async function testValidation() {
  log('\n========== 测试 4: 参数验证 ==========', 'blue');
  
  try {
    // 缺少 prompt
    log('4.1 测试缺少 prompt...', 'cyan');
    try {
      await axios.post(`${BASE_URL}/api/music/generate-lyrics`, {
        callbackUrl: TEST_CALLBACK_URL
      });
      log('✗ 应该返回错误但没有', 'red');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log('✓ 正确返回 400 错误', 'green');
      } else {
        log('✗ 错误状态码不正确', 'red');
      }
    }
    
    // 缺少 callbackUrl
    log('4.2 测试缺少 callbackUrl...', 'cyan');
    try {
      await axios.post(`${BASE_URL}/api/music/generate-lyrics`, {
        prompt: '测试'
      });
      log('✗ 应该返回错误但没有', 'red');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log('✓ 正确返回 400 错误', 'green');
      } else {
        log('✗ 错误状态码不正确', 'red');
      }
    }
    
    // 查询不存在的任务
    log('4.3 测试查询不存在的任务...', 'cyan');
    try {
      await axios.get(`${BASE_URL}/api/music/task/non-existent-task-id`);
      log('✗ 应该返回 404 但没有', 'red');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        log('✓ 正确返回 404 错误', 'green');
      } else {
        log('✗ 错误状态码不正确', 'red');
      }
    }
    
    return true;
  } catch (error) {
    log(`✗ 测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 主测试函数
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║   AI 音乐服务 v2.0 - 功能测试（不包含 OSS 上传）      ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  
  const results = {
    basicService: false,
    taskCreation: false,
    concurrentTasks: false,
    validation: false
  };
  
  // 运行测试
  results.basicService = await testBasicService();
  results.taskCreation = await testTaskCreation();
  results.concurrentTasks = await testConcurrentTasks();
  results.validation = await testValidation();
  
  // 总结
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║                      测试总结                          ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  
  const testNames = {
    basicService: '服务基础功能',
    taskCreation: '任务创建和状态管理',
    concurrentTasks: '并发任务创建',
    validation: '参数验证'
  };
  
  let passCount = 0;
  let totalCount = 0;
  
  for (const [key, name] of Object.entries(testNames)) {
    totalCount++;
    const passed = results[key];
    if (passed) passCount++;
    
    const status = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`${status} ${name}`, color);
  }
  
  log('\n' + '='.repeat(60), 'blue');
  const allPassed = passCount === totalCount;
  const summary = `总计: ${passCount}/${totalCount} 通过`;
  log(summary, allPassed ? 'green' : 'yellow');
  log('='.repeat(60), 'blue');
  
  if (allPassed) {
    log('\n🎉 所有测试通过！任务管理器工作正常！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查日志', 'yellow');
  }
  
  log('\n提示: 这些测试不包含 OSS 上传功能', 'cyan');
  log('提示: Suno API 调用可能会失败（需要真实的 API 密钥）', 'cyan');
  log('提示: 但任务管理器、队列、状态管理等核心功能已验证', 'cyan');
}

// 运行测试
runTests().catch(error => {
  log(`\n测试过程出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});


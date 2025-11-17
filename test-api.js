/**
 * API 快速测试脚本 v2.0
 * 用于验证新版异步任务服务是否正常运行
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const CALLBACK_URL = 'http://47.252.36.81:3001/api/callback/test'; // 测试回调地址

async function testAPI() {
  console.log('========================================');
  console.log('  AI 音乐服务 v2.0 - API 测试');
  console.log('========================================\n');

  let passCount = 0;
  let failCount = 0;

  // 测试 1: 健康检查
  try {
    console.log('✓ 测试 1: 健康检查...');
    const response = await axios.get(`${API_BASE}/health`);
    if (response.data.status === 'ok') {
      console.log('  ✅ 通过\n');
      passCount++;
    } else {
      console.log('  ❌ 失败: 状态异常\n');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }

  // 测试 2: 获取服务信息
  try {
    console.log('✓ 测试 2: 获取服务信息...');
    const response = await axios.get(`${API_BASE}/`);
    if (response.data.service && response.data.taskManager) {
      console.log(`  ✅ 通过 - ${response.data.service} ${response.data.version}\n`);
      console.log(`  任务管理器状态: ${JSON.stringify(response.data.taskManager)}\n`);
      passCount++;
    } else {
      console.log('  ❌ 失败: 响应格式错误\n');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }

  // 测试 3: 获取任务统计
  try {
    console.log('✓ 测试 3: 获取任务统计...');
    const response = await axios.get(`${API_BASE}/api/music/stats`);
    if (response.data.code === 200) {
      const stats = response.data.data;
      console.log(`  ✅ 通过 - 总任务: ${stats.total}, 处理中: ${stats.processing}, 已完成: ${stats.completed}\n`);
      passCount++;
    } else {
      console.log('  ❌ 失败: 响应格式错误\n');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // 测试 4: 文件服务器健康检查
  try {
    console.log('✓ 测试 4: 文件服务器健康检查...');
    const fileServerPort = process.env.FILE_SERVER_PORT || '8081';
    const response = await axios.get(`http://localhost:${fileServerPort}/health`);
    if (response.data.status === 'ok') {
      console.log('  ✅ 通过\n');
      passCount++;
    } else {
      console.log('  ❌ 失败: 状态异常\n');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // 测试 5: 文件列表
  try {
    console.log('✓ 测试 5: 获取文件列表...');
    const fileServerPort = process.env.FILE_SERVER_PORT || '8081';
    const response = await axios.get(`http://localhost:${fileServerPort}/list`);
    if (response.data.success) {
      console.log(`  ✅ 通过 - 找到 ${response.data.count} 个文件\n`);
      passCount++;
    } else {
      console.log('  ❌ 失败: 响应格式错误\n');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // 总结
  console.log('========================================');
  console.log('  测试结果');
  console.log('========================================');
  console.log(`✅ 通过: ${passCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`📊 总计: ${passCount + failCount}`);
  console.log('========================================\n');
  
  if (failCount === 0) {
    console.log('🎉 所有测试通过！服务运行正常。\n');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查服务配置。\n');
    process.exit(1);
  }
}

// 运行测试
testAPI().catch(error => {
  console.error('测试执行失败:', error.message);
  process.exit(1);
});


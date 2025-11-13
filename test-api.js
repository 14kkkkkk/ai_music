/**
 * API 快速测试脚本
 * 用于验证服务是否正常运行
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

async function testAPI() {
  console.log('========================================');
  console.log('  AI 音乐服务 - API 测试');
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
    if (response.data.service) {
      console.log(`  ✅ 通过 - ${response.data.service}\n`);
      passCount++;
    } else {
      console.log('  ❌ 失败: 响应格式错误\n');
      failCount++;
    }
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    failCount++;
  }
  
  // 测试 3: 获取任务列表
  try {
    console.log('✓ 测试 3: 获取任务列表...');
    const response = await axios.get(`${API_BASE}/api/music/tasks`);
    if (response.data.code === 200) {
      console.log(`  ✅ 通过 - 找到 ${response.data.data.length} 个任务\n`);
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


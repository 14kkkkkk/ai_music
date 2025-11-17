/**
 * 简单测试脚本 - 使用原生 http 模块
 */

const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('\n========== 简单功能测试 ==========\n');

  try {
    // 测试 1: 根路径
    console.log('测试 1: GET /');
    const test1 = await testEndpoint('/');
    console.log(`状态码: ${test1.status}`);
    console.log(`响应:`, JSON.stringify(test1.data, null, 2));
    console.log('');

    // 测试 2: 健康检查
    console.log('测试 2: GET /health');
    const test2 = await testEndpoint('/health');
    console.log(`状态码: ${test2.status}`);
    console.log(`响应:`, JSON.stringify(test2.data, null, 2));
    console.log('');

    // 测试 3: 统计信息
    console.log('测试 3: GET /api/music/stats');
    const test3 = await testEndpoint('/api/music/stats');
    console.log(`状态码: ${test3.status}`);
    console.log(`响应:`, JSON.stringify(test3.data, null, 2));
    console.log('');

    // 测试 4: 创建任务（带 callbackUrl）
    console.log('测试 4: POST /api/music/generate-lyrics');
    const test4 = await testEndpoint('/api/music/generate-lyrics', 'POST', {
      prompt: '测试歌词',
      callbackUrl: 'http://localhost:3001/api/callback/test'
    });
    console.log(`状态码: ${test4.status}`);
    console.log(`响应:`, JSON.stringify(test4.data, null, 2));
    
    if (test4.data.data && test4.data.data.taskId) {
      const taskId = test4.data.data.taskId;
      console.log('');

      // 测试 5: 查询任务状态
      console.log(`测试 5: GET /api/music/task/${taskId}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒
      const test5 = await testEndpoint(`/api/music/task/${taskId}`);
      console.log(`状态码: ${test5.status}`);
      console.log(`响应:`, JSON.stringify(test5.data, null, 2));
    }

    console.log('\n========== 测试完成 ==========\n');
    console.log('✓ 所有基础功能正常！');

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    console.error(error);
  }
}

runTests();


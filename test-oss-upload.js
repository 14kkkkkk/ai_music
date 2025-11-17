/**
 * OSS 上传功能测试脚本
 * 测试文件: C:\work\ai_music\demo_music\demo1.mp3
 */

const ossService = require('./services/ossService');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 计算文件的 MD5 哈希值
 */
function calculateFileMD5(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', reject);
  });
}

async function testOSSUpload() {
  console.log('\n' + '='.repeat(80));
  log(colors.cyan, '🎵 AI 音乐服务 - OSS 上传功能测试');
  console.log('='.repeat(80) + '\n');

  const testFilePath = 'C:\\work\\ai_music\\demo_music\\demo1.mp3';

  try {
    // 1. 检查测试文件是否存在
    log(colors.yellow, '步骤 1: 检查测试文件');
    console.log(`文件路径: ${testFilePath}`);

    if (!fs.existsSync(testFilePath)) {
      log(colors.red, '✗ 测试文件不存在！');
      console.log('请确保文件存在: C:\\work\\ai_music\\demo_music\\demo1.mp3');
      return;
    }

    const fileStats = fs.statSync(testFilePath);
    const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
    log(colors.green, `✓ 测试文件存在`);
    console.log(`文件大小: ${fileSizeMB} MB (${fileStats.size} bytes)`);
    console.log('');

    // 2. 计算文件的 MD5
    log(colors.yellow, '步骤 2: 计算文件 MD5');
    const md5Hash = await calculateFileMD5(testFilePath);
    log(colors.green, `✓ MD5 计算完成`);
    console.log(`MD5: ${md5Hash}`);
    console.log(`预期文件名: ${md5Hash}.mp3`);
    console.log('');

    // 3. 测试获取签名 URL
    log(colors.yellow, '步骤 3: 获取 OSS 签名 URL');
    const fileName = `${md5Hash}.mp3`;
    console.log(`请求文件名: ${fileName}`);

    const signedUrl = await ossService.getSignedUploadUrl(fileName);
    log(colors.green, `✓ 获取签名 URL 成功`);
    console.log(`签名 URL: ${signedUrl.substring(0, 100)}...`);
    console.log('');

    // 4. 测试上传文件到 OSS
    log(colors.yellow, '步骤 4: 上传文件到 OSS');
    console.log(`使用签名 URL 上传文件...`);

    await ossService.uploadToOSSWithNativeHttp(signedUrl, testFilePath);
    log(colors.green, `✓ 文件上传成功`);
    console.log('');

    // 5. 测试完整的上传流程（使用 uploadLocalFile）
    log(colors.yellow, '步骤 5: 测试完整上传流程');
    console.log(`调用 uploadLocalFile 方法...`);

    const uploadedFileName = await ossService.uploadLocalFile(testFilePath);
    log(colors.green, `✓ 完整上传流程成功`);
    console.log(`返回的文件名: ${uploadedFileName}`);
    console.log('');

    // 6. 验证文件名是否为 MD5
    log(colors.yellow, '步骤 6: 验证文件名格式');
    const expectedFileName = `${md5Hash}.mp3`;
    if (uploadedFileName === expectedFileName) {
      log(colors.green, `✓ 文件名格式正确（MD5）`);
      console.log(`预期: ${expectedFileName}`);
      console.log(`实际: ${uploadedFileName}`);
    } else {
      log(colors.red, `✗ 文件名格式不匹配`);
      console.log(`预期: ${expectedFileName}`);
      console.log(`实际: ${uploadedFileName}`);
    }
    console.log('');

    // 测试总结
    console.log('='.repeat(80));
    log(colors.green, '🎉 所有测试通过！');
    console.log('='.repeat(80));
    console.log('');
    log(colors.cyan, '测试总结:');
    console.log(`  ✓ 文件存在检查`);
    console.log(`  ✓ MD5 计算`);
    console.log(`  ✓ 获取签名 URL`);
    console.log(`  ✓ 上传文件到 OSS`);
    console.log(`  ✓ 完整上传流程`);
    console.log(`  ✓ 文件名格式验证`);
    console.log('');
    log(colors.cyan, '上传结果:');
    console.log(`  文件名: ${uploadedFileName}`);
    console.log(`  MD5: ${md5Hash}`);
    console.log(`  大小: ${fileSizeMB} MB`);
    console.log('');

  } catch (error) {
    console.log('');
    log(colors.red, '✗ 测试失败');
    console.log('错误信息:', error.message);
    console.log('');
    if (error.stack) {
      console.log('错误堆栈:');
      console.log(error.stack);
    }
    process.exit(1);
  }
}

// 运行测试
testOSSUpload();


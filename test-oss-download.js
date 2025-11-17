/**
 * 测试从 OSS 下载文件
 */

const axios = require('axios');

async function testDownload() {
  const fileName = '01920b04c09494c48e51a32ae1f171ea.mp3';
  const ossUrl = `https://storage.mediaio.net/result-file/${fileName}`;

  console.log('测试下载 OSS 文件...');
  console.log(`URL: ${ossUrl}`);
  console.log('');

  try {
    const response = await axios.head(ossUrl, {
      timeout: 10000
    });

    console.log('✓ 文件可访问');
    console.log(`状态码: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.headers['content-length']} bytes`);
    
    const sizeMB = (parseInt(response.headers['content-length']) / 1024 / 1024).toFixed(2);
    console.log(`文件大小: ${sizeMB} MB`);
    console.log('');
    console.log('🎉 OSS 文件上传成功并可访问！');

  } catch (error) {
    console.log('✗ 文件不可访问');
    console.log(`错误: ${error.message}`);
    if (error.response) {
      console.log(`状态码: ${error.response.status}`);
    }
  }
}

testDownload();


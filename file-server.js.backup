/**
 * 文件服务器 - 提供音频文件访问
 * 运行在独立端口，用于提供上传的音频文件给 Suno API 访问
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { logger } = require('./utils/logger');

const app = express();
const PORT = parseInt(process.env.FILE_SERVER_PORT || '8081', 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  logger.info(`创建上传目录: ${UPLOAD_DIR}`);
}

/**
 * 获取本机局域网IP地址
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

// CORS配置 - 允许所有来源访问
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 请求日志
app.use((req, res, next) => {
  logger.info(`[文件服务器] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// 静态文件服务
app.use('/uploads', express.static(UPLOAD_DIR, {
  setHeaders: (res, filePath) => {
    // 设置音频文件的Content-Type
    if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    } else if (filePath.endsWith('.flac')) {
      res.setHeader('Content-Type', 'audio/flac');
    }
    
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'file-server',
    uploadDir: UPLOAD_DIR
  });
});

// 列出所有文件（用于调试）
app.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const localIP = getLocalIP();
    
    res.json({
      success: true,
      count: files.length,
      files: files.map(f => {
        const stats = fs.statSync(path.join(UPLOAD_DIR, f));
        return {
          name: f,
          size: stats.size,
          created: stats.birthtime,
          localUrl: `http://localhost:${PORT}/uploads/${f}`,
          lanUrl: `http://${localIP}:${PORT}/uploads/${f}`
        };
      })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '文件不存在',
    path: req.path
  });
});

// 错误处理
app.use((err, req, res, next) => {
  logger.error('[文件服务器] 错误', { 
    error: err.message, 
    stack: err.stack 
  });
  
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  });
});

// 获取本机IP
const localIP = getLocalIP();

// 启动服务（监听0.0.0.0，允许外网访问）
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('========================================');
  logger.info('📁 文件服务器已启动');
  logger.info('========================================');
  logger.info(`📍 本地访问: http://localhost:${PORT}`);
  logger.info(`📍 局域网访问: http://${localIP}:${PORT}`);
  logger.info(`📍 外网访问: ${process.env.CALLBACK_BASE_URL || '需要配置 ngrok'}`);
  logger.info(`📂 文件目录: ${UPLOAD_DIR}`);
  logger.info(`📊 健康检查: http://localhost:${PORT}/health`);
  logger.info(`📋 文件列表: http://localhost:${PORT}/list`);
  logger.info(`⚠️  请确保防火墙已开放 ${PORT} 端口`);
  logger.info('========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('[文件服务器] 收到 SIGTERM 信号，开始优雅关闭...');
  server.close(() => {
    logger.info('[文件服务器] 已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('[文件服务器] 收到 SIGINT 信号，开始优雅关闭...');
  server.close(() => {
    logger.info('[文件服务器] 已关闭');
    process.exit(0);
  });
});

module.exports = app;


/**
 * AI 音乐服务 - 主服务入口
 * 提供音乐生成、歌词创作、音频处理等功能
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { logger } = require('./utils/logger');
const musicRoutes = require('./routes/music');
const uploadRoutes = require('./routes/upload');
const callbackRoutes = require('./routes/callback');

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// 确保必要的目录存在
const requiredDirs = ['./uploads', './data', './logs'];
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`创建目录: ${dir}`);
  }
});

// 静态文件服务 - 提供上传的音频文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 注册路由
app.use('/api/music', musicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/callback', callbackRoutes);

// 根路径 - 服务信息
app.get('/', (req, res) => {
  res.json({
    service: 'AI 音乐生成服务',
    version: '1.0.0',
    description: '提供音乐生成、歌词创作、音频处理等功能',
    endpoints: {
      // 歌词生成
      generateLyrics: 'POST /api/music/generate-lyrics',
      getLyricsDetail: 'GET /api/music/lyrics/:taskId',
      
      // 音乐生成
      generateMusic: 'POST /api/music/generate',
      extendMusic: 'POST /api/music/extend',
      
      // 音频处理
      uploadAudio: 'POST /api/upload/audio',
      addVocals: 'POST /api/music/add-vocals',
      addInstrumental: 'POST /api/music/add-instrumental',
      
      // 任务管理
      getTask: 'GET /api/music/task/:taskId',
      getTaskDetail: 'GET /api/music/task/:taskId/detail',
      getAllTasks: 'GET /api/music/tasks',
      deleteTask: 'DELETE /api/music/task/:taskId',
      
      // 健康检查
      health: 'GET /health'
    },
    documentation: 'https://github.com/your-repo/ai-music-service'
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ai-music-service',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    msg: '接口不存在',
    path: req.path
  });
});

// 错误处理
app.use((err, req, res, next) => {
  logger.error('服务器错误', { 
    error: err.message, 
    stack: err.stack,
    path: req.path
  });
  
  res.status(500).json({
    code: 500,
    msg: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务（监听 0.0.0.0，允许外网访问）
app.listen(PORT, '0.0.0.0', () => {
  logger.info('========================================');
  logger.info('🎵 AI 音乐服务已启动');
  logger.info('========================================');
  logger.info(`📍 本地访问: http://localhost:${PORT}`);
  logger.info(`📍 外网访问: http://你的服务器IP:${PORT}`);
  logger.info(`📊 健康检查: http://localhost:${PORT}/health`);
  logger.info(`📖 API文档: http://localhost:${PORT}/`);
  logger.info(`🔧 环境: ${process.env.NODE_ENV || 'production'}`);
  logger.info(`🔑 Suno API: ${process.env.SUNO_API_KEY ? '已配置' : '未配置'}`);
  logger.info(`📡 回调地址: ${process.env.CALLBACK_BASE_URL || '未配置'}`);
  logger.info(`⚠️  请确保防火墙已开放 ${PORT} 端口`);
  logger.info('========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，开始优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，开始优雅关闭...');
  process.exit(0);
});

module.exports = app;


/**
 * 文件上传路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `audio-${Date.now()}-${Math.floor(Math.random() * 1000000000)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|flac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  // 允许的 MIME 类型
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/flac',
    'audio/x-flac',
    'application/octet-stream' // 某些情况下浏览器会使用这个
  ];

  const mimetypeOk = allowedMimeTypes.includes(file.mimetype);

  if (extname || mimetypeOk) {
    cb(null, true);
  } else {
    cb(new Error(`只支持 MP3, WAV, FLAC 格式，当前类型: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter
});

/**
 * 上传音频文件
 */
router.post('/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        msg: '没有上传文件'
      });
    }
    
    // 生成公网可访问的 URL
    const fileUrl = `${process.env.CALLBACK_BASE_URL}/uploads/${req.file.filename}`;
    
    logger.info('文件上传成功', {
      filename: req.file.filename,
      size: req.file.size,
      url: fileUrl
    });
    
    return res.json({
      code: 200,
      msg: 'success',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    logger.error('文件上传失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 删除音频文件
 */
router.delete('/audio/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: 404,
        msg: '文件不存在'
      });
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    logger.info('文件删除成功', { filename });
    
    return res.json({
      code: 200,
      msg: 'success'
    });
  } catch (error) {
    logger.error('文件删除失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 列出所有上传的文件
 */
router.get('/list', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({
        code: 200,
        msg: 'success',
        data: []
      });
    }
    
    const files = fs.readdirSync(uploadDir);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        url: `${process.env.CALLBACK_BASE_URL}/uploads/${filename}`
      };
    });
    
    return res.json({
      code: 200,
      msg: 'success',
      data: fileList
    });
  } catch (error) {
    logger.error('获取文件列表失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

module.exports = router;


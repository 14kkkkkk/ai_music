/**
 * 回调路由 - 接收 Suno API 的回调通知
 */

const express = require('express');
const router = express.Router();
const taskStore = require('../services/taskStore');
const { logger } = require('../utils/logger');

/**
 * 状态映射函数
 */
function mapSunoStatusToLocal(sunoStatus) {
  const statusMap = {
    'PENDING': 'pending',
    'TEXT_SUCCESS': 'text',
    'FIRST_SUCCESS': 'first',
    'SUCCESS': 'complete',
    'CREATE_TASK_FAILED': 'failed',
    'GENERATE_AUDIO_FAILED': 'failed',
    'CALLBACK_EXCEPTION': 'failed',
    'SENSITIVE_WORD_ERROR': 'failed'
  };
  
  return statusMap[sunoStatus] || 'pending';
}

/**
 * 音乐生成回调
 */
router.post('/music', async (req, res) => {
  try {
    logger.info('收到音乐生成回调', { body: req.body });
    
    const { taskId, status, clips, errorMessage } = req.body;
    
    if (!taskId) {
      return res.status(400).json({
        code: 400,
        msg: 'taskId is required'
      });
    }
    
    const localStatus = mapSunoStatusToLocal(status);
    
    // 更新任务状态
    await taskStore.updateTask(taskId, {
      status: localStatus,
      clips: clips || [],
      error: errorMessage
    });
    
    logger.info('音乐任务状态已更新', { taskId, status: localStatus });
    
    return res.json({
      code: 200,
      msg: 'success'
    });
  } catch (error) {
    logger.error('处理音乐回调失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 歌词生成回调
 */
router.post('/lyrics', async (req, res) => {
  try {
    logger.info('收到歌词生成回调', { body: req.body });
    
    const { taskId, status, response, errorMessage } = req.body;
    
    if (!taskId) {
      return res.status(400).json({
        code: 400,
        msg: 'taskId is required'
      });
    }
    
    const localStatus = mapSunoStatusToLocal(status);
    
    // 提取歌词
    let lyricsText = '';
    let lyricsTitle = '';
    
    if (response?.data && Array.isArray(response.data)) {
      const firstLyrics = response.data[0];
      if (firstLyrics) {
        lyricsText = firstLyrics.text || '';
        lyricsTitle = firstLyrics.title || '';
      }
    } else if (response?.text) {
      lyricsText = response.text;
      lyricsTitle = response.title || '';
    }
    
    // 更新任务状态
    await taskStore.updateTask(taskId, {
      status: localStatus,
      metadata: {
        lyrics: lyricsText,
        title: lyricsTitle,
        type: 'lyrics'
      },
      error: errorMessage
    });
    
    logger.info('歌词任务状态已更新', { taskId, status: localStatus });
    
    return res.json({
      code: 200,
      msg: 'success'
    });
  } catch (error) {
    logger.error('处理歌词回调失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

module.exports = router;


/**
 * 音乐相关路由
 */

const express = require('express');
const router = express.Router();
const sunoApi = require('../services/sunoApi');
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
 * 生成歌词
 */
router.post('/generate-lyrics', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        code: 400,
        msg: 'prompt is required'
      });
    }
    
    const params = {
      prompt,
      callBackUrl: `${process.env.CALLBACK_BASE_URL}/api/callback/lyrics`
    };
    
    const response = await sunoApi.generateLyrics(params);
    
    // 创建本地任务记录
    if (response.code === 200 && response.data?.taskId) {
      await taskStore.createTask(response.data.taskId, {
        prompt,
        type: 'lyrics'
      });
    }
    
    return res.json(response);
  } catch (error) {
    logger.error('生成歌词失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 获取歌词详情
 */
router.get('/lyrics/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await sunoApi.getLyricsDetail(taskId);
    
    // 更新本地任务状态
    if (response.code === 200 && response.data) {
      const localStatus = mapSunoStatusToLocal(response.data.status);
      
      let lyricsText = '';
      let lyricsTitle = '';
      
      // 提取歌词（处理数组格式）
      if (response.data.response?.data && Array.isArray(response.data.response.data)) {
        const firstLyrics = response.data.response.data[0];
        if (firstLyrics) {
          lyricsText = firstLyrics.text || '';
          lyricsTitle = firstLyrics.title || '';
        }
      } else if (response.data.response?.text) {
        lyricsText = response.data.response.text;
        lyricsTitle = response.data.response.title || '';
      }
      
      await taskStore.updateTask(taskId, {
        status: localStatus,
        metadata: {
          lyrics: lyricsText,
          title: lyricsTitle,
          type: 'lyrics'
        },
        error: response.data.errorMessage
      });
    }
    
    return res.json(response);
  } catch (error) {
    logger.error('获取歌词详情失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 生成音乐
 */
router.post('/generate', async (req, res) => {
  try {
    const { customMode, instrumental, model, prompt, title, tags, negativeTags } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({
        code: 400,
        msg: 'model and prompt are required'
      });
    }
    
    const params = {
      customMode: customMode !== undefined ? customMode : false,
      instrumental: instrumental || false,
      model,
      prompt,
      title: title || '',
      tags: tags || '',
      negativeTags: negativeTags || '无',
      callBackUrl: `${process.env.CALLBACK_BASE_URL}/api/callback/music`
    };
    
    const response = await sunoApi.generateMusic(params);
    
    // 创建本地任务记录
    if (response.code === 200 && response.data?.taskId) {
      await taskStore.createTask(response.data.taskId, {
        prompt,
        title,
        tags,
        type: 'music'
      });
    }
    
    return res.json(response);
  } catch (error) {
    logger.error('生成音乐失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 延长音乐
 */
router.post('/extend', async (req, res) => {
  try {
    const { audioId, prompt, continueAt, tags, title } = req.body;

    if (!audioId) {
      return res.status(400).json({
        code: 400,
        msg: 'audioId is required'
      });
    }

    const params = {
      audioId,
      prompt: prompt || '',
      continueAt: continueAt || 0,
      tags: tags || '',
      title: title || '',
      callBackUrl: `${process.env.CALLBACK_BASE_URL}/api/callback/music`
    };

    const response = await sunoApi.extendMusic(params);

    if (response.code === 200 && response.data?.taskId) {
      await taskStore.createTask(response.data.taskId, {
        audioId,
        type: 'extend'
      });
    }

    return res.json(response);
  } catch (error) {
    logger.error('延长音乐失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 添加人声
 */
router.post('/add-vocals', async (req, res) => {
  try {
    const { uploadUrl, prompt, title, style, negativeTags, vocalGender, model } = req.body;

    if (!uploadUrl || !prompt || !style) {
      return res.status(400).json({
        code: 400,
        msg: 'uploadUrl, prompt and style are required'
      });
    }

    const params = {
      uploadUrl,
      prompt,
      title: title || '',
      style,
      negativeTags: negativeTags || '无',
      vocalGender: vocalGender || 'f',
      callBackUrl: `${process.env.CALLBACK_BASE_URL}/api/callback/music`
    };

    const response = await sunoApi.addVocals(params);

    if (response.code === 200 && response.data?.taskId) {
      await taskStore.createTask(response.data.taskId, {
        uploadUrl,
        type: 'vocals'
      });
    }

    return res.json(response);
  } catch (error) {
    logger.error('添加人声失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 添加伴奏
 */
router.post('/add-instrumental', async (req, res) => {
  try {
    const { uploadUrl, title, tags, negativeTags, model } = req.body;

    if (!uploadUrl || !tags) {
      return res.status(400).json({
        code: 400,
        msg: 'uploadUrl and tags are required'
      });
    }

    const params = {
      uploadUrl,
      title: title || '',
      tags,
      negativeTags: negativeTags || '无',
      callBackUrl: `${process.env.CALLBACK_BASE_URL}/api/callback/music`
    };

    const response = await sunoApi.addInstrumental(params);

    if (response.code === 200 && response.data?.taskId) {
      await taskStore.createTask(response.data.taskId, {
        uploadUrl,
        type: 'instrumental'
      });
    }

    return res.json(response);
  } catch (error) {
    logger.error('添加伴奏失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 获取任务状态
 */
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskStore.getTask(taskId);

    if (!task) {
      return res.status(404).json({
        code: 404,
        msg: 'Task not found'
      });
    }

    return res.json({
      code: 200,
      msg: 'success',
      data: task
    });
  } catch (error) {
    logger.error('获取任务失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 获取任务详情（从 Suno API）
 */
router.get('/task/:taskId/detail', async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await sunoApi.getTaskDetail(taskId);
    return res.json(response);
  } catch (error) {
    logger.error('获取任务详情失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 获取所有任务
 */
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await taskStore.getAllTasks();
    return res.json({
      code: 200,
      msg: 'success',
      data: tasks
    });
  } catch (error) {
    logger.error('获取任务列表失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

/**
 * 删除任务
 */
router.delete('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const deleted = await taskStore.deleteTask(taskId);

    if (!deleted) {
      return res.status(404).json({
        code: 404,
        msg: 'Task not found'
      });
    }

    return res.json({
      code: 200,
      msg: 'success'
    });
  } catch (error) {
    logger.error('删除任务失败', { error: error.message });
    return res.status(500).json({
      code: 500,
      msg: error.message || 'Internal server error'
    });
  }
});

module.exports = router;


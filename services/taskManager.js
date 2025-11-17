/**
 * 任务管理器 - 管理任务队列和状态
 */

const { v4: uuidv4 } = require('uuid');
const PQueue = require('p-queue').default;
const { TaskStatus, TaskType } = require('../types/task');
const sunoApi = require('./sunoApi');
const ossService = require('./ossService');
const callbackService = require('./callbackService');
const { logger } = require('../utils/logger');

class TaskManager {
  constructor() {
    // 内存任务队列
    this.tasks = new Map();
    
    // 创建并发队列，最多同时处理 10 个任务
    this.queue = new PQueue({
      concurrency: parseInt(process.env.MAX_CONCURRENCY || '10'),
      timeout: 600000, // 单个任务超时时间 10分钟
      throwOnTimeout: true
    });

    logger.info('TaskManager 初始化完成', {
      concurrency: this.queue.concurrency,
      timeout: '10分钟'
    });

    // 定期清理已完成的任务（5分钟后删除）
    setInterval(() => this.cleanupTasks(), 60000);
  }

  /**
   * 创建音乐生成任务（异步）
   * @param {object} request - 请求参数
   * @returns {Promise<object>} - 任务对象
   */
  async createMusicGenerationTask(request) {
    // 检查队列是否已满
    const maxQueueSize = parseInt(process.env.MAX_QUEUE_SIZE || '2500');
    if (this.queue.size + this.queue.pending >= maxQueueSize) {
      throw new Error(`队列已满，当前任务数: ${this.queue.size + this.queue.pending}，最大容量: ${maxQueueSize}`);
    }

    const task = {
      id: uuidv4(),
      status: TaskStatus.PENDING,
      type: TaskType.MUSIC_GENERATION,
      input: {
        customMode: request.customMode,
        instrumental: request.instrumental,
        model: request.model,
        prompt: request.prompt,
        title: request.title,
        tags: request.tags,
        negativeTags: request.negativeTags
      },
      callbackUrl: request.callbackUrl,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 存储任务
    this.tasks.set(task.id, task);

    // 添加到队列异步处理
    this.queue.add(() => this.processMusicGenerationTask(task.id));

    logger.info('音乐生成任务已创建', { 
      taskId: task.id, 
      queueSize: this.queue.size, 
      queuePending: this.queue.pending 
    });
    
    return task;
  }

  /**
   * 创建歌词生成任务（异步）
   * @param {object} request - 请求参数
   * @returns {Promise<object>} - 任务对象
   */
  async createLyricsGenerationTask(request) {
    const maxQueueSize = parseInt(process.env.MAX_QUEUE_SIZE || '2500');
    if (this.queue.size + this.queue.pending >= maxQueueSize) {
      throw new Error(`队列已满，当前任务数: ${this.queue.size + this.queue.pending}，最大容量: ${maxQueueSize}`);
    }

    const task = {
      id: uuidv4(),
      status: TaskStatus.PENDING,
      type: TaskType.LYRICS_GENERATION,
      input: {
        prompt: request.prompt
      },
      callbackUrl: request.callbackUrl,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.queue.add(() => this.processLyricsGenerationTask(task.id));

    logger.info('歌词生成任务已创建', { 
      taskId: task.id, 
      queueSize: this.queue.size, 
      queuePending: this.queue.pending 
    });
    
    return task;
  }

  /**
   * 创建添加人声任务（异步）
   * @param {object} request - 请求参数
   * @returns {Promise<object>} - 任务对象
   */
  async createAddVocalsTask(request) {
    const maxQueueSize = parseInt(process.env.MAX_QUEUE_SIZE || '2500');
    if (this.queue.size + this.queue.pending >= maxQueueSize) {
      throw new Error(`队列已满，当前任务数: ${this.queue.size + this.queue.pending}，最大容量: ${maxQueueSize}`);
    }

    const task = {
      id: uuidv4(),
      status: TaskStatus.PENDING,
      type: TaskType.ADD_VOCALS,
      input: {
        uploadUrl: request.uploadUrl,
        prompt: request.prompt,
        title: request.title,
        style: request.style,
        negativeTags: request.negativeTags,
        vocalGender: request.vocalGender
      },
      callbackUrl: request.callbackUrl,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.queue.add(() => this.processAddVocalsTask(task.id));

    logger.info('添加人声任务已创建', {
      taskId: task.id,
      queueSize: this.queue.size,
      queuePending: this.queue.pending
    });

    return task;
  }

  /**
   * 获取任务信息
   * @param {string} taskId - 任务ID
   * @returns {object|undefined} - 任务对象
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * 处理音乐生成任务
   * @param {string} taskId - 任务ID
   */
  async processMusicGenerationTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.error('任务不存在', { taskId });
      return;
    }

    // 用于跟踪 Suno 任务ID
    let sunoTaskId = null;

    try {
      // 1. 更新状态为处理中
      this.updateTask(taskId, {
        status: TaskStatus.PROCESSING,
        progress: 10
      });

      logger.info('开始处理音乐生成任务', { taskId });

      // 2. 调用 Suno API 生成音乐
      this.updateTask(taskId, { progress: 20 });
      const params = {
        customMode: task.input.customMode || false,
        instrumental: task.input.instrumental || false,
        model: task.input.model,
        prompt: task.input.prompt,
        title: task.input.title || '',
        tags: task.input.tags || '',
        negativeTags: task.input.negativeTags || '无',
        callBackUrl: `${process.env.CALLBACK_BASE_URL}/api/callback/music-internal`
      };

      const response = await sunoApi.generateMusic(params);

      if (response.code !== 200 || !response.data?.taskId) {
        throw new Error(response.msg || '调用Suno API失败');
      }

      sunoTaskId = response.data.taskId;
      logger.info('Suno API 调用成功', { taskId, sunoTaskId });

      // 3. 轮询 Suno 任务状态
      this.updateTask(taskId, { progress: 30, sunoTaskId });
      const sunoResult = await this.pollSunoTaskStatus(sunoTaskId, taskId);

      logger.info('Suno 任务完成', { taskId, sunoTaskId });

      // 4. 上传音频到 OSS
      this.updateTask(taskId, { progress: 70 });
      const clips = sunoResult.clips || [];
      const uploadedClips = [];

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        if (clip.audioUrl) {
          logger.info(`上传音频 ${i + 1}/${clips.length}`, { taskId, audioUrl: clip.audioUrl });
          const fileName = await ossService.uploadAudioFromUrl(clip.audioUrl, '.mp3');
          uploadedClips.push({
            ...clip,
            fileName,
            audioUrl: undefined // 移除原始URL，只保留文件名
          });
        }
      }

      logger.info('所有音频上传完成', { taskId, count: uploadedClips.length });

      // 5. 更新任务为完成
      const finalResult = {
        clips: uploadedClips,
        sunoTaskId
      };

      this.updateTask(taskId, {
        status: TaskStatus.COMPLETED,
        progress: 100,
        result: finalResult
      });

      logger.info('音乐生成任务处理完成', { taskId });

      // 6. 回调后端（只发送文件名）
      if (task.callbackUrl) {
        await this.notifyBackend(task, finalResult);
      }

    } catch (error) {
      // 错误处理
      logger.error('音乐生成任务处理失败', { taskId, error: error.message });

      this.updateTask(taskId, {
        status: TaskStatus.FAILED,
        progress: 0,
        error: error.message
      });

      // 回调后端通知失败
      if (task.callbackUrl) {
        await this.notifyBackend(task, null, error.message);
      }
    }
  }

  /**
   * 处理歌词生成任务
   * @param {string} taskId - 任务ID
   */
  async processLyricsGenerationTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.error('任务不存在', { taskId });
      return;
    }

    let sunoTaskId = null;

    try {
      this.updateTask(taskId, {
        status: TaskStatus.PROCESSING,
        progress: 10
      });

      logger.info('开始处理歌词生成任务', { taskId });

      // 调用 Suno API 生成歌词
      this.updateTask(taskId, { progress: 20 });
      const params = {
        prompt: task.input.prompt,
        callBackUrl: `${process.env.CALLBACK_BASE_URL}/api/callback/lyrics-internal`
      };

      const response = await sunoApi.generateLyrics(params);

      if (response.code !== 200 || !response.data?.taskId) {
        throw new Error(response.msg || '调用Suno API失败');
      }

      sunoTaskId = response.data.taskId;
      logger.info('Suno API 调用成功', { taskId, sunoTaskId });

      // 轮询 Suno 任务状态
      this.updateTask(taskId, { progress: 30, sunoTaskId });
      const sunoResult = await this.pollSunoLyricsStatus(sunoTaskId, taskId);

      logger.info('Suno 歌词任务完成', { taskId, sunoTaskId });

      // 更新任务为完成
      const finalResult = {
        lyrics: sunoResult.lyrics,
        title: sunoResult.title,
        sunoTaskId
      };

      this.updateTask(taskId, {
        status: TaskStatus.COMPLETED,
        progress: 100,
        result: finalResult
      });

      logger.info('歌词生成任务处理完成', { taskId });

      // 回调后端
      if (task.callbackUrl) {
        await this.notifyBackend(task, finalResult);
      }

    } catch (error) {
      logger.error('歌词生成任务处理失败', { taskId, error: error.message });

      this.updateTask(taskId, {
        status: TaskStatus.FAILED,
        progress: 0,
        error: error.message
      });

      if (task.callbackUrl) {
        await this.notifyBackend(task, null, error.message);
      }
    }
  }

  /**
   * 处理添加人声任务
   * @param {string} taskId - 任务ID
   */
  async processAddVocalsTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.error('任务不存在', { taskId });
      return;
    }

    let sunoTaskId = null;

    try {
      this.updateTask(taskId, {
        status: TaskStatus.PROCESSING,
        progress: 10
      });

      logger.info('开始处理添加人声任务', { taskId });

      // 调用 Suno API 添加人声
      this.updateTask(taskId, { progress: 20 });
      const params = {
        uploadUrl: task.input.uploadUrl,
        prompt: task.input.prompt,
        title: task.input.title || '',
        style: task.input.style,
        negativeTags: task.input.negativeTags || '无',
        vocalGender: task.input.vocalGender || 'f',
        callBackUrl: `${process.env.CALLBACK_BASE_URL}/api/callback/music-internal`
      };

      const response = await sunoApi.addVocals(params);

      if (response.code !== 200 || !response.data?.taskId) {
        throw new Error(response.msg || '调用Suno API失败');
      }

      sunoTaskId = response.data.taskId;
      logger.info('Suno API 调用成功', { taskId, sunoTaskId });

      // 轮询 Suno 任务状态
      this.updateTask(taskId, { progress: 30, sunoTaskId });
      const sunoResult = await this.pollSunoTaskStatus(sunoTaskId, taskId);

      logger.info('Suno 任务完成', { taskId, sunoTaskId });

      // 上传音频到 OSS
      this.updateTask(taskId, { progress: 70 });
      const clips = sunoResult.clips || [];
      const uploadedClips = [];

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        if (clip.audioUrl) {
          logger.info(`上传音频 ${i + 1}/${clips.length}`, { taskId, audioUrl: clip.audioUrl });
          const fileName = await ossService.uploadAudioFromUrl(clip.audioUrl, '.mp3');
          uploadedClips.push({
            ...clip,
            fileName,
            audioUrl: undefined
          });
        }
      }

      logger.info('所有音频上传完成', { taskId, count: uploadedClips.length });

      // 更新任务为完成
      const finalResult = {
        clips: uploadedClips,
        sunoTaskId
      };

      this.updateTask(taskId, {
        status: TaskStatus.COMPLETED,
        progress: 100,
        result: finalResult
      });

      logger.info('添加人声任务处理完成', { taskId });

      // 回调后端
      if (task.callbackUrl) {
        await this.notifyBackend(task, finalResult);
      }

    } catch (error) {
      logger.error('添加人声任务处理失败', { taskId, error: error.message });

      this.updateTask(taskId, {
        status: TaskStatus.FAILED,
        progress: 0,
        error: error.message
      });

      if (task.callbackUrl) {
        await this.notifyBackend(task, null, error.message);
      }
    }
  }

  /**
   * 轮询 Suno 任务状态（音乐生成）
   * @param {string} sunoTaskId - Suno任务ID
   * @param {string} localTaskId - 本地任务ID
   * @returns {Promise<object>} - Suno任务结果
   */
  async pollSunoTaskStatus(sunoTaskId, localTaskId) {
    const maxAttempts = 120; // 最多轮询120次（10分钟）
    const interval = 5000; // 每5秒轮询一次

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await sunoApi.getTaskDetail(sunoTaskId);

        if (response.code !== 200) {
          throw new Error(response.msg || '查询Suno任务失败');
        }

        const status = response.data?.status;
        const clips = response.data?.response?.data || [];

        logger.info(`轮询Suno任务状态 (${attempt}/${maxAttempts})`, {
          sunoTaskId,
          localTaskId,
          status
        });

        // 更新进度
        const progress = 30 + Math.min(40, Math.floor((attempt / maxAttempts) * 40));
        this.updateTask(localTaskId, { progress });

        // 检查是否完成
        if (status === 'SUCCESS') {
          return { clips };
        }

        // 检查是否失败
        if (status && status.includes('FAILED')) {
          throw new Error(`Suno任务失败: ${response.data?.errorMessage || status}`);
        }

        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, interval));

      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        logger.warn(`轮询Suno任务出错，继续重试`, {
          sunoTaskId,
          attempt,
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Suno任务超时');
  }

  /**
   * 轮询 Suno 歌词任务状态
   * @param {string} sunoTaskId - Suno任务ID
   * @param {string} localTaskId - 本地任务ID
   * @returns {Promise<object>} - Suno任务结果
   */
  async pollSunoLyricsStatus(sunoTaskId, localTaskId) {
    const maxAttempts = 60; // 最多轮询60次（5分钟）
    const interval = 5000; // 每5秒轮询一次

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await sunoApi.getLyricsDetail(sunoTaskId);

        if (response.code !== 200) {
          throw new Error(response.msg || '查询Suno歌词任务失败');
        }

        const status = response.data?.status;

        logger.info(`轮询Suno歌词任务状态 (${attempt}/${maxAttempts})`, {
          sunoTaskId,
          localTaskId,
          status
        });

        // 更新进度
        const progress = 30 + Math.min(40, Math.floor((attempt / maxAttempts) * 40));
        this.updateTask(localTaskId, { progress });

        // 检查是否完成
        if (status === 'TEXT_SUCCESS' || status === 'SUCCESS') {
          let lyricsText = '';
          let lyricsTitle = '';

          // 提取歌词
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

          return { lyrics: lyricsText, title: lyricsTitle };
        }

        // 检查是否失败
        if (status && status.includes('FAILED')) {
          throw new Error(`Suno歌词任务失败: ${response.data?.errorMessage || status}`);
        }

        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, interval));

      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        logger.warn(`轮询Suno歌词任务出错，继续重试`, {
          sunoTaskId,
          attempt,
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Suno歌词任务超时');
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {object} updates - 更新内容
   */
  updateTask(taskId, updates) {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates, { updatedAt: new Date() });
      this.tasks.set(taskId, task);
    }
  }

  /**
   * 通知后端
   * @param {object} task - 任务对象
   * @param {object} result - 结果数据
   * @param {string} error - 错误信息
   */
  async notifyBackend(task, result, error) {
    const payload = {
      taskId: task.id,
      taskType: task.type,
      status: task.status,
      result,
      error,
      completedAt: new Date().toISOString()
    };

    await callbackService.notifyBackend(task.callbackUrl, payload);
  }

  /**
   * 清理已完成的任务
   */
  cleanupTasks() {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 5 * 60 * 1000; // 5分钟

    for (const [taskId, task] of this.tasks.entries()) {
      const isCompleted = task.status === TaskStatus.COMPLETED ||
                         task.status === TaskStatus.FAILED;
      const isOld = now - task.updatedAt.getTime() > CLEANUP_THRESHOLD;

      if (isCompleted && isOld) {
        this.tasks.delete(taskId);
        logger.info('任务已清理', { taskId });
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      total: this.tasks.size,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      queueSize: this.queue.size,
      queuePending: this.queue.pending
    };

    for (const task of this.tasks.values()) {
      switch (task.status) {
        case TaskStatus.PENDING:
          stats.pending++;
          break;
        case TaskStatus.PROCESSING:
          stats.processing++;
          break;
        case TaskStatus.COMPLETED:
          stats.completed++;
          break;
        case TaskStatus.FAILED:
          stats.failed++;
          break;
      }
    }

    return stats;
  }
}

// 导出单例
module.exports = new TaskManager();


/**
 * Suno API 客户端服务
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class SunoApiService {
  constructor() {
    this.apiKey = '';
    this.client = null;
  }

  /**
   * 确保 API 客户端已初始化
   */
  ensureInitialized() {
    if (!this.apiKey) {
      this.apiKey = process.env.SUNO_API_KEY || '';
      const baseURL = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org/api/v1';

      if (!this.apiKey) {
        logger.error('⚠️  SUNO_API_KEY 未配置！');
        throw new Error('SUNO_API_KEY is required');
      }

      logger.info(`✅ Suno API 已初始化: ${this.apiKey.substring(0, 8)}...`);

      this.client = axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
    }
  }

  /**
   * 生成音乐
   */
  async generateMusic(params) {
    this.ensureInitialized();

    try {
      logger.info('🎵 调用 Suno API /generate', { params });
      const response = await this.client.post('/generate', params);
      logger.info('✅ Suno API 响应', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('❌ 生成音乐失败', {
        error: error.response?.data || error.message
      });
      throw new Error(error.response?.data?.msg || 'Failed to generate music');
    }
  }

  /**
   * 延长音乐
   */
  async extendMusic(params) {
    this.ensureInitialized();

    try {
      logger.info('🎵 调用 Suno API /generate/extend', { params });
      const response = await this.client.post('/generate/extend', params);
      logger.info('✅ Suno API 响应', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('❌ 延长音乐失败', {
        error: error.response?.data || error.message
      });
      throw new Error(error.response?.data?.msg || 'Failed to extend music');
    }
  }

  /**
   * 添加人声
   */
  async addVocals(params) {
    this.ensureInitialized();

    try {
      logger.info('🎤 调用 Suno API /generate/add-vocals', { params });
      const response = await this.client.post('/generate/add-vocals', params);
      logger.info('✅ Suno API 响应', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('❌ 添加人声失败', {
        error: error.response?.data || error.message
      });
      throw new Error(error.response?.data?.msg || 'Failed to add vocals');
    }
  }

  /**
   * 添加伴奏
   */
  async addInstrumental(params) {
    this.ensureInitialized();

    try {
      logger.info('🎹 调用 Suno API /generate/add-instrumental', { params });
      const response = await this.client.post('/generate/add-instrumental', params);
      logger.info('✅ Suno API 响应', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('❌ 添加伴奏失败', {
        error: error.response?.data || error.message
      });
      throw new Error(error.response?.data?.msg || 'Failed to add instrumental');
    }
  }

  /**
   * 生成歌词
   */
  async generateLyrics(params) {
    this.ensureInitialized();
    
    try {
      logger.info('📝 调用 Suno API /lyrics', { params });
      const response = await this.client.post('/lyrics', params);
      logger.info('✅ Suno API 响应', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('❌ 生成歌词失败', { 
        error: error.response?.data || error.message 
      });
      throw new Error(error.response?.data?.msg || 'Failed to generate lyrics');
    }
  }

  /**
   * 获取歌词详情
   */
  async getLyricsDetail(taskId) {
    this.ensureInitialized();
    
    try {
      logger.info('🔍 查询歌词详情', { taskId });
      const response = await this.client.get('/lyrics/record-info', {
        params: { taskId }
      });
      logger.info('✅ 歌词详情响应', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('❌ 获取歌词详情失败', { 
        error: error.response?.data || error.message 
      });
      throw new Error(error.response?.data?.msg || 'Failed to get lyrics detail');
    }
  }

  /**
   * 获取任务详情
   */
  async getTaskDetail(taskId) {
    this.ensureInitialized();

    try {
      logger.info('🔍 查询任务详情', { taskId });
      const response = await this.client.get('/generate/record-info', {
        params: { taskId }
      });
      logger.info('✅ 任务详情响应', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('❌ 获取任务详情失败', {
        error: error.response?.data || error.message
      });
      throw new Error(error.response?.data?.msg || 'Failed to get task detail');
    }
  }
}

// 导出单例
module.exports = new SunoApiService();


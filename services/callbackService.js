/**
 * 回调服务 - 负责通知后端
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class CallbackService {
  constructor() {
    // 从环境变量读取回调超时配置，如果未配置则使用默认值
    this.callbackTimeout = parseInt(process.env.CALLBACK_TIMEOUT || '10000', 10);

    logger.info('Callback Service 初始化完成', {
      callbackTimeout: `${this.callbackTimeout}ms`
    });
  }

  /**
   * 通知后端任务完成
   * @param {string} callbackUrl - 回调URL
   * @param {object} payload - 回调数据
   */
  async notifyBackend(callbackUrl, payload) {
    logger.info(`📤 开始回调后端: ${callbackUrl}`, {
      taskType: payload.taskType,
      taskId: payload.taskId,
      status: payload.status
    });

    try {
      const response = await axios.post(callbackUrl, payload, {
        timeout: this.callbackTimeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Music-Middleware/1.0'
        }
      });

      logger.info(`✅ 回调后端成功: ${callbackUrl}`, {
        taskType: payload.taskType,
        taskId: payload.taskId,
        statusCode: response.status,
        responseData: response.data
      });

    } catch (error) {
      logger.error(`❌ 回调后端失败: ${callbackUrl}`, {
        taskType: payload.taskType,
        taskId: payload.taskId,
        error: error.message,
        stack: error.stack
      });

      // 回调失败不影响任务状态，只记录日志
      // 后端可以通过查询接口获取结果
    }
  }
}

// 导出单例
module.exports = new CallbackService();


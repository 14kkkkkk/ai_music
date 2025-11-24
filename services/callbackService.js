/**
 * 回调服务 - 负责通知后端
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class CallbackService {
  constructor() {
    // 从环境变量读取回调超时配置，如果未配置则使用默认值
    this.callbackTimeout = parseInt(process.env.CALLBACK_TIMEOUT || '30000', 10); // 增加到30秒
    this.maxRetries = parseInt(process.env.CALLBACK_MAX_RETRIES || '3', 10); // 最多重试3次
    this.retryDelay = parseInt(process.env.CALLBACK_RETRY_DELAY || '2000', 10); // 重试延迟2秒

    logger.info('Callback Service 初始化完成', {
      callbackTimeout: `${this.callbackTimeout}ms`,
      maxRetries: this.maxRetries,
      retryDelay: `${this.retryDelay}ms`
    });
  }

  /**
   * 通知后端任务完成
   * @param {string} callbackUrl - 回调URL
   * @param {object} payload - 回调数据
   */
  async notifyBackend(callbackUrl, payload) {
    logger.info(`📤 开始回调后端: ${callbackUrl}`, {
      taskId: payload.taskId,
      status: payload.status,
      metadataType: payload.metadata?.type,
      payloadSize: JSON.stringify(payload).length
    });

    // 带重试的回调
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await axios.post(callbackUrl, payload, {
          timeout: this.callbackTimeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Music-Middleware/1.0'
          },
          // 添加这些选项来处理 ECONNRESET
          httpsAgent: new (require('https').Agent)({
            keepAlive: true,
            rejectUnauthorized: false // 如果是自签名证书,设置为 false
          })
        });
        const duration = Date.now() - startTime;

        logger.info(`✅ 回调后端成功: ${callbackUrl}`, {
          taskId: payload.taskId,
          metadataType: payload.metadata?.type,
          statusCode: response.status,
          duration: `${duration}ms`,
          attempt: attempt > 1 ? `第${attempt}次尝试` : '首次尝试',
          responseData: response.data
        });

        return; // 成功后直接返回

      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries;

        // 详细的错误信息
        const errorDetails = {
          taskId: payload.taskId,
          metadataType: payload.metadata?.type,
          attempt: `${attempt}/${this.maxRetries}`,
          error: error.message,
          code: error.code,
          statusCode: error.response?.status,
          responseData: error.response?.data
        };

        // 判断是否需要重试
        const shouldRetry = !isLastAttempt && this.shouldRetryError(error);

        if (shouldRetry) {
          logger.warn(`⚠️ 回调后端失败,准备重试: ${callbackUrl}`, errorDetails);
          await this.sleep(this.retryDelay * attempt); // 指数退避
          continue;
        }

        // 最后一次尝试失败,记录详细错误
        logger.error(`❌ 回调后端失败(已重试${this.maxRetries}次): ${callbackUrl}`, errorDetails);

        // 根据错误类型给出具体建议
        if (error.code === 'ECONNRESET') {
          logger.error('🔴 连接被重置(ECONNRESET)', {
            原因: '中台接口在接收数据时主动断开连接',
            可能的问题: [
              '1. 中台接口返回了错误(400/500)',
              '2. 中台接口处理时间过长',
              '3. 中台接口不接受这种数据格式',
              '4. 中台有防火墙/安全策略阻止',
              '5. SSL/TLS 握手问题'
            ],
            建议: [
              '1. 检查中台日志,查看是否有错误',
              '2. 使用 curl 测试中台接口是否正常',
              '3. 检查数据格式是否符合中台要求',
              '4. 联系中台开发人员确认接口状态'
            ]
          });
        } else if (error.code === 'ENOTFOUND') {
          logger.error('DNS 解析失败,请检查回调地址是否正确', { callbackUrl });
        } else if (error.code === 'ECONNREFUSED') {
          logger.error('连接被拒绝,请检查回调服务是否运行', { callbackUrl });
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          logger.error(`回调超时(${this.callbackTimeout}ms),请检查回调接口响应速度`, { callbackUrl });
        } else if (error.response) {
          logger.error('回调接口返回错误', {
            statusCode: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        }

        // 回调失败不影响任务状态，只记录日志
        // 后端可以通过查询接口获取结果
        return;
      }
    }
  }

  /**
   * 判断错误是否应该重试
   * @param {Error} error - 错误对象
   * @returns {boolean} - 是否应该重试
   */
  shouldRetryError(error) {
    // 这些错误应该重试
    const retryableErrors = [
      'ECONNRESET',    // 连接被重置
      'ETIMEDOUT',     // 超时
      'ECONNABORTED',  // 连接中止
      'ENOTFOUND',     // DNS 解析失败(可能是临时的)
      'EAI_AGAIN'      // DNS 临时失败
    ];

    // 这些 HTTP 状态码应该重试
    const retryableStatusCodes = [
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504  // Gateway Timeout
    ];

    // 检查错误代码
    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    // 检查 HTTP 状态码
    if (error.response && retryableStatusCodes.includes(error.response.status)) {
      return true;
    }

    return false;
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
module.exports = new CallbackService();


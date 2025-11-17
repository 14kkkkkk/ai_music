/**
 * OSS上传服务 - 负责文件上传到OSS
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

class OSSService {
  constructor() {
    this.signedUrlApi = process.env.OSS_SIGNED_URL_API || 'https://ai.mediaio.net/api/v1/ai/signed-upload-url';
    this.uploadTimeout = parseInt(process.env.OSS_UPLOAD_TIMEOUT || '60000', 10);

    logger.info('OSS Service 初始化完成', {
      signedUrlApi: this.signedUrlApi,
      uploadTimeout: `${this.uploadTimeout}ms`
    });
  }

  /**
   * 生成文件的 MD5 哈希值作为文件名
   * @param {string} filePath - 文件路径
   * @param {string} fileExtension - 文件扩展名（包含点，如 .mp3）
   * @returns {Promise<string>} - MD5 文件名
   */
  async generateMD5FileName(filePath, fileExtension) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        const md5Hash = hash.digest('hex');
        const fileName = `${md5Hash}${fileExtension}`;
        logger.info('生成MD5文件名', { filePath, fileName, md5: md5Hash });
        resolve(fileName);
      });

      stream.on('error', (error) => {
        logger.error('生成MD5文件名失败', { filePath, error: error.message });
        reject(error);
      });
    });
  }

  /**
   * 使用原生 https 模块上传文件到 OSS
   * @param {string} signedUrl - 签名 URL
   * @param {string} filePath - 本地文件路径
   * @returns {Promise<boolean>} - 上传是否成功
   */
  async uploadToOSSWithNativeHttp(signedUrl, filePath) {
    return new Promise((resolve, reject) => {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        reject(new Error(`文件不存在: ${filePath}`));
        return;
      }

      // 获取文件大小
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      // 解析 URL
      const urlObj = new URL(signedUrl);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      // 创建文件流
      const fileStream = fs.createReadStream(filePath);

      // 构造请求选项（只添加 Content-Length）
      const options = {
        method: 'PUT',
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        headers: {
          'Content-Length': fileSize
        }
      };

      logger.info('开始上传到 OSS', {
        hostname: urlObj.hostname,
        fileSize,
        sizeMB: (fileSize / 1024 / 1024).toFixed(2) + ' MB'
      });

      const req = httpModule.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            logger.info('✅ OSS 上传成功', { statusCode: res.statusCode });
            resolve(true);
          } else {
            logger.error('❌ OSS 上传失败', {
              statusCode: res.statusCode,
              statusMessage: res.statusMessage,
              responseData
            });
            reject(new Error(`上传失败，状态码: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        logger.error('❌ OSS 上传请求错误', { error: error.message });
        reject(error);
      });

      // 管道文件流到请求
      fileStream.pipe(req);

      fileStream.on('error', (error) => {
        logger.error('❌ 文件流错误', { error: error.message });
        reject(error);
      });
    });
  }

  /**
   * 获取签名上传URL
   * @param {string} fileName - 文件名
   * @returns {Promise<string>} - 签名URL
   */
  async getSignedUploadUrl(fileName) {
    try {
      logger.info('请求签名上传URL', { fileName });

      // 构造完整的 URL
      const url = `${this.signedUrlApi}?fileName=${encodeURIComponent(fileName)}`;

      // 使用 axios 发送请求
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      // 检查状态码
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.data}`);
      }

      // 获取签名 URL
      const signedUrl = response.data?.signedUrl;

      if (!signedUrl) {
        throw new Error('签名URL响应中缺少signedUrl字段');
      }

      logger.info('获取签名URL成功', { fileName, signedUrl: signedUrl.substring(0, 50) + '...' });
      return signedUrl;

    } catch (error) {
      logger.error('获取签名URL失败', { fileName, error: error.message });
      throw new Error(`获取签名URL失败: ${error.message}`);
    }
  }

  /**
   * 上传本地文件到OSS
   * @param {string} localFilePath - 本地文件路径
   * @param {string} customFileName - 自定义文件名（可选，不传则使用MD5生成）
   * @returns {Promise<string>} - 上传后的文件名
   */
  async uploadLocalFile(localFilePath, customFileName) {
    try {
      if (!fs.existsSync(localFilePath)) {
        throw new Error(`本地文件不存在: ${localFilePath}`);
      }

      // 获取文件扩展名
      const fileExtension = path.extname(localFilePath);

      // 生成文件名（优先使用自定义文件名，否则使用MD5）
      let fileName;
      if (customFileName) {
        fileName = customFileName;
      } else {
        // 使用 MD5 生成文件名
        fileName = await this.generateMD5FileName(localFilePath, fileExtension);
      }

      logger.info('开始上传本地文件', { localFilePath, fileName });

      // 1. 获取签名URL
      const signedUrl = await this.getSignedUploadUrl(fileName);

      // 2. 使用原生 https 模块上传到 OSS
      await this.uploadToOSSWithNativeHttp(signedUrl, localFilePath);

      const fileSize = fs.statSync(localFilePath).size;
      logger.info('✅ 本地文件上传成功', { fileName, size: fileSize });
      return fileName;

    } catch (error) {
      logger.error('❌ 本地文件上传失败', { localFilePath, error: error.message });
      throw new Error(`上传本地文件失败: ${error.message}`);
    }
  }

  /**
   * 从URL下载音频并上传到OSS
   * @param {string} audioUrl - 音频的URL地址
   * @param {string} fileExtension - 文件扩展名（如 .mp3）
   * @returns {Promise<string>} - 上传后的文件名
   */
  async uploadAudioFromUrl(audioUrl, fileExtension = '.mp3') {
    let tempFilePath = null;

    try {
      logger.info('开始从URL下载并上传音频', { audioUrl });

      // 1. 先下载音频到临时文件
      const tempDir = process.env.TEMP_DIR || './temp_audio';

      // 确保临时目录存在
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      tempFilePath = path.join(tempDir, `temp_${uuidv4()}${fileExtension}`);

      logger.info('📥 步骤1: 下载音频到临时文件', { tempFilePath, audioUrl });

      const downloadResponse = await axios.get(audioUrl, {
        responseType: 'stream',
        timeout: this.uploadTimeout
      });

      const writer = fs.createWriteStream(tempFilePath);
      downloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });

      const fileSize = fs.statSync(tempFilePath).size;
      logger.info('✅ 音频下载完成', {
        tempFilePath,
        size: fileSize,
        sizeMB: (fileSize / 1024 / 1024).toFixed(2) + ' MB'
      });

      // 2. 生成 MD5 文件名
      const fileName = await this.generateMD5FileName(tempFilePath, fileExtension);
      logger.info('📤 步骤2: 生成MD5文件名', { fileName });

      // 3. 获取签名URL
      logger.info('📤 步骤3: 获取OSS签名URL', { fileName });
      const signedUrl = await this.getSignedUploadUrl(fileName);

      // 4. 使用原生 https 模块上传到 OSS
      logger.info('☁️  步骤4: 上传音频到OSS', { fileName });
      await this.uploadToOSSWithNativeHttp(signedUrl, tempFilePath);

      logger.info('✅ 音频上传成功', { fileName });
      return fileName;

    } catch (error) {
      logger.error('❌ 音频上传失败', { error: error.message });
      throw new Error(`上传音频失败: ${error.message}`);
    } finally {
      // 5. 清理临时文件（上传成功或失败都会删除）
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          logger.info('🗑️  临时音频文件已删除', { tempFilePath });
        } catch (error) {
          logger.error('删除临时音频文件失败', { tempFilePath, error: error.message });
        }
      }
    }
  }

  /**
   * 删除本地临时文件
   * @param {string} filePath - 文件路径
   */
  deleteLocalFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('本地文件已删除', { filePath });
      }
    } catch (error) {
      logger.error('删除本地文件失败', { filePath, error: error.message });
    }
  }
}

// 导出单例
module.exports = new OSSService();


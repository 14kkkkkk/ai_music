/**
 * 任务存储服务
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

class TaskStore {
  constructor() {
    this.tasks = new Map();
    this.dataFile = path.join(__dirname, '../data/tasks.json');
    this.initialized = false;
  }

  /**
   * 初始化 - 从文件加载任务
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.load();
      this.initialized = true;
      logger.info(`📦 加载了 ${this.tasks.size} 个任务`);
    } catch (error) {
      logger.error('初始化任务存储失败', { error: error.message });
      this.initialized = true; // 即使失败也标记为已初始化
    }
  }

  /**
   * 从文件加载任务
   */
  async load() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      const tasksObj = JSON.parse(data);
      
      this.tasks.clear();
      Object.entries(tasksObj).forEach(([taskId, task]) => {
        this.tasks.set(taskId, task);
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('任务文件不存在，创建新文件');
        await this.save();
      } else {
        throw error;
      }
    }
  }

  /**
   * 保存任务到文件
   */
  async save() {
    try {
      const tasksObj = {};
      this.tasks.forEach((task, taskId) => {
        tasksObj[taskId] = task;
      });
      
      await fs.writeFile(
        this.dataFile,
        JSON.stringify(tasksObj, null, 2),
        'utf-8'
      );
    } catch (error) {
      logger.error('保存任务失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建任务
   */
  async createTask(taskId, metadata = {}) {
    await this.initialize();
    
    const task = {
      task_id: taskId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clips: [],
      metadata
    };
    
    this.tasks.set(taskId, task);
    await this.save();
    
    logger.info('创建任务', { taskId, metadata });
    return task;
  }

  /**
   * 更新任务
   */
  async updateTask(taskId, data) {
    await this.initialize();
    
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.warn('任务不存在', { taskId });
      return null;
    }
    
    const updatedTask = {
      ...task,
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.tasks.set(taskId, updatedTask);
    await this.save();
    
    logger.info('更新任务', { taskId, data });
    return updatedTask;
  }

  /**
   * 获取任务
   */
  async getTask(taskId) {
    await this.initialize();
    return this.tasks.get(taskId) || null;
  }

  /**
   * 获取所有任务
   */
  async getAllTasks() {
    await this.initialize();
    return Array.from(this.tasks.values());
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId) {
    await this.initialize();
    
    const deleted = this.tasks.delete(taskId);
    if (deleted) {
      await this.save();
      logger.info('删除任务', { taskId });
    }
    
    return deleted;
  }

  /**
   * 清空所有任务
   */
  async clearAll() {
    await this.initialize();
    
    this.tasks.clear();
    await this.save();
    
    logger.info('清空所有任务');
  }
}

// 导出单例
module.exports = new TaskStore();


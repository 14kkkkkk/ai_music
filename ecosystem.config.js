/**
 * PM2 配置文件
 * 用于生产环境部署
 *
 * 注意：音乐服务不需要文件服务器（所有文件直接上传到 OSS）
 */

module.exports = {
  apps: [
    {
      name: 'ai-music-service',
      script: './index.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};


module.exports = {
  apps: [
    {
      name: 'bniwedding-backend',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 6137,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 6137,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // 如果使用 TypeScript 直接運行（開發模式）
      // script: 'tsx',
      // args: 'src/index.ts',
    },
  ],
};

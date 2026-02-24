module.exports = {
  apps: [
    {
      name: 'bniwedding-backend',
      // 直接運行 TypeScript，無需編譯
      // 使用 npx 確保能找到項目中的 tsx
      script: 'npx',
      args: 'tsx src/index.ts',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false, // 設為 true 可自動重載（但建議使用 nodemon 開發）
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
      // 如果需要監聽文件變化自動重載（開發模式）
      // watch: ['src'],
      // ignore_watch: ['node_modules', 'logs', 'uploads', 'dist'],
    },
  ],
};

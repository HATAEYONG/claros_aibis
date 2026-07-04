/**
 * PM2 Configuration File
 * AI & BI DeepSeeHub Platform - Backend
 *
 * 사용법:
 * pm2 start ecosystem.config.js
 * pm2 restart deepseehub-backend
 * pm2 stop deepseehub-backend
 * pm2 logs deepseehub-backend
 * pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'deepseehub-backend',
      script: './dist/index.js',
      cwd: '/var/www/deepseehub/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exec_mode: 'fork',

      // 환경 변수
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },

      // 개발 환경 (필요한 경우)
      env_development: {
        NODE_ENV: 'development',
        PORT: 8000
      },

      // 로그 설정
      error_file: '/var/log/pm2/deepseehub-backend-error.log',
      out_file: '/var/log/pm2/deepseehub-backend-out.log',
      log_file: '/var/log/pm2/deepseehub-backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 프로세스 관리
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],

  // 배포 설정 (선택사항)
  deploy: {
    production: {
      user: 'ubuntu',
      host: '3.36.114.58',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/var/www/deepseehub/backend',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};

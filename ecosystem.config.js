module.exports = {
  apps: [{
    name: 'kost-management',
    script: 'tsx',
    args: 'server/_core/index.ts',
    cwd: '/var/www/kost-management',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};

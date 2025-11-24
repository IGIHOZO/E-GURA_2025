{
  "apps": [
    {
      "name": "egura-backend",
      "script": "index.js",
      "cwd": "/var/www/egura/backend",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production"
      },
      "error_file": "/var/www/egura/backend/logs/error.log",
      "out_file": "/var/www/egura/backend/logs/out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "max_memory_restart": "500M",
      "autorestart": true,
      "watch": false,
      "max_restarts": 10,
      "min_uptime": "10s"
    }
  ]
}

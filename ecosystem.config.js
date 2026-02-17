module.exports = {
  apps: [
    {
      name: "egura-backend",
      cwd: "/var/www/egura/backend",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};

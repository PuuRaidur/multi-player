module.exports = {
  apps: [
    {
      name: "server",
      script: "server.js",
      cwd: "./server"
    },
    {
      name: "client",
      script: "serve",
      env: {
        PM2_SERVE_PATH: "./client/dist",
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: "true",
        VITE_SERVER_URL: "http://localhost:3100"
      }
    }
  ]
};
module.exports = {
  apps: [
    {
      name: "talabat-api",
      script: "./src/server.js",
      instances: "max", // PM2 will run as many instances as there are CPU cores
      exec_mode: "cluster", // Enables PM2's built-in load balancer across the cores
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};

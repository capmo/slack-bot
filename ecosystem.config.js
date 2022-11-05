module.exports = {
  apps: [
    {
      name: "capmo.bot",
      script: "src/bot.ts",
      interpreter: "node",
      instances: 1,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

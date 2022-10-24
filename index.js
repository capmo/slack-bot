const { SlackAdapter } = require("botbuilder-adapter-slack");
const { Botkit } = require("botkit");

const adapter = new SlackAdapter({
  clientSigningSecret: "293952de6d72c280b370fc26fd3dcbd5", //process.env.SLACK_SECRET,
  botToken: "xoxb-256079704966-4256116422902-ZGhwbVs6j84YlsBnJTX9hDcW", //process.env.SLACK_TOKEN,
});

console.log("adapter", adapter);

// const controller = new Botkit({
//   adapter: adapter,
// });

// controller.on("message", async (bot, message) => {
//   await bot.reply(message, "I heard a message!");
// });

//  __   __  ___        ___
// |__) /  \  |  |__/ |  |
// |__) \__/  |  |  \ |  |

// This is the main file for the Capmo Slack bot.

const { Botkit } = require("botkit");
const greetings = require("random-greetings");
const axios = require("axios");
const {
  SlackAdapter,
  SlackMessageTypeMiddleware,
} = require("botbuilder-adapter-slack");
const {
  pickFromSubteam,
  pickFromCurrentChannel,
  createSurpriseChannel,
} = require("./utils");

require("dotenv").config();

async function getBotUserId() {
  const response = await axios.get("https://slack.com/api/auth.test", {
    headers: {
      Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    },
  });
  return response.data.user_id;
}

const botId = getBotUserId();

const adapter = new SlackAdapter({
  clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
  botToken: process.env.BOT_TOKEN,
  getTokenForTeam: {},
  getBotUserByTeam: {},
});

adapter.use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
  webhook_uri: "/api/messages",
  adapter,
});

// Handle commands directed at the bot
controller.on("direct_message,direct_mention,mention", async (bot, message) => {
  // Hello
  if (message.text.includes("hello") || message.text.includes("hi")) {
    await bot.reply(message, greetings.greet());
    return;
  }

  // Help / Commands
  if (message.text.includes("help") || message.text.includes("commands")) {
    const messages = [
      "Hello!",
      "",
      "I'm Capmo's Slack bot :robot_face:",
      "I can help you with the following commands:",
      "",
      "\t• `help` or `commands` - I'll show you this list of commands",
      "\t• `test account` - I'll tell you how to create a test account for our Dev/Staging environments",
      "\t• `pick` - I'll pick a random member from the current channel or from a subteam if you mention it (e.g. `pick @mobile`)",
      "\t• `surprise <user>` - I'll create a channel inviting every member of #general but not the mentioned user. You could use this to organize a surprise party/initiative for someone! (e.g. `surprise @john`)",
      "\t\t*Note: Use this command in a channel the person you want to surprise is not a member of... or send me a direct message :grin:*",
      "",
      "",
      "I'm still learning, so if you have any suggestions, please <https://github.com/capmo/slack-bot/issues/new/choose | let me know> :pray:",
    ];
    await bot.reply(message, messages.join("\n"));
    return;
  }

  // Create channel with everyone in #general but the mentioned user
  if (message.text.includes("surprise")) {
    if (!message.text.includes("<@")) {
      await bot.reply(
        message,
        "Please mention a user you want to skip in the new channel."
      );
    } else {
      // Get last match of <@user> in message
      const mentionedUser = message.text
        .match(/<@[^>]*>/g)
        .pop()
        .slice(2, -1);

      createSurpriseChannel(mentionedUser, message, bot);
    }
    return;
  }

  // Instructions to create test account
  if (message.text.includes("test account")) {
    const messages = [
      "To create a test account, please follow these steps:",
      "",
      "1. Go to https://app.dev.capmo.de/signup or https://app.staging.capmo.de/signup",
      "2. Enter your details",
      "3. Click on the link in the email you receive",
      "",
      "You can use your Campo account to create multiple test accounts using aliases.",
      "For example, if your email address is `name.surname@capmo.de`",
      "You can add `+test1` to the end of your email address to create a new test account:",
      "`name.surname+test1@capmo.de`",
    ];
    await bot.reply(message, messages.join("\n"));
    return;
  }

  // Pick user
  if (message.text.includes("pick")) {
    if (message.text.includes("<!subteam^")) {
      await pickFromSubteam(message, botId, bot);
    } else {
      await pickFromCurrentChannel(message, botId, bot);
    }
    return;
  }

  // Default
  await bot.reply(
    message,
    "Sorry, I don't understand. Please type `help` or `commands` to see what I can do."
  );
});

controller.webserver.get("/", (req, res) => {
  res.send(`This app is running Botkit ${controller.version}.`);
});

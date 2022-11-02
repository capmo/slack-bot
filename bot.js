//  __   __  ___        ___
// |__) /  \  |  |__/ |  |
// |__) \__/  |  |  \ |  |

// This is the main file for the Capmo Slack bot.

// Import Botkit's core features
const { Botkit } = require("botkit");
const { BotkitCMSHelper } = require("botkit-plugin-cms");
const greetings = require("random-greetings");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Import a platform-specific adapter for slack.

const {
  SlackAdapter,
  SlackMessageTypeMiddleware,
  SlackEventMiddleware,
} = require("botbuilder-adapter-slack");

const { MongoDbStorage } = require("botbuilder-storage-mongodb");

// Load process.env values from .env file
require("dotenv").config();

let storage = null;
if (process.env.MONGO_URI) {
  storage = mongoStorage = new MongoDbStorage({
    url: process.env.MONGO_URI,
  });
}

const adapter = new SlackAdapter({
  // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
  //   enable_incomplete: true,

  // parameters used to secure webhook endpoint
  verificationToken: process.env.VERIFICATION_TOKEN,
  clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,

  // auth token for a single-team app
  botToken: process.env.BOT_TOKEN,

  // credentials used to set up oauth for multi-team apps
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scopes: ["bot"],
  redirectUri: process.env.REDIRECT_URI,

  // functions required for retrieving team-specific info
  // for use in multi-team apps
  getTokenForTeam: getTokenForTeam,
  getBotUserByTeam: getBotUserByTeam,
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
// adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
  webhook_uri: "/api/messages",

  adapter: adapter,

  storage,
});

// if (process.env.CMS_URI) {
//   controller.usePlugin(
//     new BotkitCMSHelper({
//       uri: process.env.CMS_URI,
//       token: process.env.CMS_TOKEN,
//     })
//   );
// }

// // Once the bot has booted up its internal services, you can use them to do stuff.
// controller.ready(() => {
//   // load traditional developer-created local custom feature modules
//   //   controller.loadModules(__dirname + "/features");

//   /* catch-all that uses the CMS to trigger dialogs */
//   if (controller.plugins.cms) {
//     // controller.on("message,direct_message", async (bot, message) => {
//     //   let results = false;
//     //   //   results = await controller.plugins.cms.testTrigger(bot, message);
//     //   if (results !== false) {
//     //     // do not continue middleware!
//     //     return false;
//     //   }
//     // });
//   }
// });

// Handle commands directed at the bot
controller.on("direct_message,direct_mention,mention", async (bot, message) => {
  // Hello
  if (message.text.includes("hello") || message.text.includes("hi")) {
    await bot.reply(message, greetings.greet());
  }
  // Help / Commands
  if (message.text.includes("help") || message.text.includes("commands")) {
    const messages = [
      "Hello!",
      "I'm Capmo's Slack bot. I can help you with the following commands:",
      "",
      "- `hello` - I'll say hello back to you",
      "- `help` or `commands` - I'll show you this list of commands",
      "- `test account` - I'll tell you how to create a test account",
      "- `pick` - I'll pick a random member",
      "",
      "",
      "I'm still learning, so if you have any suggestions, please <https://github.com/capmo/slack-bot/issues/new/choose | let me know>.",
    ];
    await bot.reply(message, messages.join("\n"));
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
  }

  // Picks member from user group
  if (message.text.includes("pick from")) {
    const userGroup = message.text.split("pick from")[1].trim();
    console.log(userGroup);
    const members = await getGroupMembers(userGroup);

    if (members.length === 0) {
      await bot.reply(
        message,
        `I couldn't find any members in the ${userGroup} user group. Try using the group handle instead of the name.`
      );
    } else {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      await bot.reply(message, `I picked <@${randomMember}>`);
    }
  }

  // Pick from current channel
  if (message.text.includes("pick")) {
    const members = await getChannelMembers(message.channel);
    if (members.length === 0) {
      await bot.reply(message, `I couldn't find any members in this channel.`);
    } else {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      await bot.reply(message, `I picked <@${randomMember}>`);
    }
  }
});

// Handle private messages sent to the bot directly
controller.on("direct_message", async (bot, message) => {
  //   await bot.reply(message, "You are talking to me directly");
});

controller.webserver.get("/", (req, res) => {
  res.send(`This app is running Botkit ${controller.version}.`);
});

// controller.webserver.get("/install", (req, res) => {
//   // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
//   res.redirect(controller.adapter.getInstallLink());
// });

// controller.webserver.get("/install/auth", async (req, res) => {
//   try {
//     const results = await controller.adapter.validateOauthCode(req.query.code);

//     console.log("FULL OAUTH DETAILS", results);

//     // Store token by team in bot state.
//     tokenCache[results.team_id] = results.bot.bot_access_token;

//     // Capture team to bot id
//     userCache[results.team_id] = results.bot.bot_user_id;

//     res.json("Success! Bot installed.");
//   } catch (err) {
//     console.error("OAUTH ERROR:", err);
//     res.status(401);
//     res.send(err.message);
//   }
// });

let tokenCache = {};
let userCache = {};

if (process.env.TOKENS) {
  tokenCache = JSON.parse(process.env.TOKENS);
}

if (process.env.USERS) {
  userCache = JSON.parse(process.env.USERS);
}

async function getTokenForTeam(teamId) {
  if (tokenCache[teamId]) {
    return new Promise((resolve) => {
      setTimeout(function () {
        resolve(tokenCache[teamId]);
      }, 150);
    });
  } else {
    console.error("Team not found in tokenCache: ", teamId);
  }
}

async function getBotUserByTeam(teamId) {
  if (userCache[teamId]) {
    return new Promise((resolve) => {
      setTimeout(function () {
        resolve(userCache[teamId]);
      }, 150);
    });
  } else {
    console.error("Team not found in userCache: ", teamId);
  }
}

async function getChannelMembers(channelId) {
  const result = await axios.get(
    "https://slack.com/api/conversations.members",
    {
      headers: {
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
      params: {
        channel: channelId,
      },
    }
  );
  return result.data.members;
}

// Get members of a Slack group
async function getGroupMembers(group) {
  const response = await axios.get("https://slack.com/api/usergroups.list", {
    headers: {
      Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    },
  });
  const groups = response.data.usergroups;
  // Look for group name in handle
  const groupHandle = groups.find((usergroup) => usergroup.handle === group);

  if (groupHandle) {
    const result = await axios.get(
      "https://slack.com/api/usergroups.users.list",
      {
        headers: {
          Authorization: `Bearer ${process.env.BOT_TOKEN}`,
        },
        params: {
          usergroup: groupHandle.id,
        },
      }
    );

    if (result.ok) {
      return result.data.users;
    }
  }
}

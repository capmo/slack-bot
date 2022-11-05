import { Botkit } from "botkit";
import greetings = require("random-greetings");
import {
  SlackAdapter,
  SlackMessageTypeMiddleware,
} from "botbuilder-adapter-slack";
import {
  createChannel,
  getBotUserId,
  getChannelMembers,
  getSubteamMembers,
  getUserProfile,
  inviteUsersToChannel,
} from "./utils";

require("dotenv").config();

const botId = getBotUserId();

const adapter = new SlackAdapter({
  clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
  botToken: process.env.BOT_TOKEN,
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
      " • `help` or `commands` - I'll show you this list of commands",
      " • `test account` - I'll tell you how to create a test account for our Dev/Staging environments",
      " • `pick` - I'll pick a random member from the current channel or from a subteam if you mention it (e.g. `pick @mobile`)",
      " • `surprise <user>` - I'll create a channel inviting every member of #general but not the mentioned user. You could use this to organize a surprise party/initiative for someone! (e.g. `surprise @john`) *Note: Use this command in a channel the person you want to surprise is not a member of... or send me a direct message :grin:*",
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
      return;
    }
    const mentionedUser = message.text.match(/<@(.*)>/)[1];

    // Get User Info
    const userProfile = await getUserProfile(mentionedUser);
    const userName = userProfile.display_name || userProfile.real_name;
    const channelName = `temp_surprise-for-${userName
      .toLowerCase()
      .replace(/ /g, "-")}`;

    const members = await getChannelMembers("C7H5QAT9Q");
    const filteredMembers = members.filter(
      (member) => member !== mentionedUser
    );

    const createChannelResult = await createChannel(channelName);
    if (createChannelResult.data.ok) {
      await bot.reply(message, `Created channel ${channelName}`);
      const inviteResult = await inviteUsersToChannel(
        createChannelResult.data.channel.id,
        filteredMembers
      );
      if (inviteResult.data.ok) {
        await bot.reply(message, `Invited everyone to ${channelName}`);
      } else {
        await bot.reply(message, `Failed to invite everyone to ${channelName}`);
      }
    } else {
      await bot.reply(message, `Failed to create channel ${channelName}`);
    }
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

  async function pickFromCurrentChannel() {
    const members = await getChannelMembers(message.channel);
    if (members !== undefined) {
      const filteredMembers = members.filter((member) => member !== botId);
      if (filteredMembers.length === 0) {
        await bot.reply(
          message,
          "I couldn't find any members in the current channel."
        );
      } else {
        const randomMember =
          filteredMembers[Math.floor(Math.random() * filteredMembers.length)];
        await bot.reply(message, `I picked <@${randomMember}>`);
      }
    } else {
      await bot.reply(
        message,
        "I couldn't find any members in the current channel. Check this is not a private conversation."
      );
    }
  }

  async function pickFromSubteam() {
    const subteamId = message.text.split("<!subteam^")[1].split("|")[0];
    if (subteamId !== undefined) {
      const members = await getSubteamMembers(subteamId);
      const filteredMembers = members.filter((member) => member !== botId);
      if (filteredMembers.length === 0) {
        await bot.reply(
          message,
          `I couldn't find any members in the ${subteamId} subteam.`
        );
      } else {
        const randomMember =
          filteredMembers[Math.floor(Math.random() * filteredMembers.length)];
        await bot.reply(message, `I picked <@${randomMember}>`);
      }
    } else {
      await bot.reply(
        message,
        "I couldn't find any members in the mentioned group. You can use `pick` without mentioning a group to pick from the current channel."
      );
    }
  }

  // Pick user
  if (message.text.includes("pick")) {
    if (message.text.includes("<!subteam^")) {
      await pickFromSubteam();
    } else {
      await pickFromCurrentChannel();
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

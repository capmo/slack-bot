/* eslint-disable no-await-in-loop */
const axios = require("axios");

async function getChannelMembers(channelId) {
  const members = [];
  let cursor = "";
  let result;
  do {
    result = await axios.get("https://slack.com/api/conversations.members", {
      headers: {
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
      params: {
        channel: channelId,
        cursor,
      },
    });
    if (result.data.ok) {
      members.push(...result.data.members);
      cursor = result.data.response_metadata.next_cursor;
    }
  } while (cursor !== "");
  return members;
}

async function getUserList() {
  const members = [];
  let cursor = "";
  let result;
  do {
    result = await axios.get("https://slack.com/api/users.list", {
      headers: {
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
      params: {
        cursor,
      },
    });
    if (result.data.ok) {
      members.push(...result.data.members);
      cursor = result.data.response_metadata.next_cursor;
    }
  } while (cursor !== "");
  return members.filter(
    (member) => member.deleted === false && member.is_bot === false
  );
}

async function getSubteamMembers(subteamId) {
  const members = [];
  const result = await axios.get(
    "https://slack.com/api/usergroups.users.list",
    {
      headers: {
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
      params: {
        usergroup: subteamId,
      },
    }
  );
  if (result.data.ok) {
    members.push(...result.data.users);
  }
  return members;
}

async function pickFromSubteam(message, botId, bot) {
  bot.changeContext(message.reference);

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

async function pickFromCurrentChannel(message, botId, bot) {
  bot.changeContext(message.reference);

  const members = await getChannelMembers(message.channel);
  if (members !== undefined) {
    const filteredMembers = members.filter((member) => member !== botId);
    if (filteredMembers.length === 0) {
      await bot.reply(
        message,
        `I couldn't find any members in the current channel.`
      );
    } else {
      const randomMember =
        filteredMembers[Math.floor(Math.random() * filteredMembers.length)];
      await bot.reply(message, `I picked <@${randomMember}>`);
    }
  } else {
    await bot.reply(
      message,
      `I couldn't find any members in the current channel. Check this is not a private conversation.`
    );
  }
}

async function inviteMembers(
  bot,
  message,
  channelName,
  channelId,
  filteredMembers
) {
  bot.changeContext(message.reference);

  const inviteResult = await axios.post(
    "https://slack.com/api/conversations.invite",
    {
      channel: channelId,
      // Max 1000 users
      users: filteredMembers.join(","),
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
    }
  );
  if (inviteResult.data.ok) {
    await bot.reply(message, `Invited everyone to #${channelName}`);
    return true;
  }
  await bot.reply(message, `Failed to invite everyone to #${channelName}`);
  return false;
}

async function exists(channelName) {
  const result = await axios.get("https://slack.com/api/conversations.list", {
    headers: {
      Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    },
    params: {
      types: "public_channel,private_channel",
    },
  });
  if (result.data.ok) {
    const { channels } = result.data;
    const filteredChannels = channels.filter(
      (channel) => channel.name === channelName
    );
    if (filteredChannels.length > 0) {
      return true;
    }
  }
  return false;
}

async function generateChannelName(userName) {
  let channelName = `temp_surprise-for-${userName
    .toLowerCase()
    .replace(/ /g, "-")}`;

  let channelExists = await exists(channelName);
  let index = 1;

  while (channelExists) {
    index += 1;
    // eslint-disable-next-line no-await-in-loop
    channelExists = await exists(`${channelName}-${index}`);
  }

  channelName += `-${index}`;
  return channelName;
}

async function createChannel(channelName) {
  const result = await axios.post(
    "https://slack.com/api/conversations.create",
    {
      name: channelName,
      is_private: true,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
    }
  );

  if (result.data.ok) {
    return result.data.channel.id;
  }
  return null;
}

async function getUsername(mentionedUser) {
  const result = await axios.get("https://slack.com/api/users.info?", {
    headers: {
      Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    },
    params: {
      user: mentionedUser,
    },
  });

  if (result.data.ok) {
    return result.data.user.profile.display_name;
  }
  return null;
}

async function createSurpriseChannel(mentionedUser, message, bot) {
  bot.changeContext(message.reference);

  const userResponse = await getUsername(mentionedUser);
  const userName = userResponse.data.user.profile.display_name;
  const channelName = await generateChannelName(userName);
  const members = await getUserList().then((users) =>
    users.map((user) => user.id)
  );
  const filteredMembers = members.filter((member) => member !== mentionedUser);

  const id = await createChannel(channelName);
  if (id !== null) {
    await bot.reply(message, `Created channel ${channelName}`);
    await inviteMembers(bot, message, channelName, id, filteredMembers);
  } else {
    await bot.reply(message, `Failed to create channel #${channelName}`);
  }
}

module.exports = {
  pickFromSubteam,
  pickFromCurrentChannel,
  createSurpriseChannel,
  getSubteamMembers,
  getChannelMembers,
  exists,
  generateChannelName,
  createChannel,
  getUsername,
  inviteMembers,
  getUserList,
};

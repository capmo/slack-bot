const axios = require("axios");

export async function getChannelMembers(channelId: string) {
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

export async function getSubteamMembers(subteamId: string) {
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

export async function getUserProfile(mentionedUser: string) {
  const userResponse = await axios.get("https://slack.com/api/users.info", {
    headers: {
      Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    },
    params: {
      user: mentionedUser,
    },
  });
  return userResponse.data.user.profile;
}

export async function createChannel(channelName: string) {
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

  return result;
}

export async function inviteUsersToChannel(
  channelId: string,
  members: Array<string>
) {
  const result = await axios.post(
    "https://slack.com/api/conversations.invite",
    {
      channel: channelId,
      users: members.join(","),
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
    }
  );

  return result;
}

export async function getBotUserId() {
  const response = await axios.get("https://slack.com/api/auth.test", {
    headers: {
      Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    },
  });
  return response.data.user_id;
}

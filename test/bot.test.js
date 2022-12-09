require("dotenv").config();
const {
  getChannelMembers,
  getSubteamMembers,
  exists,
  getUsername,
  createChannel,
  inviteMembers,
} = require("../src/utils");

const axios = require("axios");
jest.mock("axios");

test("getting channel id from name", async () => {
  const response = {
    data: {
      ok: true,
      channels: [
        {
          id: "C7H5QAT9Q",
          name: "general",
        },
      ],
    },
  };
  axios.get.mockResolvedValue(response);
  const channelId = await exists("general");
  expect(channelId).toBe(true);
});

test("getting members of a channel", async () => {
  const response = {
    data: {
      ok: true,
      members: ["U7H5QAT9Q", "U7H5QAT9R"],
      response_metadata: {
        next_cursor: "",
      },
    },
  };
  axios.get.mockResolvedValue(response);
  const members = await getChannelMembers("C7H5QAT9Q");
  expect(members.length).toBe(2);
});

test("getUsername", async () => {
  const response = {
    data: {
      ok: true,
      user: {
        name: "test",
        profile: {
          display_name: "test",
        },
      },
    },
  };
  axios.get.mockResolvedValue(response);
  const username = await getUsername("U7H5QAT9Q");
  expect(username).toBe("test");
});

test("createChannel", async () => {
  const response = {
    data: {
      ok: true,
      channel: {
        id: "C7H5QAT9Q",
      },
    },
  };
  axios.post.mockResolvedValue(response);
  const channelId = await createChannel("test");
  expect(channelId).toBe("C7H5QAT9Q");
});

test("inviteMembers", async () => {
  const response = {
    data: {
      ok: true,
    },
  };
  const bot = {
    changeContext: jest.fn(),
    reply: jest.fn(),
  };
  const message = {
    channel: "C7H5QAT9Q",
    text: "test",
  };
  const channelName = "test";
  const channelId = "C7H5QAT9Q";
  const filteredMembers = ["U7H5QAT9Q", "U7H5QAT9R"];

  axios.post.mockResolvedValue(response);
  const result = await inviteMembers(
    bot,
    message,
    channelName,
    channelId,
    filteredMembers
  );
  expect(result).toBe(true);
});

test("getSubteamMembers", async () => {
  const response = {
    data: {
      ok: true,
      users: ["U7H5QAT9Q", "U7H5QAT9R"],
    },
  };
  axios.get.mockResolvedValue(response);
  const members = await getSubteamMembers("S03SWJ0L1FY");
  expect(members.length).toBe(2);
});

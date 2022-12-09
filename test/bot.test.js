const axios = require("axios");
const dotenv = require("dotenv");
const {
  getChannelMembers,
  getSubteamMembers,
  exists,
} = require("../src/utils");

dotenv.config();

test("getting groupId from handle", async () => {
  const response = await axios.get("https://slack.com/api/usergroups.list", {
    headers: {
      Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    },
  });
  const groups = response.data.usergroups;
  const groupHandle = groups.find((usergroup) => usergroup.handle === "mobile");
  expect(groupHandle.id).toBe("S03SWJ0L1FY");
});

test("getting members of a group", async () => {
  // S03SWJ0L1FY is the id of the mobile subteam
  const members = await getSubteamMembers("S03SWJ0L1FY");
  expect(members.length).toBe(11);
});

test("getting members of general", async () => {
  // C7H5QAT9Q is the id of the general channel
  const members = await getChannelMembers("C7H5QAT9Q");
  expect(members.length).toBeGreaterThan(100);
});

test("channel name exists", async () => {
  const channelExists = await exists("general");
  expect(channelExists).toBe(true);
});

test("channel name doesn't exist", async () => {
  const randomChannelName = Math.random().toString(36).substring(7);
  const channelExists = await exists(randomChannelName);
  expect(channelExists).toBe(false);
});

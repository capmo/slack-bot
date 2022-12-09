const axios = require("axios");
const {
  getChannelMembers,
  getSubteamMembers,
  exists,
} = require("../src/utils");

require("dotenv").config();

test("getting members of a group", async () => {
  // S03SWJ0L1FY is the id of the mobile subteam
  const members = await getSubteamMembers("S03SWJ0L1FY");
  expect(members.length).toBeGreaterThan(5);
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

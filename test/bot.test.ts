require("dotenv").config();
const { axios } = require("./utils");

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
  // Look for group name in handle
  const result = await axios.get(
    "https://slack.com/api/usergroups.users.list",
    {
      headers: {
        Authorization: `Bearer ${process.env.BOT_TOKEN}`,
      },
      params: {
        usergroup: "S03SWJ0L1FY",
      },
    }
  );
  expect(result.data.ok).toBe(true);

  console.log(result.data.users);
  const members = result.data.users;
  expect(members.length).toBe(11);
});

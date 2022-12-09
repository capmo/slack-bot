# Capmo's Slack Bot

Any contribution, idea or suggestion is welcomed.

Feel free to checkout the project, play around and open a PR.

## Commands

This bot currently supports the following commands:

### `help` or `commands`

This command will list all the available commands.

### `test account`

This command will tell how to create a test account for Capmo in Dev or Staging.

### `pick` or `pick <team>`

This command will pick a random person from the current channel or from the specified team, if provided.

### `surprise <user>`

It will create a temporary channel and invite everyone from the `#general` channel, except the specified user.

## Development

### Botkit

This is a Botkit starter kit for slack, created with the [Yeoman generator](https://github.com/howdyai/botkit/tree/master/packages/generator-botkit#readme).

To complete the configuration of this bot, make sure to update the included `.env` file with your platform tokens and credentials.

[Botkit Docs](https://github.com/howdyai/botkit/blob/main/packages/docs/index.md)

This bot is powered by [a folder full of modules](https://github.com/howdyai/botkit/blob/main/packages/docs/core.md#organize-your-bot-code).
Edit the samples, and add your own in the [features/](features/) folder.

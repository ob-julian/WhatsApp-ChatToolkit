# WhatsApp-SprachnachrichtCounter

A small script that reminds users in certain WhatsApp chats how much of others’ time they consume with voice messages.

## Disclaimer

This project is intended for educational purposes only. It is not affiliated with or endorsed by WhatsApp or Meta Platforms, Inc. Use at your own risk. The author is not responsible for any misuse or unintended consequences of this script.
I built this in a few hours to troll some friends because voice messages in a group I'm in were getting out of hand.

## Features

* Tracks the duration and count of voice messages in **one** WhatsApp chat or group.
* Sends reminders to users about their voice message usage.
* Easy setup and configuration.
* Uses lighthearted sarcasm.
* Respons messages are customizable via 2 config files.
* Responsive are at tthe moment only in German, but you can easily replace them with your own.

## Installation

1. Install Node.js and npm if you haven't already:

   * [Download Node.js](https://nodejs.org/)
   * Personal recommendation: use a Node Version Manager (e.g., NVM).
2. Clone the repository:

   ```bash
   git clone https://github.com/ob-julian/WhatsApp-SprachnachrichtCounter
   ```
3. Navigate to the project directory:

   ```bash
   cd WhatsApp-SprachnachrichtCounter
   ```
4. Install the dependencies:

   ```bash
   npm install
   ```

5. Run the script:

   ```bash
   node .
   ```
6. Oftentimes, you need to download specific libraries if your system does not have Chromium installed. And even then, you might need to install a few more libraries. If you run into issues, please refer to the [Puppeteer troubleshooting guide](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md)


## Extending the Script

This project is designed to be easily extendable. 

### Commands

To add a new command, simply create a new file in the `commands` directory. Each command file should export an object with the following properties:

```javascript
{
  name: 'commandName', // The command's trigger word (e.g., 'status')
  description: 'Description of the command', // A short explanation of what the command does
  restrictions: {
      self: true,        // If true, only messages sent by yourself (the bot account) can trigger this command
      group: true,       // If true, the command can be used in group chats
      private: true,     // If true, the command can be used in private (1:1) chats
      selfMessage: true  // If true, the command can be used in your own self-chat (messaging yourself). This is useful for sensitive commands, assuming the bot runs on your personal account.
  },
  execute: (client, message, config, args) => {
    // Your command logic here
  }
}
```

### client.on interaction

To add a new interaction handler, create a new file in the `client_on` directory. Each file should export a object with the following properties:

```javascript
{
  event: 'message_create', // The event to listen for (e.g., 'message_create', 'ready' ...)
  handler: (client, message, config) => {
    // Your interaction logic here
  }
}
```


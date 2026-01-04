# WhatsApp-ChatToolkit (originally WhatsApp-SprachnachrichtCounter but it has grown beyond just counting voice messages)

A small script that originally reminded users in certain WhatsApp chats how much of others’ time they consume with voice messages. \
It still does that, but it now also has Commands and other features to extend the bot's functionality.

All in a modular and easy-to-extend way.

## Disclaimer

This project is intended for educational purposes only. It is not affiliated with or endorsed by WhatsApp or Meta Platforms, Inc. Use at your own risk. The author is not responsible for any misuse or unintended consequences of this script.
I built this in a few hours to troll some friends because voice messages in a group I'm in were getting out of hand.

## Features

### Original Purpose
* Tracks the duration and count of voice messages in **one** WhatsApp chat or group.
* Sends reminders to users about their voice message usage.
* Uses lighthearted sarcasm.
* Response messages are customizable via 2 config files.
* Responses are at the moment only in German, but you can easily replace them with your own.

### Additional Features

* Multitude of commands to extend the bot's functionality.
> Use !help in a self message to see a list of available commands.

### Architectural Features
* Easy setup and configuration.
* Modular design for easy extension.
* Automatic injection of commands and event handlers as long as they follow the naming and structure conventions.


## Installation
### Using Docker (recommended for ease of use)
1. Make sure you have Docker installed on your system. If not, download and install it from [here](https://www.docker.com/get-started).
2. Clone the repository:

   ```bash
   git clone https://github.com/ob-julian/WhatsApp-ChatToolkit
   ```
3. Navigate to the project directory:

   ```bash
   cd WhatsApp-ChatToolkit
   ```
4. Build the Docker image:

   ```bash
   docker build -t whatsapp-chattoolkit .
   ```

5. **First Startup (Interactive Mode):**

   The first time you start the bot, you need to scan the WhatsApp QR code. Run the container interactively so you can see the QR code in the logs:

   ```bash
   docker run -it --rm whatsapp-chattoolkit
   ```
   This will start the bot and print the QR code to the terminal. Scan it with your WhatsApp app to link your account.

   After the initial setup, you can run the container in the background or with additional options as needed.

6. **Subsequent Startups:**

   After the initial setup, you can run the container in detached mode:

   ```bash
   docker run -d --name whatsapp-chattoolkit whatsapp-chattoolkit
   ```

   This will run the bot in the background.

## Using Docker Compose for Permanent Config Storage

To keep your configuration and temporary files persistent across container restarts, use Docker Compose. This will mount the local `config` and authentication directories to the container.

1. Make sure you have Docker Compose installed.
2. For first startup we again need to run it interactively to scan the QR code and configure the bot:

   ```bash
   docker compose run --rm whatsapp-chattoolkit
   ```
3. For subsequent startups, you can run the service in detached mode:

   ```bash
   docker compose up -d
   ```

4. (Optional) Chron job example to restart the container every day at midnight:
   > It seems that after some time the bot stops responding to messages. This is ment to counter that.

   You can add the following line to your crontab (edit with `crontab -e`):
   ```cron
   0 0 * * * docker compose restart whatsapp-chattoolkit
   ``` 


### Manual Setup
1. Install Node.js and npm if you haven't already:

   * [Download Node.js](https://nodejs.org/)
   * Personal recommendation: use a Node Version Manager (e.g., NVM).
2. Clone the repository:

   ```bash
   git clone https://github.com/ob-julian/WhatsApp-ChatToolkit
   ```
3. Navigate to the project directory:

   ```bash
   cd WhatsApp-ChatToolkit
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
  name: 'commandName', // The command's trigger word
   // Optional: aliases that trigger the same command
   aliases: ['short', 'alt'],
  description: 'Description of the command', // A short explanation of what the command does
  restrictions: {
     onlySelf: true,        // If true, only messages sent by yourself (the bot account) can trigger this command
     allowGroup: true,      // If true, the command can be used in group chats
     allowPrivate: true,    // If true, the command can be used in private (1:1) chats
     allowSelfMessage: true // If true, the command can be used in your own self-chat (messaging yourself). This is useful for sensitive commands, assuming the bot runs on your personal account.
  },
  execute: (message, client, config, args) => {
    // Your command logic here
  }
}
```

Short example: the Tic Tac Toe command is defined as `TicTacToe` but also provides an alias `ttt`, so both `!tictactoe` and `!ttt` will start the game.

### client.on interaction

To add a new interaction handler, create a new file in the `client_on` directory. Each file should export an object with the following properties:

```javascript
{
   event: 'message_create', // The event to listen for (e.g., 'message_create', 'ready' ...)
   handler: ((...args), client, config, commands) => {
      // Your interaction logic here
   }
}
```
> To handler: \
  `(...args)` are the arguments provided by the event, e.g., for 'message_create' it's (message). \
  `client` is the WhatsApp client instance. \
   `config` is the loaded configuration object from config.json. \
   `commands` is the map of loaded commands, in case you want to access them.
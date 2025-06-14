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
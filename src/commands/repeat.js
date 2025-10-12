
function getMessagePattern(messages) {
    const myMessages = messages.filter(msg => msg.fromMe);
    const theirMessages = messages.filter(msg => !msg.fromMe);
    if (myMessages.length < 2 || theirMessages.length < 2) {
        return null; // Not enough messages to find a pattern
    }
    // assuming 2 messages from each party
    // same messages including text or stickers
    if (isRepeatingPattern(myMessages[0], myMessages[1]) && isRepeatingPattern(theirMessages[0], theirMessages[1])) {
        return {
            myMessage: extractMessage(myMessages[1]),
            theirMessage: extractMessage(theirMessages[1]),
        };
    }
}

function isRepeatingPattern(message1, message2) {
    // Check if the messages are repeating each other
    if (message1.type === 'chat' && message2.type === 'chat') {
        return message1.body === message2.body;
    }
    if (message1.type === 'sticker' && message2.type === 'sticker') {
        // use message hash to compare stickers
        return message1._data.filehash === message2._data.filehash;
    }     
}

function extractMessage(message) {
    if (message.type === 'chat') {
        return {
            content: message.body,
            type: 'text'
        };
    } else if (message.type === 'sticker') {
        // use message hash to compare stickers
        return {
            content: message._data.filehash,
            type: 'sticker'
        };
    }
    return null; // Unsupported message type
}

module.exports = {
    name: 'repeat',
        description: 'Start automatic message repeating in a chat when a repeating pattern is detected.',
        help: '*Usage*\n' +
            '```\n!repeat "Chat Name"\n```\n' +
            '\n*Description*\n' +
            'Analyzes the last 4 messages in the named chat to detect a repeating pattern between both parties. If a pattern is found, the bot will automatically repeat your last message each time the other person sends theirs.\n' +
            '\n*Details*\n' +
            '- The command expects the full chat name (use quotes if the name contains spaces).\n' +
            '- Only text messages are supported for the repeating action; stickers are detected but not repeated.\n' +
            '- The repeat behavior is persisted in the config so it survives restarts.\n' +
            '\n*Examples*\n' +
            '```\n!repeat "Alice"\n```\n' +
            '\n*Options*\n' +
            '- `-h, --help, help`   Show this help text.\n',
    restrictions: {
        self: true,
        group: false,
        private: false,
        selfMessage: true
    },
    handler: async (message, client, config, chat_name_obj) => {
        const chat_name = chat_name_obj.join(' ');
        /// get chat with the given chat_name
        const allGroups = await client.getChats();
        const group = allGroups.find(chat => chat.name === chat_name);
        if (!group) {
            client.sendMessage(message.from, `Chat with name "${chat_name}" not found.`);
            return;
        }
        const chatId = group.id._serialized;
        /// get last 4 messages from the chat
        const messages = await group.fetchMessages({ limit: 4 });
        if (messages.length < 4) {
            client.sendMessage(message.from, 'Not enough messages in the chat to analyze.');
            return;
        }
        /// analyze the messages for repeating patterns
        const messagePattern = getMessagePattern(messages);
        if (!messagePattern) {
            client.sendMessage(message.from, 'No repeating pattern found in the last 4 messages.');
            return;
        }
        if (messagePattern.myMessage.type === 'sticker') {
            client.sendMessage(message.from, 'Repeating stickers is not supported yet.');
            return;
        }
        // save to config, the rest will be delt with by the repeat.js inside src/client_on 
        if (!config.repeatingMessages) {
            config.repeatingMessages = {};
        }
        config.repeatingMessages[chatId] = {
            myMessage: messagePattern.myMessage,
            theirMessage: messagePattern.theirMessage
        };
        config.save();
        client.sendMessage(message.from, `Repeating messages in chat "${chat_name}" started. I will repeat your last message: "${messagePattern.myMessage.content}" every time the other person sends "${messagePattern.theirMessage.content}".`);
    }
};
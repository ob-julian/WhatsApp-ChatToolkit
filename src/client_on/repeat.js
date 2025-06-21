function checkMessagePattern(message, pattern) {
    if (message.type === pattern.type) {
        switch (message.type) {
            case 'chat':
                return message.body === pattern.content;
            case 'sticker':
                return message._data.filehash === pattern.content;
            default:
                return false; // Unsupported message type
        }
    }
    return false;
}


module.exports = {
    event: 'message',
    handler:  (message, client, config) => {
        const chatsToListen = Object.keys(config.repeatingMessages);
        const chatId = message.from;
        if (chatsToListen.includes(chatId)) {
            const chatConfig = config.repeatingMessages[chatId];
            const pattern = chatConfig.theirMessage;
            const isPattern = checkMessagePattern(message, pattern);
            if (isPattern) {
                const myMessage = chatConfig.myMessage;
                if (myMessage.type === 'text') {
                    client.sendMessage(chatId, myMessage.content);
                } else if (myMessage.type === 'sticker') {
                    // TODO: Implement sticker sending, disabled inside commands/repeat.js
                }
            } else {
                // If the other party sends a different message, stop repeating
                delete config.repeatingMessages[chatId];
                config.save();
            }
        }
    }
};
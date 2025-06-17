const meResponse = require('../../config/me.json');

module.exports = {
    event: 'message_create',
    handler: async (message, client, config) => {
        if (message.type === 'ptt' && message.to === config.groupId && message.fromMe) {
            const authorName = client.info.pushname;
            const voiceTime = parseInt(message.duration, 10) || 0;
            const meLen = Object.keys(meResponse).length;
            const randomIndex = Math.floor(Math.random() * meLen) + 1;
            const answer = meResponse[randomIndex + ""]
                .replace('{name}', authorName)
                .replace('{secondsOG}', voiceTime);
            client.sendMessage(message.to, answer);
        }
    }
};
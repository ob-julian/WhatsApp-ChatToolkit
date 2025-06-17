const utility = require('../utility.js');

module.exports = {
    event: 'message',
    handler: async (message, client, config) => {
        if (message.type === 'ptt' && message.from === config.groupId) {
            const authorName = await utility.getAuthorName(client, message);
            const voiceTime = parseInt(message.duration, 10) || 0;
            const answer = utility.getAnswer(voiceTime, authorName);
            message.reply(answer);
        }
    }
};
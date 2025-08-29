const utility = require('../utility.js');


module.exports = {
    event: 'ready',
    handler: async (client, config) => {
        for (const scheduled of (config.scheduledMessages || [])) {
            utility.sendMessageAtDate(client, scheduled.chatID, scheduled.finalMessage, scheduled.scheduledTime, config);
        }
    }
};

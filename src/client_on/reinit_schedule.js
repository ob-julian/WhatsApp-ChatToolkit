const utility = require('../utility.js');


module.exports = {
    event: 'ready',
    handler: async (client, config) => {
        for (const scheduled of (config.scheduledMessages || [])) {
            try {
                utility.sendMessageAtDate(client, scheduled.chatID, scheduled.finalMessage, scheduled.scheduledTime, config);
            } catch (error) {
                console.error('Failed to schedule message:', error);
            }
        }
    }
};

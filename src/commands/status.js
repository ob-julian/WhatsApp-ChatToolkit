module.exports = {
    name: 'status',
    description: 'Check if the bot is running',
    restrictions: {
        self: true,
        group: false,
        private: false,
        selfMessage: true
    },
    handler: async (message, client, config) => {
        message.reply('I am up and running!');
    }
};
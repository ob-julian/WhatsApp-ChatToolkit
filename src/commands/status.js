module.exports = {
    name: 'status',
        description: 'Check if the bot is running',
        help: '*Usage*\n' +
            '```\n!status\n```\n' +
            '\n*Description*\n' +
            'Replies with a short message indicating that the bot process is up and responsive.\n' +
            '\n*Notes*\n' +
            '- No arguments are required.\n' +
            '- Intended for quick health checks.\n',
    restrictions: {
        onlySelf: true,
        allowGroup: false,
        allowPrivate: false,
        allowSelfMessage: true
    },
    handler: async (message, client, config) => {
        message.reply('I am up and running!');
    }
};
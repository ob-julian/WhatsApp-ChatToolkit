const utility = require('../utility');

// This module listens for incoming messages and dispatches commands accordingly.

module.exports = {
    event: 'message_create',
    handler: async (message, client, config, commands) => {
        try {
            if (!message.body || !message.body.startsWith('!')) return;
            const raw = message.body.slice(1).trim(); // remove leading '!'
            if (raw.length === 0) return;

            const parts = raw.split(/\s+/);
            const invoked = parts[0].toLowerCase();
            const args = parts.slice(1);

            // help detection
            const helpRequested = args.includes('-h') || args.includes('--help') || args.includes('help');
            const helpModule = commands && commands.get && commands.get('help');

            if (invoked === 'help') {
                if (helpModule) {
                    await helpModule.handler(message, client, config, args, commands);
                    return;
                } else {
                    await message.reply('Help module is not available.');
                    return;
                }
            }

            const cmd = commands && commands.get && commands.get(invoked);
            if (!cmd) return;

            if (helpRequested) {
                if (helpModule) {
                    await helpModule.handler(message, client, config, [invoked], commands);
                    return;
                } else {
                    await message.reply('Help module is not available.');
                    return;
                }
            }

            if (!await utility.canUseCommand(cmd, message, client)) return;

            await cmd.handler(message, client, config, args);
        } catch (err) {
            console.error('Error in command dispatcher handler:', err);
        }
    }
};

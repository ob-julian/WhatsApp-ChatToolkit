const utility = require('../utility');

module.exports = {
    name: 'help',
    description: 'Show available commands or detailed help for a specific command.',
        help: '*Usage*\n' +
                '```\n!help [command]\n```\n' +
                '\n*Description*\n' +
                'List available commands or show extended help for a specific command. You can also use `!<command> -h`, `!<command> --help` or `!<command> help` for quick access.\n',
    restrictions: {
        // help is allowed everywhere, but only shows commands the user can actually use
    },
    // handler receives (message, client, config, args, commands)
    handler: async (message, client, config, args = [], commands = new Map()) => {

        // use utility to check command permissions
        function commandAllowed(mod) {
            return utility.canUseCommand(mod, message);
        }

        if (!args || args.length === 0) {
            // list commands filtered by allowed context
            let reply = '*Available commands:*\n\n';
            for (const [name, mod] of commands.entries()) {
                if (commandAllowed(mod) === false) continue;
                const desc = mod.description || (mod.help ? (typeof mod.help === 'string' ? mod.help.split('\n')[0] : '') : '');
                reply += `*${name}*: ${desc || 'No description'}\n`;
            }
            // if nothing available, inform the user
            if (reply.trim() === '*Available commands:*') {
                await message.reply('No commands available for your current context.');
                return;
            }
            await message.reply(reply);
            return;
        }

        const target = args[0].toLowerCase();
        const mod = commands.get(target);
        if (!mod) {
            await message.reply(`No such command: ${target}`);
            return;
        }

        if (commandAllowed(mod) === false) {
            await message.reply('You do not have access to this command in the current context.');
            return;
        }

        const helpText = mod.help || mod.description || 'No extended help available for this command.';
        await message.reply(`Help for !${target}:\n${helpText}`);
    }
};
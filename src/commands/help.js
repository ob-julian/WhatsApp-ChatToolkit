const fs = require('fs');
const path = require('path');

const commandsPath = __dirname;
let cachedCommands = null;

// Cache command info at module load
function loadCommands() {
    if (cachedCommands) return cachedCommands;
    cachedCommands = [];
    const files = fs.readdirSync(commandsPath);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const cmd = require(path.join(commandsPath, file));
            if (cmd.name && cmd.description) {
                cachedCommands.push({ name: cmd.name, description: cmd.description });
            }
            // to save memory, we can also delete the module reference
            delete require.cache[require.resolve(path.join(commandsPath, file))];
        }
    });
    return cachedCommands;
}

module.exports = {
    name: 'help',
    description: 'List all available commands',
    restrictions: {
        self: true,
        group: true,
        private: true,
        selfMessage: true
    },
    handler: async (message, client, config) => {
        console.log(`Received help command from ${message.from}`);
        const commands = loadCommands();
        let helpText = '*Available Commands:*\n\n';
        commands.forEach(cmd => {
            helpText += `*${cmd.name}*: ${cmd.description}\n`;
        });
        client.sendMessage(message.to, helpText.trim());
    }
};
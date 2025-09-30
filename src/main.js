const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const config = require('./config.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// --- Message handlers ---
try {
    const handlersPath = path.join(__dirname, 'client_on');
    fs.readdirSync(handlersPath).forEach(file => {
        if (file.endsWith('.js')) {
            const handlerModule = require(path.join(handlersPath, file));
            if (handlerModule.event && typeof handlerModule.handler === 'function') {
                client.on(handlerModule.event, (...args) => handlerModule.handler(...args, client, config));
            }
        }
    });
    console.log('Finished loading client_on handlers.');
} catch (err) {
    console.error('Error loading client_on handlers:', err);
}

try {
    const commandsPath = path.join(__dirname, 'commands');
    fs.readdirSync(commandsPath).forEach(file => {
        if (file.endsWith('.js')) {
            const commandModule = require(path.join(commandsPath, file));
            if (commandModule.name && typeof commandModule.handler === 'function') {
                client.on('message_create', async message => {
                    if (message.body.startsWith('!') && message.body.slice(1).startsWith(commandModule.name)) {
                        const messageArguments = message.body.slice(commandModule.name.length + 2).trim().split(/\s+/);
                        if (!commandModule.restrictions) return; // Ensure restrictions are defined

                        const isSelfMessage = message._data.id.self || false;
                        const isFromMe = message.fromMe || false;
                        const isGroupMessage = message._data.id.participant || false;
                        const isPrivateMessage = !isGroupMessage && !isSelfMessage;

                        // Needs to be extended with OR if ever extended with stuff like admin or owner
                        if (commandModule.restrictions.self && !isFromMe) return;
                        
                        // Using OR to ensure the command can be used in group and private messages simultaneously
                        if ((commandModule.restrictions.group && isGroupMessage) ||
                        (commandModule.restrictions.private && isPrivateMessage) ||
                        (commandModule.restrictions.selfMessage && isSelfMessage)) {
                            await commandModule.handler(message, client, config, messageArguments);
                        }
                    }
                });
            }
        }
    });
    console.log('Finished loading command handlers.');
} catch (err) {
    console.error('Error loading command handlers:', err);
}

client.initialize();
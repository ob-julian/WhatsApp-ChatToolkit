const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const config = require('./config.js');
const utility = require('./utility');

const client = new Client({
    authStrategy: new LocalAuth(
        {
            //clientId: 'test-bot' // uncomment for multiple/different users
        }
    ),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// --- Commands loading & global dispatcher ---
const commands = new Map(); // global command storage
try {
    const commandsPath = path.join(__dirname, 'commands');

    fs.readdirSync(commandsPath).forEach(file => {
        if (file.endsWith('.js')) {
            const commandModule = require(path.join(commandsPath, file));
            if (commandModule.name && typeof commandModule.handler === 'function') {
                // store command for global dispatcher
                const primary = commandModule.name.toLowerCase();
                if (commands.has(primary)) {
                    console.warn(`Command name conflict: ${primary} already registered, skipping ${file}`);
                } else {
                    commands.set(primary, commandModule);
                }

                // register aliases if provided (array of strings)
                if (Array.isArray(commandModule.aliases)) {
                    for (const a of commandModule.aliases) {
                        if (!a || typeof a !== 'string') continue;
                        const alias = a.toLowerCase();
                        if (commands.has(alias)) {
                            console.warn(`Alias conflict: ${alias} already registered, skipping alias from ${file}`);
                        } else {
                            commands.set(alias, commandModule);
                        }
                    }
                }
            } else {
                console.warn(`Command file ${file} missing required exports (name, handler).`);
            }
        }
    });

    console.log('Finished loading command modules.');
} catch (err) {
    console.error('Error loading command handlers:', err);
}

// load global command dispatcher (after commands so it can access them)
try {
    const handlersPath = path.join(__dirname, 'client_on');
    fs.readdirSync(handlersPath).forEach(file => {
        if (file.endsWith('.js')) {
            const handlerModule = require(path.join(handlersPath, file));
            if (handlerModule.event && typeof handlerModule.handler === 'function') {
                client.on(handlerModule.event, (...args) => handlerModule.handler(...args, client, config, commands));
            } else {
                console.warn(`Handler file ${file} missing required exports (event, handler).`);
            }
        }
    });

    console.log('Finished loading client_on handler modules.');
} catch (err) {
    console.error('Error loading client_on handlers:', err);
}

async function init() {
    await client.initialize();
    console.log('Client initialized.');
}

init();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config/servers.json');
const responses = require('../config/responses.json');
const meResponse = require('../config/me.json');
const fs = require('fs');

const stdin = process.openStdin();
stdin.setEncoding('utf8');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let qrCodeTries = 0;

client.on('qr', qr => {
    if (qrCodeTries === 0) {
        console.log('QR Code received, generating terminal QR code...');
        console.log('Security Note: Do not share this QR code with anyone.');
        console.log('Only scan this QR code if you trust this project.');
        console.log('If you suspect suspicious activity, untrust this session in WhatsApp.');
    } else {
        console.log('New QR Code received, generating terminal QR code...');
    }
    qrCodeTries++;
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    console.log(`Logged in as: ${client.info.pushname} (${client.info.wid.user})`);
    if (config.groupName && config.groupName !== '') {// Rethinking it, saving the group name is unnecessary since it's subject to change. All that's needed is the serialized ID — but if it ain't broke, don't fix it.
        console.log(`You are currently listening to the group: ${config.groupName}`);
        console.log('Do you want to change the configuration? (yes/no, continuing with no in 10 seconds)');
        const timer = setTimeout(() => {
            if (!stdin.destroyed) {
                console.log('No input received, continuing with the current configuration...');
                stdin.destroy();
            }
        }, 10000);
        const answer = await getUserInput();
        clearTimeout(timer);
        if (answer === 'yes' || answer === 'y') {
            console.log('Changing configuration...');
            await changeServerConfiguration();
        } else {
            console.log('Continuing with the current configuration...');
        }
    } else {
        console.log('You are not listening to any group yet.');
        await changeServerConfiguration();
    }

    console.log('If you want to change the configuration, please restart the bot.');
    console.log('I can’t be arsed to implement this feature yet.');
});

async function changeServerConfiguration() {
    const allGroups = await client.getChats();
    const chatNames = allGroups.map(chat => chat.name);

    let groupName;
    while (!chatNames.includes(groupName)) {
        console.log('Give me the name of the group you want to listen to:');
        groupName = await getUserInput();
    }

    config.groupName = groupName;
    config.groupId = allGroups.find(chat => chat.name === groupName).id._serialized;
    saveConfig();
    console.log(`You are now listening to the group: ${groupName}`);

    console.log('Do you want to let the bot calculate the current total voice time or do you want to set it manually? (bot/manual)');
    let voiceTimeMode;
    do {
        voiceTimeMode = await getUserInput();
        if (!['bot', 'manual'].includes(voiceTimeMode)) {
            console.log('Invalid input. Please enter "bot" or "manual".');
        }
    } while (!['bot', 'manual'].includes(voiceTimeMode));
    console.log(`You chose to set the voice time mode to: ${voiceTimeMode}`);

    if (voiceTimeMode === 'manual') {
        console.log('Please enter the current total voice time in seconds:');
        let voiceTime;
        do {
            voiceTime = await getUserInput();
            if (!isNaN(voiceTime) && voiceTime >= 0) {
                config.voiceTime = parseInt(voiceTime, 10);
                saveConfig();
                console.log(`Current total voice time set to ${config.voiceTime} seconds.`);
            } else {
                console.log('Invalid input. Please enter a valid number.');
            }
        } while (isNaN(config.voiceTime) || config.voiceTime < 0);
    } else {
        const limit = 500;
        console.log(`The bot will calculate the current total voice time automatically, but only from the last ${limit} messages in the group. This might take a while, depending on the number of messages in the group.`);
        config.voiceTime = 0;
        const group = allGroups.find(g => g.name === groupName);
        console.log(`Fetching messages from group: ${groupName}`);
        if (group) {
            const messages = await group.fetchMessages({ limit: limit });
            console.log(`Found ${messages.length} messages in the group.`);
            messages.forEach(message => {
                if (message.type === 'ptt') {
                    config.voiceTime += parseInt(message.duration, 10) || 0;
                }
            });
            saveConfig();
            console.log(`Current total voice time calculated: ${config.voiceTime} seconds.`);
        } else {
            console.log('Something went wrong, I could not find the group you entered, even though it should be there.');
            console.log('Exiting the bot now, please try again later.');
            process.exit(1);
        }
    }
}

function saveConfig() {
    fs.writeFileSync('./config/servers.json', JSON.stringify(config, null, 2));
    console.log('Configuration saved to config file.');
}

function getAnswer(addedTime, name) {
    config.voiceTime += addedTime;
    saveConfig();
    const responseOptions = Object.keys(responses).length;
    const randomIndex = getWeightedQuipIndex(addedTime, responseOptions, 120);
    const response = responses[randomIndex + ""];
    const minutes = Math.floor(config.voiceTime / 60);
    const seconds = config.voiceTime % 60;
    return response
        .replace('{name}', name)
        .replace('{minutes}', minutes)
        .replace('{seconds}', seconds)
        .replace('{secondsOG}', addedTime);
}


// Utility: Gaussian distribution random number generator
function gaussianRandom(mean = 0, stdDev = 1) {
    let u1 = Math.random();
    let u2 = Math.random();
    let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + stdDev * randStdNormal;
}

// Main function: Generates quip index (1–20) based on voice message duration
function getWeightedQuipIndex(seconds, maxNumber = 20, maxLength = 400) {
    const clampedSeconds = Math.max(0, Math.min(seconds, maxLength));
    const linearMapped = (clampedSeconds / maxLength) * (maxNumber - 1) + 1;
    const noisyIndex = gaussianRandom(linearMapped, 2.5);
    return Math.max(1, Math.min(maxNumber, Math.round(noisyIndex)));
}

// --- Message handlers ---

client.on('message', async message => {
    if (message.type === 'ptt' && message.from === config.groupId) {
        const authorName = await getAuthorName(message);
        const voiceTime = parseInt(message.duration, 10) || 0;
        const answer = getAnswer(voiceTime, authorName);
        message.reply(answer);
    }
});

client.on('message_create', async message => {
    if (message.type === 'ptt' && message.to === config.groupId && message.fromMe) {
        const authorName = await getAuthorName(message);
        const voiceTime = parseInt(message.duration, 10) || 0;
        const meLen = Object.keys(meResponse).length;
        const randomIndex = Math.floor(Math.random() * meLen) + 1;
        const answer = meResponse[randomIndex + ""]
            .replace('{name}', authorName)
            .replace('{secondsOG}', voiceTime);
        client.sendMessage(message.to, answer);
    }
});

// --- Common utility methods ---

function getUserInput() {
    return new Promise(resolve => {
        stdin.once('data', data => {
            resolve(data.trim().toLowerCase());
        });
    });
}

async function getAuthorName(message) {
    let authorContact;
    if (message.author) {
        authorContact = await client.getContactById(message.author);
    } else {
        authorContact = await message.getContact();
    }
    return authorContact.pushname || authorContact.name || 'Ach zefix, warum hat der keinen Namen?';
}

client.initialize();
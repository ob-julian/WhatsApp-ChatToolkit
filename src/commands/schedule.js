const utility = require('../utility.js');

module.exports = {
    name: 'schedule',
    description: 'Schedule a message, usage: `!schedule "<message>" to "<contact or group>" at/in <time>`. "In x minutes/hours/days" or "at HH:MM" are supported.',
    restrictions: {
        self: true,
        group: false,
        private: false,
        selfMessage: true
    },
    handler: async (message, client, config, args) => {
        await scheduleMessage(message, client, config, args);
    }
};

async function scheduleMessage(message_obj, client, config, args) {
    const textMessage = args.join(' ');
    const regex = /^"(?<message>(?:[^"\\]|\\.)+)"\s+to\s+"(?<target>(?:[^"\\]|\\.)+)"\s+(?:(?:at\s+(?<hhmm>(?:[01]?\d|2[0-3]):[0-5]\d))|(?:in\s+(?<amount>\d+)\s*(?<unit>minutes?|hours?|days?)))\s*$/i;

    const match = textMessage.match(regex);
    if (match) {
        const { message, target, hhmm, amount, unit } = match.groups;
        
        // find user to send to
        const allChats = await client.getChats();
        const targetChat = allChats.find(chat => chat.name === target || chat.id === target);
        if (!targetChat) {
            if (message_obj) {
                message_obj.reply(`Could not find chat with name or ID "${target}".`);
            } else {
                console.log(`Could not find chat with name or ID "${target}".`);
            }
            return false;
        }
        const chatID = targetChat.id._serialized;

        // --- NEW: handle media attachment (only first attachment supported) ---
        let mediaData = null;
        try {
            if (message_obj && message_obj.hasMedia) {
                const downloaded = await message_obj.downloadMedia();
                if (downloaded && downloaded.data) {
                    mediaData = {
                        data: downloaded.data,          // base64
                        mimetype: downloaded.mimetype,
                        filename: downloaded.filename || `attachment.${downloaded.mimetype.split('/')[1] || 'bin'}`
                    };
                }
            }
        } catch (err) {
            console.error('Failed to download attached media for scheduling:', err);
            // continue without media
        }

        // Schedule the message using the extracted parameters
        const scheduledTime = hhmm ? convertAtToDate(hhmm) : convertToToDate(amount, unit);
        const finalMessage = message.replace(/\\"/g, '"');
        if (!(config && config.scheduledMessages)) {
            config.scheduledMessages = [];
        }
        config.scheduledMessages.push({ chatID, finalMessage, scheduledTime: scheduledTime.getTime(), media: mediaData });
        config.save();

        // pass media to utility so it can send a media message with caption
        utility.sendMessageAtDate(client, config, chatID, finalMessage, scheduledTime, mediaData);
        message_obj.reply(`Message scheduled to be sent to "${target}" at ${scheduledTime.toLocaleString()}.${mediaData ? ' (Includes attached media)' : ''}`);
        return true;
    }
    message_obj.reply('Invalid command format. Please use: `!schedule "<message>" to "<contact or group>" at/in <time>`');
    return false;
}

function convertToToDate(amount, unit) {
    const now = new Date();
    let milliseconds = 0;

    switch (unit.toLowerCase()) {
        case 'minute':
        case 'minutes':
            milliseconds = amount * 60 * 1000;
            break;
        case 'hour':
        case 'hours':
            milliseconds = amount * 60 * 60 * 1000;
            break;
        case 'day':
        case 'days':
            milliseconds = amount * 24 * 60 * 60 * 1000;
            break;
        default:
            throw new Error('Invalid time unit');
    }

    return new Date(now.getTime() + milliseconds);
}

function convertAtToDate(atTime) {
    const [hours, minutes] = atTime.split(':').map(Number);
    const now = new Date();
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    // wrap around to the next day if the time has already passed
    return scheduledDate > now ? scheduledDate : new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000);
}
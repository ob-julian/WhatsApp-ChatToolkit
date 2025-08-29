const responses = require('../config/responses.json');
const { MessageMedia } = require('whatsapp-web.js');

async function getAuthorName(client, message) {
    let authorContact;
    if (message.author) {
        authorContact = await client.getContactById(message.author);
    } else {
        authorContact = await message.getContact();
    }
    return authorContact.pushname || authorContact.name || 'Ach zefix, warum hat der keinen Namen?';
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

function getAnswer(config, addedTime, name) {
    config.voiceTime += addedTime;
    config.save();
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

async function sendMessageAtDate(client, config, chatID, text, date, media) {
    const msUntil = date.getTime ? date.getTime() - Date.now() : date - Date.now();
    if (msUntil <= 0) {
        // send immediately if date is in the past
        return await _sendNow(client, chatID, text, media);
    }
    setTimeout(async () => {
        await _sendNow(client, chatID, text, media);
        // removing from config.scheduledMessages here otherwise it will be sent again after every restart
        if (config && Array.isArray(config.scheduledMessages)) {
            config.scheduledMessages = config.scheduledMessages.filter(item => !(item.chatID === chatID && item.scheduledTime === date.getTime() && item.finalMessage === text));
            config.save();
        }
    }, msUntil);
}

async function _sendNow(client, chatID, text, media) {
    try {
        if (media && media.data) {
            // media.data expected to be base64 string
            const messageMedia = new MessageMedia(media.mimetype, media.data, media.filename);
            return client.sendMessage(chatID, messageMedia, { caption: text });
        } else {
            return client.sendMessage(chatID, text);
        }
    } catch (err) {
        console.error('Failed to send scheduled message:', err);
    }
}

module.exports = {
    getAuthorName,
    getAnswer,
    sendMessageAtDate
};
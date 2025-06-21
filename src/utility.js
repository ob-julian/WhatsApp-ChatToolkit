const responses = require('../config/responses.json');

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

module.exports = {
    getAuthorName,
    getAnswer
};
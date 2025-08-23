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
        const success = scheduleMessage(message, client, config, args);
        
        if (success) {
            client.sendMessage(message.to, 'Usage: `!schedule "<message>" to <contact or group> at/in <time>`');
        } else {
            client.sendMessage(message.to, `Scheduled message!`);
        }
    }
};


function scheduleMessage(message, client, config, args) {
    const textMessage = args.join(' ');
    const regex = /^!schedule\s+"(?<message>(?:[^"\\]|\\.)+)"\s+to\s+"(?<target>(?:[^"\\]|\\.)+)"\s+(?:(?:at\s+(?<hhmm>(?:[01]?\d|2[0-3]):[0-5]\d))|(?:in\s+(?<amount>\d+)\s*(?<unit>minutes?|hours?|days?)))\s*$/i;

    const match = textMessage.match(regex);
    if (match) {
        const { message, target, hhmm, amount, unit } = match.groups;
        // Schedule the message using the extracted parameters
        console.log(`Scheduling message: "${message}" to "${target}" ${hhmm ? `at ${hhmm}` : `in ${amount} ${unit}`}`);
        return true;
    }

    return false;
}
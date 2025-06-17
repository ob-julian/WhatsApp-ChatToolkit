const inquirer = require('inquirer').default;


module.exports = {
    event: 'ready',
    handler: async (client, config) => {
        console.log('Client is ready!');
        console.log(`Logged in as: ${client.info.pushname} (${client.info.wid.user})`);

        if (config.groupId && config.groupId !== '') {
            await handleExistingGroup(client, config);
        } else {
            console.log('You are not listening to any group yet.');
            await changeServerConfiguration(client, config);
        }

        console.log('If you want to change the configuration, please restart the bot.');
        console.log('I can’t be arsed to implement this feature yet.');
    }
};

async function handleExistingGroup(client, config) {
    const group = await client.getChatById(config.groupId);
    console.log(`You are currently listening to the group: ${group.name}`);
    const answer = await promptWithTimeout(
        {
            type: 'list',
            name: 'userInput',
            message: 'Do you want to change the configuration?',
            choices: ['Yes', 'No'],
            default: 'No'
        },
        10000,
        'No'
    );

    if (answer === 'Yes') {
        console.log('Changing configuration...');
        await changeServerConfiguration(client, config);
    } else if (answer === 'Timeout') {
        console.log('Timeout reached, continuing with the current configuration...');
    } else {
        console.log('Continuing with the current configuration...');
    }
}

async function promptWithTimeout(promptConfig, timeoutMs, defaultValue) {
    try {
        return await Promise.race([
            inquirer.prompt([promptConfig]).then(res => res[promptConfig.name]),
            new Promise(resolve => setTimeout(() => resolve('Timeout'), timeoutMs))
        ]);
    } catch {
        return defaultValue;
    }
}

async function getUserInput(message = 'Enter input:') {
    const { userInput } = await inquirer.prompt([
        {
            type: 'input',
            name: 'userInput',
            message
        }
    ]);
    return userInput.trim().toLowerCase();
}

async function changeServerConfiguration(client, config) {
    const allGroups = await client.getChats();
    const chatNames = allGroups.map(chat => chat.name);

    const { groupName } = await inquirer.prompt([
        {
            type: 'list',
            name: 'groupName',
            message: 'Select the group you want to listen to:',
            choices: chatNames
        }
    ]);

    const group = allGroups.find(chat => chat.name === groupName);
    config.set('groupId', group.id._serialized);
    console.log(`You are now listening to the group: ${groupName}`);

    const { voiceTimeMode } = await inquirer.prompt([
        {
            type: 'list',
            name: 'voiceTimeMode',
            message: 'How do you want to set the current total voice time?',
            choices: [
                { name: 'Let the bot calculate automatically', value: 'bot' },
                { name: 'Set manually', value: 'manual' }
            ]
        }
    ]);

    if (voiceTimeMode === 'manual') {
        await setVoiceTimeManually(config);
    } else {
        await calculateVoiceTimeAutomatically(group, config, groupName);
    }
}

async function setVoiceTimeManually(config) {
    let valid = false;
    while (!valid) {
        const input = await getUserInput('Enter the current total voice time in seconds (must be a non-negative number):');
        const voiceTime = parseInt(input, 10);
        if (!isNaN(voiceTime) && voiceTime >= 0) {
            config.set('voiceTime', voiceTime);
            config.save();
            console.log(`Current total voice time set to ${voiceTime} seconds.`);
            valid = true;
        } else {
            console.log('Invalid input. Please enter a valid number.');
        }
    }
}

async function calculateVoiceTimeAutomatically(group, config, groupName) {
    const limit = 500;
    console.log(`The bot will calculate the current total voice time automatically, but only from the last ${limit} messages in the group. This might take a while, depending on the number of messages in the group.`);
    config.voiceTime = 0;
    console.log(`Fetching messages from group: ${groupName}`);
    const messages = await group.fetchMessages({ limit });
    console.log(`Found ${messages.length} messages in the group.`);
    messages.forEach(message => {
        if (message.type === 'ptt') {
            config.voiceTime += parseInt(message.duration, 10) || 0;
        }
    });
    config.save();
    console.log(`Current total voice time calculated: ${config.voiceTime} seconds.`);
}
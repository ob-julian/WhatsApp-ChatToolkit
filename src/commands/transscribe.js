const secrets = require('../../config/secrets.json');

module.exports = {
    name: 'transscribe',
    description: 'Transcribe the audio message this message is replying to',
    restrictions: {
        self: true,
        group: true,
        private: true,
        selfMessage: true,
    },
    handler: async (message, client, config) => {
        // Check if the message is a reply
        if (!message.hasQuotedMsg) {
            await client.sendMessage(message.to, 'Please reply to a voice message to transcribe it.');
            return;
        }

        try {
            // Get the quoted message as a Message object
            const quotedMsg = await message.getQuotedMessage();

            // Check if the replied message is an audio (ptt)
            if (quotedMsg.type !== 'ptt') {
                await client.sendMessage(message.to, 'The replied message is not an audio message.');
                return;
            }

            // Download the audio
            const audio = await quotedMsg.downloadMedia().catch(err => {
                console.error('Error downloading audio:', err);
                return null;
            });
            if (!audio) {
                await client.sendMessage(message.to, 'Failed to download the audio message.');
                return;
            }
            const audioBuffer = Buffer.from(audio.data, 'base64');
            if (!audioBuffer || audioBuffer.length === 0) {
                await client.sendMessage(message.to, 'The audio message is empty or could not be processed.');
                return;
            }
            

            // TODO: Implement the transcription logic here
            //* For now, we just save the audio to a file
            const fs = require('fs');
            const path = require('path');
            const audioFilePath = path.join(__dirname, '../../temp/audio.ogg');
            fs.writeFileSync(audioFilePath, audioBuffer);

            await client.sendMessage(message.to, transcript || 'Could not transcribe the audio.');
        } catch (err) {
            console.error('Error during transcription:', err);
            await client.sendMessage(message.to, 'An error occurred during transcription.');
        }
    }
};
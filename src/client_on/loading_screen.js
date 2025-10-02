module.exports = {
    event: 'loading_screen',
    handler: async (percent, message, client, config) => {
        if (message === 'WhatsApp') message = '';
        console.log('LOADING: ', percent, '%', message);
    }
};
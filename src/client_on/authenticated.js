module.exports = {
    event: 'authenticated',
    handler: async (client, config) => {
        console.log('AUTHENTICATED');
    }
};
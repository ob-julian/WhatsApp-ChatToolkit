module.exports = {
    event: 'disconnected',
    handler: async (reason, client, config) => {
        console.log('Client was logged out', reason);
    }
};
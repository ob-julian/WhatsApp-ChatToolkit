module.exports = {
    event: 'auth_failure',
    handler: async (msg, client, config) => {
        // Fired if session restore was unsuccessful
        console.error('AUTHENTICATION FAILURE', msg);
    }
};
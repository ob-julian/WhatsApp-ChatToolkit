const utility = require('../utility');
const tttQuips = require('../../config/tictactoe-quips.json');

module.exports = {
    name: 'TicTacToe',
    description: 'Play a game of Tic Tac Toe.',
    help: '*Usage*\n' +
            '```\n!tictactoe [initial_move]\n```' +
            '\n*Description*\n' +
            'Starts a game of Tic Tac Toe against the bot. You play as X and the bot plays as O. To make a move, *REPLY* to the bot\'s message with the number corresponding to the position on the board, the bot will not respond otherwise.\n' +
            '\n*Notes*\n' +
            '- The bot will always play optimally and can (probably) never be beaten.\n' +
            '- If you try to make an invalid move (e.g., a position that is already taken or out of range), the bot will prompt you to try again.\n' +
            '- The game ends when there is a winner or the board is full (a draw).\n' +
            '- You must reply to the bot\'s message to make a move.\n' +
            '- To start a new game, use `!tictactoe` again.\n',
    restrictions: {
        self: false,
        group: false,
        private: true,
        selfMessage: true
    },

    // handler receives (message, client, config, args, commands)
    handler: async (message, client, config, args = [], commands) => {
        // helper to build the intro text
        const introText = '\nYou are X and I am O. To make a move, *REPLY* to the following message with the number corresponding to the position on the board.\nGood luck!\n';

        // create empty board helper
        const emptyBoard = () => [null, null, null, null, null, null, null, null, null];

        if (args.length > 0) {
            const initial_move = parseInt(args[0], 10);
            if (isNaN(initial_move) || initial_move < 1 || initial_move > 9) {
                await message.reply('Invalid initial move. So I will just start a new game without an initial move. You are X and I am O. To make a move, *REPLY* to the following message with the number corresponding to the position on the board.\nGood luck!\n');
                // send the board as followup and register the game
                const board = emptyBoard();
                await client.sendMessage(message.from, utility.drawTTTBoard(board));
                return;
            } else {
                // start game with initial move applied to the board and register
                const board = emptyBoard();
                const [new_board, status] = utility.tttDecision(board, initial_move - 1); // -1 because player move is 1-9 but array is 0-8
                if (new_board === null) {
                    // this should never happen, but just in case
                    await message.reply('Something went wrong while calculating my move. Let\'s start a new game without an initial move. You are X and I am O. To make a move, *REPLY* to the following message with the number corresponding to the position on the board.\nGood luck!\n');
                    board = emptyBoard();
                    return;
                } else {
                    // let the user know and then send the board (so they can reply to the board message)
                    await message.reply(getInitMessage() + introText + `\nPS: You started with move ${initial_move}.\n`);
                }
                await client.sendMessage(message.from, utility.drawTTTBoard(new_board));
                return;
            }
        } else {
            // no initial move provided: start empty board and send intro + board
            await message.reply(getInitMessage() + introText);
            const board = emptyBoard();
            await client.sendMessage(message.from, utility.drawTTTBoard(board));
            return;
        }
    }
};

function getInitMessage() {
    const quipKeys = Object.keys(tttQuips.intro);
    const randomKey = quipKeys[Math.floor(Math.random() * quipKeys.length)];
    return tttQuips.intro[randomKey] || 'Let\'s play!';
}
const utility = require('../utility');
const tttQuips = require('../../config/tictactoe-quips.json');

module.exports = {
    event: 'message_create',
    handler: async (message, client, config) => {
        // only handle messages that are replies and only one number long
        if (!message.hasQuotedMsg || message.body.length !== 1) {
            return;
        }
        const playerMove = parseInt(message.body, 10);
        if (isNaN(playerMove) || playerMove < 1 || playerMove > 9) {
            return;
        }
        // retrieve quoted message
        const quotedMsg = await message.getQuotedMessage();
        if (!quotedMsg) {
            return;
        }
        const quotedText = quotedMsg.body.trim() || '';
        const board = utility.extractTTTBoardFromText(quotedText);
        if (!board) {
            return;
        }
        // ensure the quoted message is actually from the bot and not the player trying to cheat
        if (quotedMsg.from !== message.to) {
            // player trying to fool the bot by using a custom board
            message.reply('Did you really think you could use a custom board? I actually check that you are replying to my message! Pfft 😄');
            return;
        }
        const [new_Board, status] = utility.tttDecision(board, playerMove - 1);
        if (new_Board === null) {
            await message.reply('Invalid move. That position is already taken or out of range. Please try again.');
            return;
        }

        // first edit board then reply to it otherwise the reply won't reflect the new board
        const editedmsg = await quotedMsg.edit(utility.drawTTTBoard(new_Board)).catch((err) => {
            failSafeReply();
        });
        if (quotedText === editedmsg.body.trim()) {
            // edit failed, so we sent a new message instead
            failSafeReply();
        }

        async function failSafeReply() {
            await quotedMsg.reply('I was unable to update the board. Creating a new message instead.');
            await client.sendMessage(message.from, utility.drawTTTBoard(new_Board));
        }
        
        switch (status) {
            case 'X':
            case 'O':
            case 'T':
                getWinMessage(status);
                await quotedMsg.reply(getWinMessage(status));
        }
    }
};

function getWinMessage(winner) {
    const translate = { 'X': 'playerWin', 'O': 'botWin', 'T': 'tie' };
    const tttWinQuips = tttQuips.end[translate[winner]] || {};  
    const quipKeys = Object.keys(tttWinQuips);
    const randomKey = quipKeys[Math.floor(Math.random() * quipKeys.length)];
    return tttWinQuips[randomKey] || (winner === 'T' ? 'It\'s a tie! Well played.' : (winner === 'X' ? 'Congratulations, you win!' : 'I win! Better luck next time.'));
}
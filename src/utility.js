const responses = require('../config/responses.json');
const { MessageMedia } = require('whatsapp-web.js');

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

async function sendMessageAtDate(client, config, chatID, text, date, media) {
    const msUntil = date.getTime ? date.getTime() - Date.now() : date - Date.now();
    if (msUntil <= 0) {
        // send immediately if date is in the past
        return await _sendNow(client, chatID, text, media);
    }
    setTimeout(async () => {
        try {
            await _sendNow(client, chatID, text, media);
        } catch (err) {
            console.error(`Failed to send scheduled message to ${chatID}`);
        }
        // removing from config.scheduledMessages here otherwise it will be sent again after every restart
        if (config && Array.isArray(config.scheduledMessages)) {
            config.scheduledMessages = config.scheduledMessages.filter(item => !(item.chatID === chatID && item.scheduledTime === date.getTime() && item.finalMessage === text));
            config.save();
        }
    }, msUntil);
}

async function _sendNow(client, chatID, text, media) {
    try {
        if (media && media.data) {
            // media.data expected to be base64 string
            const messageMedia = new MessageMedia(media.mimetype, media.data, media.filename);
            return client.sendMessage(chatID, messageMedia, { caption: text });
        } else {
            return client.sendMessage(chatID, text);
        }
    } catch (err) {
        console.error('Failed to send scheduled message:', err);
    }
}

function getMessageContext(message) {
    const isFromMe = message.fromMe || (message._data && message._data.id && message._data.id._serialized && message._data.id.self) || false;
    const isGroupMessage = !!(message._data && message._data.id && message._data.id.participant);
    const isSelfMessage = (message._data && message._data.id && message._data.id.self) || false;
    const isPrivateMessage = !isGroupMessage && !isSelfMessage;
    return { isFromMe, isGroupMessage, isSelfMessage, isPrivateMessage };
}

async function canUseCommand(cmd, message, client) {
    // as stated in the readme, restrictions are:
    // self: only the bot account itself can use the command
    // group: allowed in groups
    // private: allowed in private chats
    // selfMessage: allowed in the bot's own "chat"

    const msgCtx = getMessageContext(message);

    // basic sanity checks
    if (!cmd || !message) return false;
    
    // no restrictions at all, allow everywhere
    if (!cmd.restrictions) return true;

    // if it's not from the bot itself and onlySelf is set, reject immediately
    if (cmd.restrictions.onlySelf && !msgCtx.isFromMe) return false;

    // onlyContacts: require that the other party is saved in our contacts.
    if (cmd.restrictions.onlyContacts) {
        try {
            // if message comes from the bot itself, it's allowed
            if (!msgCtx.isFromMe) {
                // obtain contact object for the sender
                let otherContact = null;
                if (message.getContact) {
                    otherContact = await message.getContact();
                } else if (client && client.getContactById) {
                    otherContact = await client.getContactById(message.from);
                }
                if (!otherContact || !otherContact.isMyContact) return false;
            }
        } catch (err) {
            // On error conservatively deny access
            console.error('Error while checking onlyContacts restriction:', err);
            return false;
        }
    }

    // need to be OR because multiple contexts can be allowed
    return (
        (cmd.restrictions.allowGroup && msgCtx.isGroupMessage) ||
        (cmd.restrictions.allowPrivate && msgCtx.isPrivateMessage) ||
        (cmd.restrictions.allowSelfMessage && msgCtx.isSelfMessage)
    );
}

function tttDecision(boardInput = [null, null, null, null, null, null, null, null, null], playerMove) {
    // this is a stateless version of the logic that I developed ages ago for my Tic Tac Toe website: https://oberflow.dev/TicTacToe/
    // Would I do it differently today? Yes definitely, this code is the definition of when I wrote it only God and I knew, now only God does.
    // But it works, and porting it to a stateless function was easier than rewriting it from scratch.
    // It will return null if asked to make the first or 3rd move. It is designed to be played second.
    
    // boardInput: array[9] with 'X', 'O' or null/undefined
    // playerMove: index 0-8 where player places 'X'
    // player is always 'X', bot is always 'O'
    const board = boardInput.slice(); // clone
    if (playerMove < 0 || playerMove > 8 || board[playerMove]) return [null ,null]; // invalid move

    // place player move
    board[playerMove] = 'X';

    let moves = board.filter(Boolean).length; // count non-empty fields

    // helper: check winner on board
    function checkWinner(board) {
        const combos = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        for (const [a,b,c] of combos) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
        }
        if (moves === 9) return 'T'; // tie
        return null;
    }

    const afterPlayerWinner = checkWinner(board);
    if (afterPlayerWinner) return [board, afterPlayerWinner]; // 'X' or 'T'

    // Prepare variables for bot logic
    let hasMiddle = board[4] === 'O';
    let lastMoveMemory = null;

    // lastMoveMemory must be derived from firstBotMove, was originalls set in the first move but this is a stateless function
    if (moves === 3) {
        switch (board.indexOf('O')) {
            case 1: lastMoveMemory = 6; break;
            case 3: lastMoveMemory = 8; break;
            case 4: lastMoveMemory = true; break;
            case 5: lastMoveMemory = 0; break;
            case 7: lastMoveMemory = 2; break;
        }
    }

    // utility mapping board to numeric matrix: X=1, O=2, empty=undefined
    function boardToMatrix(b) {
        const map = b.map(el => {
            if (el === 'X') return 1;
            if (el === 'O') return 2;
            return undefined;
        });
        return [
            [map[0],map[1],map[2]],
            [map[3],map[4],map[5]],
            [map[6],map[7],map[8]]
        ];
    }
    const matrixBoard = boardToMatrix(board);

    // test helpers (copied/ported from class logic)
    function test1(a,b,c) {
        const undef = [a,b,c].filter(el => el === undefined).length;
        if (undef === 1) return (a === b || a === c || b === c);
        return false;
    }
    function test2(value,a,b,c) {
        const undef = [a,b,c].filter(el => el === undefined).length;
        const amountValue = [a,b,c].filter(el => el === value).length;
        if (undef === 1 && amountValue === 2) return [a,b,c].findIndex(el => el === undefined);
        return false;
    }
    function test3(a,b,c,d,e) {
        return (a === 1 && b === 1 && c === undefined && d === undefined && e === undefined);
    }
    function checkWinConstellation(value) {
        // horizontal
        for (let i = 0; i < 3; i++) {
            if (test1(matrixBoard[i][0], matrixBoard[i][1], matrixBoard[i][2])) {
                const tes = test2(value, matrixBoard[i][0], matrixBoard[i][1], matrixBoard[i][2]);
                if (tes !== false) return 3 * i + tes;
            }
        }
        // vertical
        for (let i = 0; i < 3; i++) {
            if (test1(matrixBoard[0][i], matrixBoard[1][i], matrixBoard[2][i])) {
                const tes = test2(value, matrixBoard[0][i], matrixBoard[1][i], matrixBoard[2][i]);
                if (tes !== false) return 3 * tes + i;
            }
        }
        // diagonal \
        if (test1(matrixBoard[0][0], matrixBoard[1][1], matrixBoard[2][2])) {
            const tes = test2(value, matrixBoard[0][0], matrixBoard[1][1], matrixBoard[2][2]);
            if (tes !== false) return 4 * tes;
        }
        // diagonal /
        if (test1(matrixBoard[0][2], matrixBoard[1][1], matrixBoard[2][0])) {
            const tes = test2(value, matrixBoard[0][2], matrixBoard[1][1], matrixBoard[2][0]);
            if (tes !== false) return 2 * tes + 2;
        }
        return false;
    }
    function getRandomMove(localBoard) {
        let mv;
        do {
            mv = Math.floor(Math.random() * 9);
        } while (localBoard[mv]);
        return mv;
    }

    // Begin bot logic (ported from class._getBotMove)
    function computeBotMove() {
        // hard coded first move
        if (moves === 1) {
            switch (playerMove) {
                case 1: return 7;
                case 3: return 5;
                case 4: return 6;
                case 5: return 3;
                case 7: return 1;
                case 0:
                case 2:
                case 6:
                case 8: return 4;
            }
        }

        if (moves >= 3) {
            const posWin = checkWinConstellation(2); // bot is 2
            if (posWin !== false) return posWin;
            const posBlock = checkWinConstellation(1); // player is 1
            if (posBlock !== false) return posBlock;
        }

        // special heuristics
        if ((lastMoveMemory === true) && (playerMove === 2) && (moves === 3)) {
            return 0;
        }
        if ((playerMove === 4) && (moves === 3)) {
            return lastMoveMemory;
        }

        // pattern checks
        if (test3(matrixBoard[0][1], matrixBoard[1][0], matrixBoard[0][0], matrixBoard[0][2], matrixBoard[2][0])) return 0;
        if (test3(matrixBoard[0][1], matrixBoard[1][2], matrixBoard[0][2], matrixBoard[0][0], matrixBoard[2][2])) return 2;
        if (test3(matrixBoard[2][1], matrixBoard[1][0], matrixBoard[2][0], matrixBoard[0][0], matrixBoard[2][2])) return 6;
        if (test3(matrixBoard[2][1], matrixBoard[1][2], matrixBoard[2][2], matrixBoard[0][2], matrixBoard[2][0])) return 8;

        if (test3(matrixBoard[2][0], matrixBoard[0][2], matrixBoard[1][0], matrixBoard[0][0], matrixBoard[0][1])) return 1;
        if (test3(matrixBoard[2][0], matrixBoard[0][2], matrixBoard[2][1], matrixBoard[2][2], matrixBoard[1][2])) return 3;
        if (test3(matrixBoard[0][0], matrixBoard[2][2], matrixBoard[0][1], matrixBoard[0][2], matrixBoard[1][2])) return 5;
        if (test3(matrixBoard[0][0], matrixBoard[2][2], matrixBoard[1][0], matrixBoard[2][0], matrixBoard[2][1])) return 7;

        if (test3(matrixBoard[0][0], matrixBoard[2][1], matrixBoard[2][0], matrixBoard[2][2], matrixBoard[1][0])) {
            if (hasMiddle) return 3; else return 8;
        }
        if (test3(matrixBoard[0][2], matrixBoard[2][1], matrixBoard[2][0], matrixBoard[2][2], matrixBoard[1][2])) {
            if (hasMiddle) return 5; else return 6;
        }
        if (test3(matrixBoard[0][2], matrixBoard[1][0], matrixBoard[0][0], matrixBoard[2][0], matrixBoard[0][1])) {
            if (hasMiddle) return 1; else return 6;
        }
        if (test3(matrixBoard[2][2], matrixBoard[1][0], matrixBoard[0][0], matrixBoard[2][0], matrixBoard[2][1])) {
            if (hasMiddle) return 7; else return 0;
        }
        if (test3(matrixBoard[2][0], matrixBoard[0][1], matrixBoard[0][0], matrixBoard[0][2], matrixBoard[1][0])) {
            if (hasMiddle) return 3; else return 2;
        }
        if (test3(matrixBoard[2][2], matrixBoard[0][1], matrixBoard[0][0], matrixBoard[0][2], matrixBoard[1][2])) {
            if (hasMiddle) return 5; else return 0;
        }
        if (test3(matrixBoard[0][0], matrixBoard[1][2], matrixBoard[0][2], matrixBoard[2][2], matrixBoard[0][1])) {
            if (hasMiddle) return 1; else return 8;
        }
        if (test3(matrixBoard[2][0], matrixBoard[1][2], matrixBoard[0][2], matrixBoard[2][2], matrixBoard[2][1])) {
            if (hasMiddle) return 7; else return 2;
        }

        if (test3(matrixBoard[0][0], matrixBoard[0][2], matrixBoard[1][1], matrixBoard[1][2], matrixBoard[2][2])) return 8;
        if (test3(matrixBoard[1][2], matrixBoard[0][0], matrixBoard[1][1], matrixBoard[0][1], matrixBoard[0][2])) return 2;
        if (test3(matrixBoard[2][0], matrixBoard[2][2], matrixBoard[1][1], matrixBoard[1][0], matrixBoard[0][0])) return 0;
        if (test3(matrixBoard[0][2], matrixBoard[2][2], matrixBoard[1][1], matrixBoard[2][1], matrixBoard[2][0])) return 6;
        if (test3(matrixBoard[0][0], matrixBoard[0][2], matrixBoard[1][1], matrixBoard[1][0], matrixBoard[2][0])) return 6;
        if (test3(matrixBoard[1][2], matrixBoard[0][0], matrixBoard[1][1], matrixBoard[2][1], matrixBoard[2][2])) return 8;
        if (test3(matrixBoard[2][0], matrixBoard[2][2], matrixBoard[1][1], matrixBoard[1][2], matrixBoard[0][2])) return 2;
        if (test3(matrixBoard[0][2], matrixBoard[2][2], matrixBoard[1][1], matrixBoard[0][1], matrixBoard[0][0])) return 0;

        // fallback: random legal move
        return getRandomMove(board);
    }

    const botMove = computeBotMove();
    if (board[botMove]) {
        // Shouldn't happen; but if so, pick first empty
        for (let i=0;i<9;i++) if (!board[i]) { board[i] = 'O'; break; }
    } else {
        board[botMove] = 'O';
    }

    const afterBotWinner = checkWinner(board);
    if (afterBotWinner) return [board, afterBotWinner]; // 'O' or 'T'
    return [board, null]; // continue game
};

function drawTTTBoard(board) {
    // array of 9 elements, each 'X', 'O' or null/undefined
    const display = board.map((el, idx) => { 
        return el || (idx + 1).toString();
    });
    return (
        '```' +
        `${display[0]} | ${display[1]} | ${display[2]}\n` +
        '---------\n' +
        `${display[3]} | ${display[4]} | ${display[5]}\n` +
        '---------\n' +
        `${display[6]} | ${display[7]} | ${display[8]}` +
        '```'
    );
}

function extractTTTBoardFromText(text) {
    // extract board from text representation (as sent by drawTTTBoard)
    // returns array[9] with 'X', 'O' or null/undefined
    const noFencing = text.trim().replace(/```/g, '').trim();
    // dont worry this line is not as crazy as it looks, just functional programming at its best
    const lines = noFencing.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('---')).map(line => line.split(' | ').map(el => ["X","O"].includes(el.trim()) ? el.trim() : null));
    if (lines.length !== 3 || lines.some(line => line.length !== 3)) return null;
    return lines.flat();
}

module.exports = {
    getAuthorName,
    getAnswer,
    sendMessageAtDate,
    //getMessageContext,
    canUseCommand,
    tttDecision,
    drawTTTBoard,
    extractTTTBoardFromText
};
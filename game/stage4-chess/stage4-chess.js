export const stage4 = {
    name: 'Chess',
    type: 'game',

    levels: {
        beginner: 'Random computer moves',
        mid: 'Computer prefers captures',
        hard: 'Computer looks for strong moves'
    }
};

export const chessLevels = Object.entries(stage4.levels).map(
    ([value, description]) => ({
        value,
        description
    })
);

export const chessPieces = {
    w: {
        p: '♙',
        n: '♘',
        b: '♗',
        r: '♖',
        q: '♕',
        k: '♔'
    },

    b: {
        p: '♟',
        n: '♞',
        b: '♝',
        r: '♜',
        q: '♛',
        k: '♚'
    }
};

const getRandomMove = (moves) => {
    const randomIndex = Math.floor(Math.random() * moves.length);

    return moves[randomIndex];
};

const getCaptureMoves = (moves) => {
    return moves.filter((move) => move.captured);
};

const getPieceValue = (piece) => {
    const pieceValues = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
        k: 100
    };

    return pieceValues[piece] || 0;
};

const getStrongestMove = (moves) => {
    let strongestMove = moves[0];
    let highestValue = 0;

    moves.forEach((move) => {
        const capturedValue = getPieceValue(move.captured);

        if (capturedValue > highestValue) {
            highestValue = capturedValue;
            strongestMove = move;
        }
    });

    return strongestMove;
};

export const chooseComputerMove = (moves, level) => {
    if (!moves || moves.length === 0) {
        return null;
    }

    if (level === 'beginner') {
        return getRandomMove(moves);
    }

    const captureMoves = getCaptureMoves(moves);

    if (level === 'mid') {
        if (captureMoves.length > 0) {
            return getRandomMove(captureMoves);
        }

        return getRandomMove(moves);
    }

    if (level === 'hard') {
        if (captureMoves.length > 0) {
            return getStrongestMove(captureMoves);
        }

        return getRandomMove(moves);
    }

    return getRandomMove(moves);
};
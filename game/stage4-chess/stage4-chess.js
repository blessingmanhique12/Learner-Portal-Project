export const stage4 = {
	name: 'Chess',
	type: 'game',
	levels: {
		beginner: 'Random computer moves',
		mid: 'Computer prefers captures',
		hard: 'Computer looks for strong moves'
	}
};

export const chessLevels = Object.entries(stage4.levels).map(([value, description]) => ({ value, description }));

export const chessPieces = {
	w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
	b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
};

export const chooseComputerMove = (moves, level, random = Math.random()) => {
	if (!moves.length) return null;
	let move = moves[Math.floor(random * moves.length)];
	if (level !== 'beginner') move = moves.find((candidate) => candidate.captured) || move;
	if (level === 'hard') move = moves.find((candidate) => candidate.san.includes('#') || candidate.captured) || move;
	return move;
};

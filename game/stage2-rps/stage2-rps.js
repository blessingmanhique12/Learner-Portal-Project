export const stage2 = {
	name: 'Rock, Paper, Scissors',
	type: 'game',
	winningScore: 3,
	totalRounds: 5,
	choices: [
		{ value: 'rock', label: 'Rock', hand: '✊' },
		{ value: 'paper', label: 'Paper', hand: '✋' },
		{ value: 'scissors', label: 'Scissors', hand: '✌' }
	]
};

export const rpsChoices = stage2.choices;

export const determineWinner = (playerChoice, computerChoice) => {
	if (playerChoice === computerChoice) return 'draw';
	const winningPairs = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
	return winningPairs[playerChoice] === computerChoice ? 'win' : 'lose';
};

export const getComputerChoice = (random = Math.random()) => {
	return rpsChoices[Math.floor(random * rpsChoices.length)].value;
};

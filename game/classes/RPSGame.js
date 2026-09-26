export class RPSGame {
    constructor(winningScore = 3, totalRounds = 5) {
        this.winningScore = winningScore;
        this.totalRounds = totalRounds;

        this.playerWins = 0;
        this.roundsPlayed = 0;
        this.lastResult = '';
        this.playerChoice = '';
        this.computerChoice = '';
    }

    playRound(playerChoice, computerChoice) {
        this.playerChoice = playerChoice;
        this.computerChoice = computerChoice;

        this.lastResult = this.determineWinner(
            playerChoice,
            computerChoice
        );

        this.roundsPlayed += 1;

        if (this.lastResult === 'win') {
            this.playerWins += 1;
        }

        return this.lastResult;
    }

    determineWinner(playerChoice, computerChoice) {
        if (playerChoice === computerChoice) {
            return 'draw';
        }

        const winningChoices = {
            rock: 'scissors',
            paper: 'rock',
            scissors: 'paper'
        };

        if (winningChoices[playerChoice] === computerChoice) {
            return 'win';
        }

        return 'lose';
    }

    getComputerChoice(choices) {
        const randomIndex = Math.floor(
            Math.random() * choices.length
        );

        return choices[randomIndex].value;
    }

    hasWon() {
        return this.playerWins >= this.winningScore;
    }

    isFinished() {
        return this.roundsPlayed >= this.totalRounds;
    }

    reset() {
        this.playerWins = 0;
        this.roundsPlayed = 0;
        this.lastResult = '';
        this.playerChoice = '';
        this.computerChoice = '';
    }
}
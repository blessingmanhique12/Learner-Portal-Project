export class ChessGame {
    constructor(level = 'beginner') {
        this.level = level;
        this.selectedSquare = '';
        this.playerTurn = true;
        this.complete = false;
    }

    selectSquare(square) {
        this.selectedSquare = square;
    }

    clearSelection() {
        this.selectedSquare = '';
    }

    setLevel(level) {
        this.level = level;
    }

    completeGame() {
        this.complete = true;
    }

    isComplete() {
        return this.complete;
    }

    reset() {
        this.selectedSquare = '';
        this.playerTurn = true;
        this.complete = false;
    }
}

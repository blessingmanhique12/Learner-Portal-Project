import { QuizGame } from './QuizGame.js';
import { RPSGame } from './RPSGame.js';
import { ChessGame } from './ChessGame.js';
import { ProgressManager } from './ProgressManager.js';

export class GameManager {
    constructor(gameContent) {
        this.gameContent = gameContent;

        this.progress = new ProgressManager();

        this.htmlGame = new QuizGame(
            gameContent.htmlQuestions,
            gameContent.stage1.passPercentage
        );

        this.rpsGame = new RPSGame(
            gameContent.stage2.winningScore,
            gameContent.stage2.totalRounds
        );

        this.cssGame = new QuizGame(
            gameContent.cssQuestions,
            gameContent.stage3.passPercentage
        );

        this.chessGame = new ChessGame();

        this.javascriptGame = new QuizGame(
            gameContent.javascriptQuestions,
            gameContent.stage5.passPercentage
        );
    }

    completeStage(stageNumber) {
        this.progress.completeStage(stageNumber);
    }

    isStageComplete(stageNumber) {
        return this.progress.isStageComplete(stageNumber);
    }

    getProgress() {
        return this.progress.getTotalProgress();
    }

    resetAllGames() {
        this.htmlGame.reset();
        this.rpsGame.reset();
        this.cssGame.reset();
        this.chessGame.reset();
        this.javascriptGame.reset();

        this.progress.reset();
    }
}

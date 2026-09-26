export class QuizGame {
    constructor(questions, passPercentage = 70) {
        this.questions = questions;
        this.passPercentage = passPercentage;

        this.currentQuestion = 0;
        this.answers = [];
        this.score = 0;
    }

    getCurrentQuestion() {
        return this.questions[this.currentQuestion];
    }

    answerQuestion(answer) {
        this.answers[this.currentQuestion] = answer;
    }

    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion += 1;
            return true;
        }

        return false;
    }

    calculateScore() {
        this.score = this.questions.reduce((total, question, index) => {
            const isCorrect = this.answers[index] === question.answer;

            return isCorrect ? total + 1 : total;
        }, 0);

        return this.score;
    }

    getPercentage() {
        if (this.questions.length === 0) {
            return 0;
        }

        return Math.round(
            (this.score / this.questions.length) * 100
        );
    }

    hasPassed() {
        return this.getPercentage() >= this.passPercentage;

    }

    isFinished() {
        return this.currentQuestion === this.questions.length - 1;
    }

    reset() {
        this.currentQuestion = 0;
        this.answers = [];
        this.score = 0;
    }
}
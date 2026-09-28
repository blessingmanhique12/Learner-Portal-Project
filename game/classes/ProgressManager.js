export class ProgressManager {
    constructor() {
        this.progress = {
            stage1Complete: false,
            stage2Complete: false,
            stage3Complete: false,
            stage4Complete: false,
            stage5Complete: false
        };
    }

    completeStage(stageNumber) {
        const stageName = `stage${stageNumber}Complete`;

        if (stageName in this.progress) {
            this.progress[stageName] = true;
        }
    }

    isStageComplete(stageNumber) {
        const stageName = `stage${stageNumber}Complete`;

        return this.progress[stageName] === true;
    }

    getCompletedStages() {
        return Object.values(this.progress)
            .filter((complete) => complete)
            .length;
    }

    getTotalProgress() {
        const completedStages = this.getCompletedStages();

        return Math.round((completedStages / 5) * 100);
    }

    reset() {
        Object.keys(this.progress).forEach((stageName) => {
            this.progress[stageName] = false;
        });
    }
}

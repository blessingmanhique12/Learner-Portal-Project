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

        if (stageName in this.progress && this.canStartStage(stageNumber)) {
            this.progress[stageName] = true;
        }
    }

    canStartStage(stageNumber) {
        const stageName = `stage${stageNumber}Complete`;

        if (!(stageName in this.progress)) {
            return false;
        }

        return stageNumber === 1 || this.isStageComplete(stageNumber - 1);
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

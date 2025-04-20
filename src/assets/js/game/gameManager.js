/**
 * Менеджер управлеия игры
 */

import DataManager from "./dataManager.js";
import Player from "./player.js";
import UIController from "./UIController.js";

class GameManager {
    constructor() {
        this.round = 0;
        this.maxRounds = 3;
        this.failedAttempts = 0;
        this.maxFails = 3;

        this.started = false;

        this.player = new Player();
        this.ui = new UIController();
        this.data = new DataManager();

        this.init();
    }

    async init() {
        // /первый экран
        await this.ui.waitForKeyPress();
        this.ui.showSection('start', 'hello', this.player.getName());

        //второй экран
        await this.ui.waitForKeyPress();
        this.ui.showSection('hello', 'backtimer');
        await this.ui.runBacktimer();
        this.ui.showSection('backtimer', 'rounds');

        //раунд
        this.startGame();

    }

    /**
     * старт основной фазы игры
     */
    async startGame() {
        await this.data.loadQuestions();
        this.startNextRound();
    }


    /**
     * старт раунда
     * @returns 
     */
    async startNextRound() {
        const question = await this.data.getRandomQuestion();

        if (!question) {
            //показ результатов
            this.ui.showEnd();
            return;
        }

        this.currentQuestion = structuredClone(question);
        this.round++;
        this.ui.showRound(this.round, question.counter, question.fact);

        this.counterValues = question.counter;
        this.startCounter();

        this.ui.waitForClick().then(() => {
            this.stopCounter();
        });
    }

    startCounter() {
        this.started = true;
        this.doCycle();
    }
    stopCounter() {
        this.started = false;

        const isCorrect = this.checkText();

        const result = {
            points: isCorrect ? 350 : 50, // 50 по умолчанию + 300 при попадании
            success: isCorrect,
            round: this.round
        };

        this.player.saveResult(result);
        this.player.sendResultToServer?.(result); // заглушка на отправку

        if (isCorrect) {
            this.failedAttempts = 0;
            this.ui.showSuccess(result);
        } else {
            this.failedAttempts++;
            this.ui.showFail(result);
        }

        if (this.failedAttempts >= this.maxFails) {
            this.ui.showTooManyFails();
            return;
        }

        setTimeout(() => this.startNextRound(), 2000);
    }

    doCycle() {
        if (!this.started) return;

        this.textNext();

        this.ui.updateCounter(this.counterValues);
        setTimeout(() => this.doCycle(), 120);
    }

    textNext() {
        for (let i = this.counterValues.length - 1; i >= 0; i--) {
            let el = this.counterValues[i];
            el.current++;
            if (el.current < el.alfabet.length) break;
            else el.current = 0;
        }
    }

    checkText() {
        return this.counterValues.every((c, i) => c.current === c.target);
    }

}


export default GameManager;
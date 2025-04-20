/**
 * Менеджер управлеия игры
 */

import calculateCurrent from "./calculateCurrent.js";
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
        await this.ui.prepareSectionForRound();
        const question = await this.data.getRandomQuestion();
        if (!question) {
            alert('вопрос отсутствует');
            return;
        }

        this.currentQuestion = structuredClone(question);
        this.round++;

        this.ui.showRound(this.round, question.counter, question.fact);
        this.counterValues = question.counter;

        this.startCounter();

        // Ожидаем клик, но с таймаутом
        const timeout = 30000; // 30 сек
        const clickPromise = this.ui.waitForClick();
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), timeout));

        const result = await Promise.race([clickPromise, timeoutPromise]);

        this.stopCounter();

        if (result === 'timeout') {
            console.warn('⏰ Время ожидания истекло');
            this.handleFail(true); // true —  таймаут
        } else {
            const isCorrect = this.checkText();
            isCorrect ? this.handleSuccess() : this.handleFail(false);
        }
    }


    startCounter() {
        this.started = true;
        this.doCycle();
    }
    async stopCounter() {
        this.started = false;

        const isCorrect = this.checkText();

        const result = {
            points: isCorrect ? 300 : 0, 
            success: isCorrect,
            round: this.round
        };

        this.player.saveResult(result);
        this.player.sendResultToServer?.(result); // заглушка на отправку

        if (isCorrect) {
            this.failedAttempts = 0;
            await this.ui.showSuccess(result);
        } else {
            this.failedAttempts++;
            await this.ui.showFail(result);
        }

        if (this.failedAttempts >= this.maxFails) {
            this.ui.showTooManyFails();
            return;
        }

    }

    async handleSuccess() {
        const result = {
            points: 300,
            success: true,
            round: this.round
        };

        this.failedAttempts = 0;
        await this.ui.showSuccess(result);


        if(this.round >= this.maxRounds){
            this.ui.showEnd(this.player.getScore());
        }else{
            this.startNextRound();
        }
    }

   async handleFail(isTimeout = false) {
        const result = {
            points: 0,
            success: false,
            round: this.round,
            timeout: isTimeout
        };

        await this.ui.showFail(result);

        this.ui.prepareSectionForRound();
        if (this.failedAttempts >= this.maxFails) {
            this.ui.showTooManyFails();
            return;
        }
        if(this.round >= this.maxRounds){
            this.ui.showEnd(this.player.getScore());
        }else{
            this.startNextRound();
        }
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
/**
 * Менеджер управлеия игры
 */

import DataManager from "./dataManager.js";
import Player from "./player.js";
import UIController from "./UIController.js";
import Swal from 'sweetalert2';

class GameManager {

    static gameToken = 'gAmEToKeN1';
    static adminKey = 'Q3z8vKp9N2w5R6s1Xy7L';

    constructor() {
        this.round = 0;
        this.maxRounds = 3;
        this.failedAttempts = 0;
        this.maxFails = 3;
        this.socketStarted = false;

        this.started = false;

        this.player = new Player();
        this.ui = new UIController();
        this.data = new DataManager();

        this.ws = null;

        this.init();
    }

    async init() {
        // /первый экран
        await this.connectWebSocket();
        this.ui.delay(1500)
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
     * веб сокет
     * @returns  
     */
    connectWebSocket() {
        return new Promise((resolve, reject) => {
            // const wsUrl = `wss://gameserver2.kemo.ru/ws?game_token=${GameManager.gameToken}`;
            const wsUrl = `wss://cf.2gis.ru/ws?game_token=${GameManager.gameToken}`;
            this.ws = new WebSocket(wsUrl);

            console.log(wsUrl);
            const authPayload = {
                admin_key: GameManager.adminKey
            };

            this.ws.onopen = () => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify(authPayload));
                    console.log('[WS] Подключено. Отправляем admin_key: ', authPayload);
                } else {
                    console.error('[WS] WebSocket не в состоянии OPEN');
                }
            };

            this.ws.onmessage = async (event) => {
                const data = JSON.parse(event.data);

                switch (data.event) {
                    case 'auth_ok':
                        console.log('[WS] Аутентификация успешна');
                        break;

                    case 'auth_failed':
                        console.error('[WS] Ошибка авторизации:', data.message);
                        this.ws.close();
                        reject(data.message);
                        break;

                    case 'game_started':
                        this.socketStarted = true;
                        console.log('[WS] Получено событие game_started', data.payload);
                        this.player.initializePlayer(data.payload);
                        resolve();
                        break;
                    case 'game_ended':
                        if(this.socketStarted){
                            console.log('[WS] Получено событие game_ended', data.payload);
                            if (this.player.comparePlayer(data.payload)) {
                                Swal.fire({
                                    text: 'Игра остановлена администратором',
                                }).then(() => {
                                    window.location.reload();
                                });
                            }
                            resolve();

                        }
                        break;

                    default:
                        console.warn('[WS] Неизвестное событие:', data);
                        break;
                }
            };

            this.ws.onerror = (error) => {
                console.error('[WS] Ошибка соединения:', error);
                reject(error);
            };

            this.ws.onclose = (event) => {
                console.warn(`[WS] Соединение закрыто. Код: ${event.code}, причина: ${event.reason}`);
                if (event.code === 1008) { // 1008 обычно для ошибок авторизации
                    console.error('[WS] Ошибка авторизации - проверьте admin_key');
                }
            };
        });
    }

    /**
     * старт основной фазы игры
     */
    async startGame() {
        // await this.data.loadQuestions();
        this.startNextRound();
    }

    /**
     * старт раунда
     * @returns 
     */
    async startNextRound() {
        const answer = await this.player.getNextRound();
        //    await  console.log(answer.gameSpecificData.text.fact);
        //    await  console.log(answer.gameSpecificData.text.counter);
        const question = await answer.gameSpecificData.text;

        // console.log(answer.data.data.game_specific_data.text.fact);
        //конец заглушки

        await this.ui.prepareSectionForRound();
        // const question = await this.data.getRandomQuestion();
        // console.log(question);
        // question.counter = await this.data.calculateInitialCurrents(question.counter);
        // console.log(question.counter);

        if (!question) {
            alert('вопрос отсутствует');
            return;
        }

        this.currentQuestion = structuredClone(question);
        this.round++;

        this.ui.showRound(this.round, question.counter, question.fact);
        this.counterValues = question.counter;
        // if(this.round != 1){
        await this.ui.waitForKeyPress();
        // }else{
        // await this.ui.delay(2000);
        // }
        this.startCounter();

        // Ожидаем клик, с таймаутом
        const timeout = 20000;
        const clickPromise = this.ui.waitForClick();
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), timeout));

        const result = await Promise.race([clickPromise, timeoutPromise]);

        this.stopCounter();

        if (result === 'timeout') {
            console.warn('Время ожидания истекло');
            this.handleFail(true); // true —  таймаут
        } else {
            const isCorrect = this.checkText();
            isCorrect ? this.handleSuccess() : this.handleFail(false);
        }
    }

    /**
     * старт счетчика
     */
    startCounter() {
        this.started = true;
        this.doCycle();
    }

    /**
   * стоп счетчика
   */
    async stopCounter() {
        this.started = false;

        const isCorrect = this.checkText();

        const result = {
            points: isCorrect ? 5 : 0,
            success: isCorrect,
            round: this.round
        };

        // this.player.saveResult(result);
        this.player.sendResultToServer?.(isCorrect, result.round);

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

    /**
   * успех
   */
    async handleSuccess() {
        const result = {
            points: 5,
            success: true,
            round: this.round
        };

        this.failedAttempts = 0;
        await this.ui.showSuccess(result);


        if (this.round >= this.maxRounds) {
            this.ui.showEnd(this.player.getScore());
        } else {
            this.startNextRound();
        }
    }

    /**
   * неудача + обработка по таймеру
   */
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
        if (this.round >= this.maxRounds) {
            this.ui.showEnd(this.player.getScore());
        } else {
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
/**
 * Менеджер управлеия игры
 */

import calculateCurrent from "./calculateCurrent.js";
import DataManager from "./dataManager.js";
import Player from "./player.js";
import UIController from "./UIController.js";

class GameManager {

    static gameToken = 'gAmEToKeN1';
    static adminKey = 'Q3z8vKp9N2w5R6s1Xy7L';

    constructor() {
        this.round = 0;
        this.maxRounds = 3;
        this.failedAttempts = 0;
        this.maxFails = 3;

        this.started = false;

        this.player = new Player();
        this.ui = new UIController();
        this.data = new DataManager();

        this.ws = null;

        this.init();
    }

    async init() {
        // /первый экран
        await this.fetchNextRound();
        // await this.ui.waitForKeyPress();

        await this.connectWebSocket();
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
     * тестово получаем данные для раунда
     * @returns 
     */
    async fetchNextRound() {
        const sessionToken = '9oyITlF4Vd';
        const playerToken = 'tokn000005';
        const url = `https://gameserver2.kemo.ru/api/games/${GameManager.gameToken}/session/${sessionToken}/next`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Player-Token': playerToken,
                }
            });

            const result = await response.json();
            console.log('[API] Ответ на запрос следующего раунда:', result);

            const data = result.data;

            if (!data.success) {
                console.warn('[API] Ошибка при получении следующего раунда:', data.message);
                return null;
            }

            return {
                roundNumber: data.round_number,
                text: data.game_specific_data.text,
                targetTimeMs: data.game_specific_data.target_time_ms,
                factId: data.game_specific_data.fact_id
            };

        } catch (error) {
            console.error('[API] Ошибка запроса следующего раунда:', error);
            return null;
        }
    }


    /**
     * веб сокет
     * @returns  
     */
    connectWebSocket() {
        return new Promise((resolve, reject) => {
            const wsUrl = `wss://gameserver2.kemo.ru/ws?game_token=${GameManager.gameToken}`;
            this.ws = new WebSocket(wsUrl);

            console.log(wsUrl);
            const authPayload = {
                admin_key: GameManager.adminKey
            };

            this.ws.onopen = () => {
                setTimeout(() => {
                    this.ws.send(JSON.stringify(authPayload));
                    console.log('[WS] Подключено. Отправляем admin_key: ', authPayload);
                }, 100);
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
                        console.log('[WS] Получено событие game_started', data.payload);

                        this.player.setFromPayload(data.payload.player); // например, установить badge_id, name и player_token
                        this.sessionToken = data.payload.session_token;

                        this.ui.showSection('start', 'hello', this.player.getName());

                        await this.ui.delay(1000); // можно анимацию
                        this.ui.showSection('hello', 'backtimer');
                        await this.ui.runBacktimer();

                        this.ui.showSection('backtimer', 'rounds');
                        await this.startGame();
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

            this.ws.onclose = () => {
                console.warn('[WS] Соединение закрыто');
            };
        });
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

        // Ожидаем клик, с таймаутом
        const timeout = 30000; 
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
            points: isCorrect ? 300 : 0,
            success: isCorrect,
            round: this.round
        };

        this.player.saveResult(result);
        // this.player.sendResultToServer?.(result); // заглушка на отправку

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
            points: 300,
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
import AdminAuth from "../auth/adminAuth.js";

class Player {
    static gameToken = 'gAmEToKeN1';
    static adminKey = 'Q3z8vKp9N2w5R6s1Xy7L';

    constructor() {
        this.token = null;
        this.name = null;
        this.badge = null;
        this.sessionToken = null;
        this.answers = [];
        this.scope = 0;
    }

    /**
     * Установить данные игрока при старте игры
     */
    initializePlayer(data) {
        this.token = data.player.player_token;
        this.name = data.player.name;
        this.badge = data.player.badge_id;
        this.sessionToken = data.session_token;

        console.log('[Player] Данные игрока установлены:', {
            token: this.token,
            name: this.name,
            badge: this.badge,
            sessionToken: this.sessionToken
        });
    }

    /**
     * сохранение результата
     * @param {*} result 
     */
    saveResult(result) {
        this.scope += result.points;
        this.answers.push(result.points);
        console.log('данные сохранены' + this.scope)
    }

    /**
     * получение данных о баллах
     * @returns 
     */
    getScore() {
        return this.scope;
    }

    /**
     * получение имени
     * @returns 
     */
    getName() {
        const arr = this.name.split(" ")
        return arr[0];
    }

    /**
    * Отправляет результат раунда на сервер
    * @param {boolean} success - Успешно ли выполнено действие
    * @param {number} roundNumber - Номер раунда
    * @returns {Promise<{
    *   outcome: string,
    *   sessionStatus: string,
    *   scoreChange: number,
    *   sessionScore: number,
    *   previousBestScore?: number,
    *   updatedBestScore?: number,
    *   scoreDifference?: number,
    *   resultData: {
    *     correct: boolean,
    *     is_first_success: boolean,
    *     target_time_ms: number,
    *     actual_time_ms: number|null
    *   }
    * }|null>}
    */
    async sendResultToServer(success, roundNumber) {
        const token = AdminAuth.getToken();

        if (!token) {
            console.error('[AUTH] Нет токена администратора');
            window.location.href = '/auth.html';
            return;
        }

        const url = `https://gameserver2.kemo.ru/api/games/${Player.gameToken}/session/${this.sessionToken}/submit`;

        console.log(`[API] Отправка результата раунда ${roundNumber}:`, {
            success,
            'Authorization': `Bearer ${token}`,
            // gameToken: Player.gameToken,
            sessionToken: this.sessionToken
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Player-Token': this.token
                },
                body: JSON.stringify({
                    round_number: roundNumber,
                    payload: { success }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('[API] Ответ сервера:', result);

            if (!result.data.success) {
                console.warn('[API] Ошибка в ответе:', result.data.message, 'Code:', result.data.code);
                return null;
            }

            // Сохраняем результат
            this.saveResult({ points: result.data.score_change });

            // Формируем возвращаемый объект
            return {
                outcome: result.data.outcome,
                sessionStatus: result.data.session_status,
                scoreChange: result.data.score_change,
                sessionScore: result.data.session_score,
                ...(result.data.previous_best_score !== undefined && {
                    previousBestScore: result.data.previous_best_score,
                    updatedBestScore: result.data.updated_best_score,
                    scoreDifference: result.data.score_difference
                }),
                resultData: result.data.result_data
            };

        } catch (error) {
            console.error('[API] Ошибка при отправке результата:', error);
            return null;
        }
    }

      /**
     * метод для сервера - не актуально, но нужен для правильный работы сервера. 
     * @returns 
     */
      async getNextRound() {
        const url = `https://gameserver2.kemo.ru/api/games/${Player.gameToken}/session/${this.sessionToken}/next`;
        
        console.log(`[API] Запрос следующего раунда для сессии ${this.sessionToken}`);
    
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Player-Token': this.token
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const result = await response.json();
            console.log('[API] Ответ сервера:', result);
    
            if (!result.data.success) {
                console.warn('[API] Ошибка в ответе:', result.data.message, 'Code:', result.data.code);
                
                // Специальная обработка для завершенных раундов
                if (result.data.code === 'NO_MORE_ROUNDS') {
                    return { noMoreRounds: true, message: result.data.message };
                }
                
                return null;
            }
    
            // Форматируем данные для удобства использования
            return {
                sessionToken: result.data.session_token,
                gameToken: result.data.game_token,
                status: result.data.status,
                roundNumber: result.data.round_number,
                gameSpecificData: {
                    factId: result.data.game_specific_data.fact_id,
                    text: result.data.game_specific_data.text,
                    targetTimeMs: result.data.game_specific_data.target_time_ms
                }
            };
    
        } catch (error) {
            console.error('[API] Ошибка при запросе следующего раунда:', error);
            return null;
        }
    }
    
}

export default Player;
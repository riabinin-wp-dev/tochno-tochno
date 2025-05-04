import userData from "./websocket.js";

class Player {
    static gameToken = 'gAmEToKeN1';
    static adminKey = 'Q3z8vKp9N2w5R6s1Xy7L';

    constructor() {
        this.token = userData.token;
        this.name = userData.name;
        this.answers = [];
        this.scope = 50;
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
    getName(){
        return this.name;
    }

    /**
     * отправка на сервер
     * @param {*} result 
     */
    async sendResultToServer(success, roundNumber, session_token, player_token) {
        console.log('Отправка на сервер', result);
        const sessionToken = '9oyITlF4Vd';
        const playerToken = 'tokn000005';

        // Здесь будет `fetch('/api/result', { method: 'POST', body: JSON.stringify(result) })`
        const url = `https://gameserver2.kemo.ru/api//games/${Player.gameToken}/session/${sessionToken}/submit`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Player-Token': playerToken
                },
                body: JSON.stringify({
                    round_number: roundNumber,
                    payload: {
                        success: success
                    }
                })
            });
    
            const result = await response.json();
            console.log('[API] Ответ на отправку результата:', result);
    
            if (!result.data.success) {
                console.warn('[API] Ошибка при отправке результата:', result.data.message);
                return null;
            }
    
            const { score_change, session_score, outcome, session_status, result_data } = result.data;
    
            // Обновим игрока
            this.player.saveResult({ points: score_change });
    
            // Вернем информацию, если нужно дальше обрабатывать
            return {
                outcome,
                sessionStatus: session_status,
                scoreChange: score_change,
                sessionScore: session_score,
                resultData: result_data
            };
    
        } catch (error) {
            console.error('[API] Ошибка при отправке результата раунда:', error);
            return null;
        }
    }
}

export default Player;
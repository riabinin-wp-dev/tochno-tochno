import userData from "./websocket.js";

class Player {
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
    sendResultToServer(result) {
        console.log('Отправка на сервер', result);
        // Здесь будет `fetch('/api/result', { method: 'POST', body: JSON.stringify(result) })`
    }
}

export default Player;
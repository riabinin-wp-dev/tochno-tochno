import userData from "./websocket.js";

class Player {
    constructor() {
        this.token = userData.token;
        this.name = userData.name;
        this.answers = [];
        this.scope = 50;
    }

    saveResult(result) {
        this.scope += result.points;
        this.answers.push(result.points);
        console.log('данные сохранены' + this.scope)
    }

    getScore() {
        return this.scope;
    }

    getName(){
        return this.name;
    }

    sendResultToServer(result) {
        console.log('Отправка на сервер', result);
        // Здесь будет `fetch('/api/result', { method: 'POST', body: JSON.stringify(result) })`
    }
}

export default Player;
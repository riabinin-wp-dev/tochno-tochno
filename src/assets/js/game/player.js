import userData from "./websocket.js";

class Player {
    constructor() {
        this.token = userData.token;
        this.name = userData.name;
        this.scope = 0;
    }

    saveResult(result) {
        this.scope += result.points;
        this.answers.push(result);
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
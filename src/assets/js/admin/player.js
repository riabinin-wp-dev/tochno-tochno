import PlayerPool from "./sessionPool.js";

/**
 * класс профиля игрока
 */
class Player {
    static BASE_URL = 'https://gameserver2.kemo.ru/api';

    constructor(playerToken = null) {
        this.playerToken = playerToken;
    }

    /**
     * Регистрация нового игрока
     * @param {*} badgeId 
     * @param {*} name 
     * @param {*} telegramNick 
     * @returns 
     */

    static async register(badgeId, name, telegramNick = null) {
        const payload = {
            badge_id: String(badgeId),
            name: name
        };

        if (telegramNick) {
            payload.telegram_nick = telegramNick;
        }

        const response = await fetch(`${Player.BASE_URL}/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.data.success) {
            const player = new Player(result.data.player_token);
            player.badgeId = result.data.badge_id;
            player.name = result.data.name;
            player.telegramNick = result.data.telegram_nick;
            player.token = result.data.player_token;
            console.log('Игрок зарегистрирован:', player);

            //ставим в очередь
            const pool = await PlayerPool.addToPool(result.data.player_token);

            if (pool && pool.success) {
                const poolInstance = new PlayerPool(); // или передай заранее, если уже создан
                await poolInstance.loadPool();
            }
            return player;
       
        } else if (result.data.success == false && result.data.code == 'DUPLICATE_BADGE_ID') {
            console.warn(result.data.message);
            console.log(result);
            alert('Ошибка: ' + result.data.message);

            //ставим в очередь
            // const pool = await PlayerPool.addToPool(playerToken);

            // if (pool && pool.success) {
                // const poolInstance = new PlayerPool(); // или передай заранее, если уже создан
                // await poolInstance.loadPool();
            // }

            return null;
            
        } else if(result.data.code === 'VALIDATION_ERROR'){
            alert('Непройдена валидация' + result.data.details)
            console.warn('🔍 Детали ошибки:', result.data.details);
            return null;
            
        } else {
            alert("Ошибка: " + result.data.message);
            console.warn('Ошибка регистрации:', result.data.message)
            return null;
        }
    }

    /**
     * поиск игрока
     * @param {*} badgeId 
     */
    static async search(badgeId) {

        const response = await fetch(`${Player.BASE_URL}/players/badge/${badgeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        const result = await response.json();
        return result;
    }

    //  Получить информацию о себе
    async fetchProfile() {
        if (!this.playerToken) {
            throw new Error('🔒 Токен игрока не задан.');
        }

        const response = await fetch(`${Player.BASE_URL}/players/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Player-Token': this.playerToken,
                // Можно добавить X-Game-Token, если потребуется
            }
        });

        const result = await response.json();

        if (result.data?.success) {
            console.log('📄 Профиль игрока:', result.data);
            return result.data;
        } else {
            console.warn('⚠️ Ошибка получения профиля:', result.data?.message);
            return null;
        }
    }
}


export default Player;
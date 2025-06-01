import PlayerPool from "./sessionPool.js";
import Swal from 'sweetalert2';

/**
 * класс профиля игрока
 */
class Player {
    // static BASE_URL = 'https://gameserver2.kemo.ru/api';
    static BASE_URL = 'https://cf.2gis.ru/api';

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

            // Сохраняем игрока в localStorage
            Player.savePlayerToLocalStorage({
                badge_id: player.badgeId,
                name: player.name,
                player_token: player.token,
                telegram_nick: player.telegramNick
            });

            console.log('Игрок зарегистрирован:', player);

            //ставим в очередь
            const pool = await PlayerPool.addToPool(result.data.player_token);

            if (pool && pool.success) {
                const poolInstance = new PlayerPool();
                await poolInstance.loadPool();
            }
            return player;

        } else if (result.data.success == false && result.data.code == 'DUPLICATE_BADGE_ID') {
            console.warn(result.data.message);
            console.log(result);
            // alert('Ошибка: ' + result.data.message);

            Swal.fire({
                // icon: 'error', // или 'success', 'error', 'warning', 'question'
                // title: 'Ошибка',
                text: result.data.message,
            });

            //ставим в очередь
            // const pool = await PlayerPool.addToPool(playerToken);

            // if (pool && pool.success) {
            // const poolInstance = new PlayerPool(); 
            // await poolInstance.loadPool();
            // }

            return null;

        } else if (result.data.code === 'VALIDATION_ERROR') {
            // alert('Непройдена валидация' + result.data.details)
             Swal.fire({
                icon: 'error', // или 'success', 'error', 'warning', 'question'
                title: 'Непройдена валидация',
                text: result.data.message,
            });
            console.warn('🔍 Детали ошибки:', result.data.details);
            return null;

        } else {
            // alert("Ошибка: " + result.data.message);
              Swal.fire({
                icon: 'error', // или 'success', 'error', 'warning', 'question'
                title: 'Ошибка',
                text: result.data.message,
            });
            console.warn('Ошибка регистрации:', result.data.message)
            return null;
        }
    }

    /**
     *  Сохраняем игрока в localStorage
     * @param {*} playerData 
     */
    static savePlayerToLocalStorage(playerData) {
        try {
            const players = Player.getPlayersFromLocalStorage();
            const existingPlayerIndex = players.findIndex(p => p.badge_id === playerData.badge_id);

            if (existingPlayerIndex !== -1) {
                players[existingPlayerIndex] = playerData;
            } else {
                players.push(playerData);
            }

            localStorage.setItem('registeredPlayers', JSON.stringify(players));
        } catch (error) {
            console.error('Ошибка при сохранении игрока:', error);
        }
    }

    /**
     * Получаем всех игроков из localStorage
     * @returns 
     */
    static getPlayersFromLocalStorage() {
        try {
            const playersJSON = localStorage.getItem('registeredPlayers');
            return playersJSON ? JSON.parse(playersJSON) : [];
        } catch (error) {
            console.error('Ошибка при получении игроков:', error);
            return [];
        }
    }

    /**
     * Получаем игрока по badge_id
     * @param {*} badgeId 
     * @returns 
     */
    static getPlayerByBadgeId(badgeId) {
        const players = Player.getPlayersFromLocalStorage();
        return players.find(player => player.badge_id === String(badgeId));
    }

    /**
     * Удаляем игрока из localStorage по badge_id
     * @param {*} badgeId 
     * @returns 
     */
    static removePlayerFromLocalStorage(badgeId) {
        try {
            const players = Player.getPlayersFromLocalStorage();
            const updatedPlayers = players.filter(player => player.badge_id !== String(badgeId));
            localStorage.setItem('registeredPlayers', JSON.stringify(updatedPlayers));
            return true;
        } catch (error) {
            console.error('Ошибка при удалении игрока:', error);
            return false;
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
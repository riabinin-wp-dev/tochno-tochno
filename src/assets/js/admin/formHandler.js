import Player from "./player.js";
import PlayerPool from "./sessionPool.js";
/**
 * добавление игрока
 */
class PlayerFormHandler {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        if (!this.form) throw new Error(`Форма не найдена: ${formSelector}`);
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.setupBadgeIdInputListener();
    }

    /**
     * сабмит формы
     * @param {*} event 
     * @returns 
     */
    async handleSubmit(event) {
        event.preventDefault();
        const badgeId = this.form.querySelector('#player_id')?.value.trim();
        const name = this.form.querySelector('#player_name')?.value.trim();
        const telegram = this.form.querySelector('#player_telegram')?.value.trim();

        if (!badgeId || !name) {
            alert('ID на бейдже и имя обязательны.');
            return;
        }

        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Добавление...';

        try {
            const player = await Player.register(badgeId, name, telegram || null);
            console.log(player?.token);

            if (player && player.name) {
                alert(`Игрок зарегистрирован: ${player.name}`);
                this.form.reset();
            } else {
                alert('Ошибка регистрации игрока.');
            }
        } catch (error) {
            console.error('Ошибка при регистрации игрока:', error);
            alert('Произошла ошибка при регистрации. Попробуйте снова.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Добавить';
        }
    }

    /**
     * слушаем ввод для поиска по id в локальном хранилище.
     */
    async setupBadgeIdInputListener() {
        const badgeIdInput = this.form.querySelector('#player_id');

        badgeIdInput.addEventListener('input', async (event) => {
            const badgeId = event.target.value.trim();

            if (badgeId.length === 4) {
                const existingPlayer = Player.getPlayerByBadgeId(badgeId);
                if (existingPlayer) {
                    const shouldReRegister = confirm(
                        `Игрок "${existingPlayer.name}" найден в базе.\nХотите встать в очередь повторно?`
                    );

                    if (shouldReRegister) {
                        try {
                            const addResult = await PlayerPool.addToPool(existingPlayer.player_token);
                            console.log('Результат добавления в пул:', addResult);

                            // 2. Загружаем обновленный пул
                            const poolInstance = new PlayerPool();
                            await poolInstance.loadPool();
                        } catch (error) {
                            console.error('Ошибка в цепочке добавления игрока:', error);
                            throw error; // Пробрасываем ошибку дальше или обрабатываем
                        }
                    }
                }
            }
        });
    }

}

export default PlayerFormHandler;

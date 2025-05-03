import Player from "./player.js";
/**
 * добавление игрока
 */
class PlayerFormHandler {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        if (!this.form) throw new Error(`Форма не найдена: ${formSelector}`);
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

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

        const player = await Player.register(badgeId, name, telegram || null);
        console.log(player.token);

        if (player) {
            alert(`Игрок зарегистрирован: ${player.name}`);
        } 
        this.form.reset();

        submitButton.disabled = false;
        submitButton.textContent = 'Добавить';
    }
}

export default PlayerFormHandler;

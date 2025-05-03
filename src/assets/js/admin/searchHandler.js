import Player from "./player.js";

/**
 * поиск игрока
 */
class PlayerSearchHandler {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        if (!this.form) throw new Error(`Форма не найдена: ${formSelector}`);
        this.form.addEventListener('submit', this.searchSubmit.bind(this));
    }

    async searchSubmit(event) {
        event.preventDefault();
        const badgeId = this.form.querySelector('#search_player_id')?.value.trim();

        if (!badgeId) {
            alert('ID на бейдже обязателен.');
            return;
        }

        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Поиск...';

        const player = await Player.search(badgeId);
        console.log(player);

        if (player.data.success == true && player.data.exists == true) {
            const container = document.getElementById('admin_container');
            const list = `
                <li>
                    <span></span>
                    <span>${player.data.player.badge_id}</span>
                    <span>${player.data.player.name}</span>
                    <div class="control">
                        <span></span>
                        <span></span>
                    </div>
                </li>  
                <li class="reset" style="cursor:pointer;">
                    <span style="pointer-events:none;">Сбросить результаты поиска</span>
                </li>`;
            container.innerHTML = '';
            container.insertAdjacentHTML('beforeend', list);
        } else if (player.data.success == true && player.data.exists == false) {
            alert('Игрок с таким badge_id не найден')
        } else {
            alert("Ошибка: " + player.data.message);
            console.warn(player)
        }

        this.form.reset();
        submitButton.disabled = false;
        submitButton.textContent = 'Найти';
    }
}

export default PlayerSearchHandler;

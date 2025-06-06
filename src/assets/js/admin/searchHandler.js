import Player from "./player.js";
import PlayerPool from "./sessionPool.js";
import Swal from 'sweetalert2';

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
            // alert('ID на бейдже обязателен.');
            Swal.fire({
                icon: 'warning', // или 'success', 'error', 'warning', 'question'
                title: 'Предупреждение',
                text: `ID на бейдже обязателен.`,
            });
            return;
        }

        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Поиск...';

        const player = await Player.search(badgeId);
        console.log(player);

        if (player.data.success === true && player.data.exists === true) {
            const token = player.data.player.player_token;
            const container = document.getElementById('admin_container');
            const allItems = container.querySelectorAll('li');

            let found = false;
            allItems.forEach(li => {
                if (li.dataset.token === token) {
                    li.style.display = 'grid'; // показать найденный
                    found = true;
                } else if (!li.classList.contains('reset')) {
                    li.style.display = 'none'; // скрыть остальные (не сброс)
                }
            });

            if (!found) {
                // alert('Игрок найден, но элемент в списке не отображён.');
                console.log(player.data.player)
                const name = player.data.player.name;
                const player_token = player.data.player.player_token;

                const shouldReRegister = await Swal.fire({
                    title: 'Вопрос',
                    text: `Игрок "${name}" найден в базе.\nХотите встать в очередь?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Да',
                    cancelButtonText: 'Отмена',
                });


                if (shouldReRegister) {
                    try {
                        const addResult = await PlayerPool.addToPool(player_token);
                        console.log('Результат добавления в пул:', addResult);

                        // 2. Загружаем обновленный пул
                        const poolInstance = new PlayerPool();
                        await poolInstance.loadPool();
                    } catch (error) {
                        console.error('Ошибка в цепочке добавления игрока:', error);
                        throw error; // Пробрасываем ошибку дальше или обрабатываем
                    }
                }

                submitButton.disabled = false;
                submitButton.textContent = 'Найти';
                return;
            }

            // добавляем кнопку сброса, если её ещё нет
            if (!container.querySelector('li.reset')) {
                const resetBtn = `
                    <li class="reset" style="cursor:pointer;">
                        <span style="pointer-events:none;">Сбросить результаты поиска</span>
                    </li>`;
                container.insertAdjacentHTML('beforeend', resetBtn);
            }

        } else if (player.data.success === true && player.data.exists === false) {
            // alert('Игрок с таким badge_id не найден.');
            Swal.fire({
                icon: 'warning', // или 'success', 'error', 'warning', 'question'
                title: 'Игрок с таким badge_id не найден.',
                text: player.data.message,
            });

        } else {
            // alert("Ошибка: " + player.data.message);
            console.warn(player);

              Swal.fire({
                icon: 'error', // или 'success', 'error', 'warning', 'question'
                title: 'Ошибка',
                text: player.data.message,
            });
        }

        this.form.reset();
        submitButton.disabled = false;
        submitButton.textContent = 'Найти';
    }


    createResetButton(container) {
        if (!container.querySelector('.reset')) {
            const resetBtn = document.createElement('li');
            resetBtn.className = 'reset';
            resetBtn.style.cursor = 'pointer';
            resetBtn.innerHTML = `<span style="pointer-events:none;">Сбросить результаты поиска</span>`;
            container.appendChild(resetBtn);
        }
    }

    // async searchSubmit(event) {
    //     event.preventDefault();
    //     const badgeId = this.form.querySelector('#search_player_id')?.value.trim();

    //     if (!badgeId) {
    //         alert('ID на бейдже обязателен.');
    //         return;
    //     }

    //     const submitButton = this.form.querySelector('button[type="submit"]');
    //     submitButton.disabled = true;
    //     submitButton.textContent = 'Поиск...';

    //     const player = await Player.search(badgeId);
    //     console.log(player);

    //     if (player.data.success == true && player.data.exists == true) {
    //         const container = document.getElementById('admin_container');
    //         const list = `
    //             <li>
    //                 <span></span>
    //                 <span>${player.data.player.badge_id}</span>
    //                 <span>${player.data.player.name}</span>
    //                 <div class="control">
    //                     <span></span>
    //                     <span></span>
    //                 </div>
    //             </li>  
    //             <li class="reset" style="cursor:pointer;">
    //                 <span style="pointer-events:none;">Сбросить результаты поиска</span>
    //             </li>`;
    //         container.innerHTML = '';
    //         container.insertAdjacentHTML('beforeend', list);
    //     } else if (player.data.success == true && player.data.exists == false) {
    //         alert('Игрок с таким badge_id не найден')
    //     } else {
    //         alert("Ошибка: " + player.data.message);
    //         console.warn(player)
    //     }

    //     this.form.reset();
    //     submitButton.disabled = false;
    //     submitButton.textContent = 'Найти';
    // }
}

export default PlayerSearchHandler;

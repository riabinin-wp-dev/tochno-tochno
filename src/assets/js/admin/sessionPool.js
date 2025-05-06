import AdminAuth from "../auth/adminAuth.js";

class PlayerPool {
    static BASE_URL = 'https://gameserver2.kemo.ru/api';
    static gameToken = 'gAmEToKeN1';
    static adminKey = 'Q3z8vKp9N2w5R6s1Xy7L';
    static containerSelector = 'admin_container';


    constructor() {
        this.container = document.getElementById(PlayerPool.containerSelector);
        this.loadPool();
    }

    /**
     * загрузка пула
     * @returns 
     */
    async loadPool() {
        const token = AdminAuth.getToken();

        if (!token) {
            console.error('[AUTH] Нет токена администратора');
            window.location.href = '/auth.html';
            return;
        }
        const response = await fetch(`${PlayerPool.BASE_URL}/admin/games/${PlayerPool.gameToken}/pool?status=started,pending,completed, stopped_by_admin, abandoned`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                // 'X-Admin-API-Key': PlayerPool.adminKey,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            console.error('Ошибка загрузки пула');
            return;
        }
        console.log(response)
        const pool = await response.json();
        this.render(pool);
    }

    /**
     * рендер всех игроков, (первичная загрузка или апдейт)
     * @param {*} pool 
     */
    render(pool) {
        this.container.innerHTML = '';
        let pendingsCount = 0;
        console.log(pool.data.sessions)
        pool.data.sessions.forEach((session, index) => {

            //парсим время
            const date = new Date(session.started_at);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

            let controls = '';

            if (session.status == 'pending') {
                pendingsCount++;
                controls = `<div class="control" data-session=${session.session_token}>
                            <span>Очередь ${pendingsCount}</span>
                            <button type="button" class="start"></button>
                        </div>`;

            } else if (session.status == 'completed') {
                controls = `<div class="control" data-session=${session.session_token}>
                            <span class="coin">coin</span>
                            <span class="time">${formattedTime}</span>
                        </div>`;

            } else if (session.status == 'started') {
                controls = `<div class="control" data-session=${session.session_token}>
                            <span>Идет игра</span>
                            <button type="button" class="stop"></button>
                        </div>`;

            } else if (session.status == 'stopped_by_admin' || session.status == 'stopped_by_admin') {
                controls = `<div class="control" data-session=${session.session_token}>
                                <span class="coin">coin</span>
                                <span class="time">${formattedTime}</span>
                            </div>`;
            }

            const html = `
                <li class="${session.status == 'started' ? 'active' : ''} " data-token=${session.player_token}>
                    <span>${index}</span>
                    <span>${session.badge_id}</span>
                    <span>${session.name}</span>
                    ${controls}
                </li>`;
            this.container.insertAdjacentHTML('beforeend', html);
        });
        // this.setupControls();
    }

    /**
     * добавление игрока в пул (используется в начале при регистрации 
     * и при повторном обращении к окну добавления игрока)
     * @param {*} playerToken 
     * @returns 
     */

    static async addToPool(playerToken) {
        const token = AdminAuth.getToken();

        if (!token) {
            console.error('[AUTH] Нет токена администратора');
            window.location.href = '/auth.html';
            return;
        }

        if (!playerToken) {
            console.error('Токен игрока обязателен для добавления в пул');
            return null;
        }

        const body = {
            player_token: playerToken
        };

        try {
            const response = await fetch(`${PlayerPool.BASE_URL}/admin/games/${PlayerPool.gameToken}/pool`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'X-Admin-API-Key': PlayerPool.adminKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!data?.data?.success) {
                console.warn('Не удалось добавить в пул:', data.data.message);
                return data.data; // Вернём, чтобы можно было проверить код ошибки (например, ALREADY_IN_POOL_OR_ACTIVE)
            }

            console.log('Игрок успешно добавлен в пул:', data.data);
            alert(data.data.message)
            return data.data; // Включает session_token и прочее

        } catch (error) {
            console.error('Ошибка при добавлении в пул:', error);
            return null;
        }
    }

    /**
     * старт сессии игрока. 
     * @param {*} sessionToken 
     * @returns 
     */
    async startSession(sessionToken) {
        if (!sessionToken) {
            console.error('Токен сессии обязателен для запуска');
            return null;
        }

        const stopButtonExists = this.container.querySelector('.stop');
        if (stopButtonExists) {
            const confirmStart = confirm('Уже есть активная сессия. Продолжить? Текущая будет остановлена без сохранения очков.');
            if (!confirmStart) {
                console.log('Запуск отменён пользователем');
                return;
            }
        }

        const token = AdminAuth.getToken();

        if (!token) {
            console.error('[AUTH] Нет токена администратора');
            window.location.href = '/auth.html';
            return;
        }
    
        try {
            const response = await fetch(`${PlayerPool.BASE_URL}/admin/games/${PlayerPool.gameToken}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'X-Admin-API-Key': PlayerPool.adminKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_token: sessionToken })
            });
    
            const data = await response.json();
    
            if (data?.data?.success) {
                console.log('Сессия успешно запущена:', data.data.message);
                alert(data.data.message);
                await this.loadPool(); // Обновим список после запуска
                return data.data;
            } else {
                console.warn('Ошибка запуска сессии:', data.data.message);
                alert(data.data.message);
                return data.data;
            }
        } catch (error) {
            console.error('Ошибка при запуске сессии:', error);
            return null;
        }
    }

    /**
     * Оставовка секции по клику
     */
    async stopActiveSession() {
        try {

            const token = AdminAuth.getToken();

        if (!token) {
            console.error('[AUTH] Нет токена администратора');
            window.location.href = '/auth.html';
            return;
        }

          const response = await fetch(`${PlayerPool.BASE_URL}/admin/games/${PlayerPool.gameToken}/stop`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            //   'X-Admin-API-Key': PlayerPool.adminKey,
              'Content-Type': 'application/json'
            }
          });
      
          const data = await response.json();
      
          if (response.ok && data?.data?.success) {
            alert('Сессия остановлена администратором');
            console.log(data.data.message);
            await this.loadPool();
          } else {
            console.warn(data.data?.message || 'Неизвестная ошибка при остановке сессии');
          }
        } catch (error) {
          console.error('Ошибка при остановке активной сессии:', error);
        }
      }
      
    

    // setupControls() {
    //     this.container.querySelectorAll('.start').forEach(btn => {
    //         btn.addEventListener('click', () => {
    //             const sessionToken = btn.dataset.session;
    //             this.startSession(sessionToken);
    //         });
    //     });
    // }

    // async startSession(sessionToken) {
    //     const response = await fetch(`/admin/games/${this.gameToken}/start`, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({ session_token: sessionToken })
    //     });
    //     if (response.ok) {
    //         alert('Сессия запущена');
    //         this.loadPool(); // обновим список
    //     } else {
    //         alert('Ошибка запуска сессии');
    //     }
    // }


}
export default PlayerPool;
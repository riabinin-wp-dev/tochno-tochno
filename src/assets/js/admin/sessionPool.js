import AdminAuth from "../auth/adminAuth.js";

class PlayerPool {
    static BASE_URL = 'https://gameserver2.kemo.ru/api';
    static WS_URL = 'wss://gameserver2.kemo.ru/ws';
    static gameToken = 'gAmEToKeN1';
    static adminKey = 'Q3z8vKp9N2w5R6s1Xy7L';
    static containerSelector = 'admin_container';


    constructor() {
        this.container = document.getElementById(PlayerPool.containerSelector);
        this.loadPool();
        this.ws = null;
        this.sessionActive = false;
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
        // ?status=started,pending,completed, stopped_by_admin, abandoned
        const response = await fetch(`${PlayerPool.BASE_URL}/admin/games/${PlayerPool.gameToken}/pool`, {
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

        // Порядок статусов (можно легко менять местами)
        const statusOrder = [
            'started',       // 1 место - самые важные
            'pending',       // 2 место
            'stopped_by_admin', // 3 место
            'completed'      // 4 место - в конце
        ];

        // Сортируем сессии согласно нашему порядку
        const sortedSessions = [...pool.data.sessions].sort((a, b) => {
            const aIndex = statusOrder.indexOf(a.status);
            const bIndex = statusOrder.indexOf(b.status);

            // Если статус не указан в порядке - ставим в конец
            return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
        });

        console.log('Отсортированные сессии:', sortedSessions);

        // Рендерим отсортированный список
        sortedSessions.forEach((session, index) => {
            index++;
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
            } else if (session.status == 'stopped_by_admin') {
                controls = `<div class="control" data-session=${session.session_token}>
                            <span class="coin">coin</span>
                            <span class="time">${formattedTime}</span>
                        </div>`;
            }

            const html = `
                <li class="${session.status == 'started' ? 'active' : ''}" data-token=${session.player_token} data-status=${session.status}>
                    <span>${index}</span>
                    <span>${session.badge_id}</span>
                    <span>${session.name}</span>
                    ${controls}
                </li>`;
            this.container.insertAdjacentHTML('beforeend', html);
        });
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
                // Обновим список после запуска 
                await this.loadPool();
                // 3. Запускаем WebSocket соединение
                await this.connectWebSocket(sessionToken);
                this.sessionActive = true;
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


    /**
     * Подключение к WebSocket серверу
     * @param {string} sessionToken 
     * @returns {Promise<void>}
     */
    connectWebSocket(sessionToken) {
        return new Promise((resolve, reject) => {
            const wsUrl = `${PlayerPool.WS_URL}?game_token=${PlayerPool.gameToken}&role=admin`;
            this.ws = new WebSocket(wsUrl);

            console.log('[WS] Подключаемся к:', wsUrl);

            const authPayload = {
                token: AdminAuth.getToken(), 
                admin_key: PlayerPool.adminKey 
            };

            this.ws.onopen = () => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify(authPayload));
                    console.log('[WS] Аутентификация отправлена');
                }
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('[WS] Получено сообщение:', data);

                switch (data.event) {
                    case 'auth_ok':
                        console.log('[WS] Аутентификация успешна');
                        resolve();
                        break;

                    case 'auth_failed':
                        console.error('[WS] Ошибка авторизации:', data.message);
                        this.ws.close();
                        reject(data.message);
                        break;

                    case 'round_completed':
                        this.handleRoundCompleted(data.payload);
                        this.loadPool();
                        break;

                    case 'game_completed':
                        this.handleGameCompleted(data.payload);
                        this.loadPool();
                        alert('Игра была завершена')
                        break;

                    default:
                        console.warn('[WS] Неизвестное событие:', data.event);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[WS] Ошибка соединения:', error);
                reject(error);
            };

            this.ws.onclose = (event) => {
                console.log(`[WS] Соединение закрыто. Код: ${event.code}, Причина: ${event.reason}`);
                this.sessionActive = false;
            };
        });
    }

    /**
     * Обработка завершения раунда
     * @param {object} payload 
     */
    handleRoundCompleted(payload) {
        console.log('[WS] Раунд завершен:', payload);
    }

    /**
     * Обработка завершения игры
     * @param {object} payload 
     */
    handleGameCompleted(payload) {
        console.log('[WS] Игра завершена:', payload);

        // Закрываем соединение
        this.disconnectWebSocket();
    }

    /**
     * Отключение от WebSocket
     */
    disconnectWebSocket() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
            console.log('[WS] Соединение закрыто');
        }
        this.sessionActive = false;
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
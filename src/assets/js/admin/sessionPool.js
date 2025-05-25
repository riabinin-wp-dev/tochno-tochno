import AdminAuth from "../auth/adminAuth.js";
import Swal from 'sweetalert2';

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
        this.startOnHover();
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
        // const sortedSessions = [...pool.data.sessions].sort((a, b) => {
        //     const aIndex = statusOrder.indexOf(a.status);
        //     const bIndex = statusOrder.indexOf(b.status);

        //     // Если статус не указан в порядке - ставим в конец
        //     return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
        // });
        const sessions = [...pool.data.sessions];

        // Сортировка от старых к новым (по возрастанию времени)
        const sortByStartedAtAsc = (a, b) => {
            const aTime = new Date(a.started_at).getTime();
            const bTime = new Date(b.started_at).getTime();
            return aTime - bTime; // меньшее время — раньше
        };

        // Сортировка от новых к старым (по убыванию времени)
        const sortByStartedAtDesc = (a, b) => {
            const aTime = new Date(a.started_at).getTime();
            const bTime = new Date(b.started_at).getTime();
            return bTime - aTime; // большее время — раньше в списке
        };

        // Выбираем сессии "started" и сортируем от старых к новым
        const startedSessions = sessions
            .filter(session => session.status === 'pending')
            .sort(sortByStartedAtAsc);

        // Выбираем остальные сессии и сортируем от новых к старым
        const otherSessions = sessions
            .filter(session => session.status !== 'pending')
            .sort(sortByStartedAtDesc);

        // Объединяем массивы: сначала started, потом остальные
        const sortedSessions = [...startedSessions, ...otherSessions];




        // console.log('Отсортированные сессии:', sortedSessions);

        // Рендерим отсортированный список
        sortedSessions.forEach((session, index) => {
            index++;
            const date = new Date(session.started_at);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            // console.log(session)

            let controls = '';

            if (session.status == 'pending') {
                pendingsCount++;
                controls = `<div class="control" data-session=${session.session_token}>
                            <span>Очередь ${pendingsCount}</span>
                            <button type="button" class="start"></button>
                        </div>`;
            } else if (session.status == 'completed') {
                controls = `<div class="control" data-session=${session.session_token}>
                            <span class="coin">${session.best_session_score}</span>
                            <span class="time">${formattedTime}</span>
                        </div>`;
            } else if (session.status == 'started') {
                controls = `<div class="control" data-session=${session.session_token}>
                            <span>Идет игра</span>
                            <button type="button" class="stop"></button>
                        </div>`;
            } else if (session.status == 'stopped_by_admin') {
                controls = `<div class="control" data-session=${session.session_token}>
                            <span class="coin">${session.best_session_score}</span>
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
                // console.warn('Не удалось добавить в пул:', data.data.message);
                 Swal.fire({
                // icon: 'error', // или 'success', 'error', 'warning', 'question'
                title: 'Не удалось добавить в пул:',
                text: data.data.message,
            });
                return data.data; // Вернём, чтобы можно было проверить код ошибки (например, ALREADY_IN_POOL_OR_ACTIVE)
            }

            console.log('Игрок успешно добавлен в пул:', data.data);
            // alert(data.data.message)
            Swal.fire({
                // icon: 'info', // или 'success', 'error', 'warning', 'question'
                // title: 'Уведомление',
                text: data.data.message,
            });

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
                Swal.fire({
                    // icon: 'info', // или 'success', 'error', 'warning', 'question'
                    // title: 'Уведомление',
                    text: data.data.message,
                });
                console.log('Сессия успешно запущена:', data.data.message);
                // alert(data.data.message);
                // Обновим список после запуска 
                await this.loadPool();
                // 3. Запускаем WebSocket соединение
                await this.connectWebSocket(sessionToken);
                this.sessionActive = true;
                return data.data;
            } else {
                console.warn('Ошибка запуска сессии:', data.data.message);
                Swal.fire({
                    // icon: 'info', // или 'success', 'error', 'warning', 'question'
                    // title: 'Уведомление',
                    text: data.data.message,
                });

                // alert(data.data.message);
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
                // alert('Сессия остановлена администратором');

                Swal.fire({
                    // icon: 'info', // или 'success', 'error', 'warning', 'question'
                    // title: 'Уведомление',
                    text: 'Сессия остановлена администратором',
                });

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
                        // alert('Игра была завершена')
                        Swal.fire({
                            // icon: 'info', // или 'success', 'error', 'warning', 'question'
                            // title: 'Уведомление',
                            text: 'Игра была завершена',
                        });
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

    /**
     * добавление в пул по кнопке
     */
    startOnHover() {
        document.addEventListener('click', async (event) => {
            const li = event.target.closest('li[data-status]');
            if (!li) return;

            // Если клик по кнопке — выходим, не мешаем
            if (event.target.closest('button')) return;

            const token = li.dataset.token;
            console.log('Клик по LI, token:', token);

            // Показываем SweetAlert2 с подтверждением
            const result = await Swal.fire({
                // title: 'Добавить в пул?',
                text: 'Вы уверены, что хотите добавить этого игрока в пул?',
                // icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Да',
                cancelButtonText: 'Отмена',
            });

            // Если пользователь подтвердил
            if (result.isConfirmed) {
                try {
                    const addResult = await PlayerPool.addToPool(token);
                    // console.log('Результат:', addResult);
                    this.loadPool();
                } catch (err) {
                    console.error('Ошибка при добавлении в пул:', err);
                    await Swal.fire('Ошибка', 'Не удалось добавить игрока в пул.', 'error');
                }
            }
        });
    }


}
export default PlayerPool;
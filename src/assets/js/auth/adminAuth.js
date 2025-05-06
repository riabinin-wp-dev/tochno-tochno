class AdminAuth {
    constructor() {
        this.apiUrl = 'https://gameserver2.kemo.ru/api/admin/login-token';
        this.tokenKey = 'admin_token';
        this.expireKey = 'admin_token_expires';
        this.form = document.getElementById('auth_form');
        this.loginInput = document.getElementById('auth_login');
        this.passInput = document.getElementById('auth_pass');

        if (!this.form) {
            console.info('[AUTH] Не на странице авторизации. Форма отсутствует.');
            // return; // прерываем инициализацию
        }else{
            this.init();
        }

    }

    init() {
        this.form.addEventListener('submit', (e) => {
            // console.log(this.form);
            e.preventDefault();
            this.login();
        });
    }

    async login() {
        const password = this.passInput.value.trim();

        if (!password) {
            alert('Введите пароль');
            return;
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (result.data?.success) {
                const token = result.data.token;
                const expires = Date.now() + result.data.expires_in * 1000;

                localStorage.setItem(this.tokenKey, token);
                localStorage.setItem(this.expireKey, expires);

                console.log('[AUTH] Авторизация успешна. Токен сохранён');
                window.location.href = '/admin.html'; // или нужная страница
            } else {
                alert(result.data.message || 'Ошибка авторизации');
            }

        } catch (error) {
            console.error('[AUTH] Ошибка при авторизации:', error);
            alert('Ошибка подключения к серверу');
        }
    }

    static logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token_expires');
        window.location.href = '/auth.html';
    }

    static isAuthenticated() {
        const token = localStorage.getItem('admin_token');
        const expires = localStorage.getItem('admin_token_expires');
        return token && expires && Date.now() < Number(expires);
    }

    static getToken() {
        return localStorage.getItem('admin_token');
    }
}

export default AdminAuth;

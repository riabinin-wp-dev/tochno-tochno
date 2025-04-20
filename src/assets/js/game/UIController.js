class UIController {

    constructor() {
        this.roundEl = document.querySelector('#rounds');
        this.roundStatus = this.roundEl.querySelector('.round_status span');
        this.roundTarget = this.roundEl.querySelector('.round_target');
        this.counterContainer = this.roundEl.querySelector('.round_container');
        this.roundInfo = this.roundEl.querySelector('.round_info');
    }

    waitForKeyPress() {
        return new Promise(resolve => {
            function handler(event) {
                if (event.code === 'Enter' || event.code === 'Space') {
                    document.removeEventListener('keydown', handler);
                    resolve();
                }
            }
            document.addEventListener('keydown', handler);
        });
    }

    waitForClick() {
        return new Promise(resolve => {
            const handler = () => {
                document.removeEventListener('keydown', handler);
                document.removeEventListener('mousedown', handler);
                resolve();
            };
    
            document.addEventListener('keydown', handler);
            document.addEventListener('mousedown', handler);
        });
    }


    updateCounter(counterArr) {
        this.counterContainer.innerHTML = counterArr.map((c, i, arr) => `
            <div class="digit-container">
                ${c.alfabet[c.current]}
                <div class="shadow ${i === arr.length - 1 ? 'green' : 'grey'}"></div>
            </div>
        `).join('');
    }


    showSuccess(result) {
        console.log("Угадал! Очки:", result.points);
        // можно визуальный отклик тут
    }
    
    showFail(result) {
        console.log("Не попал. Очки:", result.points);
    }
    
    showTooManyFails() {
        console.log("Три ошибки подряд! Спец. экран.");
        // сюда можно модалку или секцию с сообщением
    }

    /**
     * показываем секцию
     * @param {*} id  id старой секции
     * @param {*} idNew id новой секции
     * @param {*}  name имя для первой секции отображать 
     */
    showSection(id, idNew, name = '') {

        if (name !== '') {
            document.querySelector('[data-name]').textContent = name;
        }

        const section = document.getElementById(id);
        section.classList.remove('active');
        setTimeout(() => section.classList.add('none'), 300);

        const next = document.getElementById(idNew);
        next.classList.remove('none');
        setTimeout(() => next.classList.add('active'), 10);
    }

    /**
    * таймер обратного отсчета
    */
    async runBacktimer() {
        const countEl = document.querySelector('[data-count]');
        const textEl = document.querySelector('[data-text]');

        for (let i = 3; i > 0; i--) {
            countEl.textContent = i;
            await this.delay(1000);
        }

        // Скрываем счёт
        countEl.classList.add('hide');
        setTimeout(() => {
            countEl.classList.add('slide-up');
        }, 300);
        textEl.classList.remove('hidden');

        setTimeout(() => {
            textEl.classList.add('active');
        }, 600);
        // Показываем надпись
        // textEl.textContent = 'Старт!';

        await this.delay(1000);
        textEl.classList.add('disperse');
        this.disperseText(textEl);

        //продублируем время для анимаации
        await this.delay(3000)
    }

    /**
    * задержка
    * @param {*} ms 
    * @returns 
    */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * функция рассеивания слова
     * @param {*} element 
     */
    disperseText(el) {
        const spans = el.querySelectorAll('span');

        spans.forEach((span, i) => {
            // Случайное направление и расстояние
            const angle = Math.random() * 2 * Math.PI; // от 0 до 2π
            const radius = 40 + Math.random() * 40; // от 40 до 80px
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const rotate = (Math.random() * 60 - 30).toFixed(1); // -30 до 30 градусов

            span.style.setProperty('--x', `${x}px`);
            span.style.setProperty('--y', `${y}px`);
            span.style.setProperty('--r', `${rotate}deg`);
            span.style.setProperty('--i', i);
        });

        setTimeout(() => {
            el.classList.add('animate');
        }, 1000);
    }



    showRound(roundNumber, counterArr, fact) {
        this.roundEl.classList.remove('none');

        // Обновляем инфу о раунде
        this.roundStatus.textContent = roundNumber;
        this.roundStatus.closest('.round_status').style.display = 'block';
        this.roundTarget.style.display = 'block';
        this.roundInfo.style.display = 'block';

        // Формируем строку цели
        const target = counterArr.map(c => c.alfabet[c.target]).join('');
        this.roundTarget.innerHTML = `ПОЙМАЙ ${target}`;
        this.roundInfo.innerHTML = fact;

        // Очищаем и показываем контейнер для счётчика
        this.counterContainer.innerHTML = '';
        this.counterContainer.style.display = 'flex';

        counterArr.forEach((digit, i) => {
            const digitContainer = document.createElement('div');
            digitContainer.classList.add('digit-container');
            digitContainer.textContent = digit.alfabet[digit.current];

            const shadow = document.createElement('div');
            shadow.classList.add('shadow');
            shadow.classList.add(i === counterArr.length - 1 ? 'green' : 'grey');

            digitContainer.appendChild(shadow);
            console.log(digitContainer);
            this.counterContainer.appendChild(digitContainer);
        });
    }

    showEnd() {
        // подвести итоги
        console.log('Игра окончена');
    }
}
export default UIController;
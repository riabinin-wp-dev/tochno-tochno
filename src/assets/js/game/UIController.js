class UIController {

    constructor() {
        this.roundEl = document.querySelector('#rounds');
        this.roundStatus = this.roundEl.querySelector('.round_status span');
        this.roundTarget = this.roundEl.querySelector('.round_target');
        this.counterContainer = this.roundEl.querySelector('.round_container');
        this.roundInfo = this.roundEl.querySelector('.round_info');
        this.roundCoinInfo = this.roundEl.querySelector('.round_coin_info');
        this.roundResult = this.roundEl.querySelector('.round_result');
        this.roundResultTotal = this.roundEl.querySelector('.round_reult_text');
        this.roundFinish = this.roundEl.querySelector('.round_finish');
    }

    /**
     * подготовка секции к райнду
     */
    prepareSectionForRound() {
        if (this.roundTarget.classList.contains('winner')) {
            this.roundTarget.classList.remove('winner');
        }
        this.hideElement([this.roundCoinInfo, this.roundResult, this.roundResultTotal, this.roundFinish]);
        this.showElement([this.roundStatus, this.roundTarget, this.counterContainer, this.roundInfo]);
    }

    /**
     * скрываем элементы 
     * @param {*} elements - массив элементов
     */
    hideElement(elements) {
        elements.forEach(el => {
            el.classList.add('slide-hidden');
            setTimeout(() => {
                el.classList.add('none');
            }, this.animationTime);
        });
    }

    /**
    * показываем элементы 
    * @param {*} elements - массив элементов
    */
    showElement(elements) {
        elements.forEach(el => {
            el.classList.remove('none');
            setTimeout(() => {
                el.classList.remove('slide-hidden');
            }, 10);
        });
    }
    /**
     * ожидание клика пробела или энтера
     * @returns 
     */
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

    /**
     * ожидание клика мвшки или клавиши
     * @returns 
     */
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

    /**
     * 
     * @param {*} counterArr 
     */
    updateCounter(counterArr) {
        this.counterContainer.innerHTML = counterArr.map((c, i, arr) => `
            <div class="digit-container">
                ${c.alfabet[c.current]}
                <div class="shadow ${i === arr.length - 1 ? 'green' : 'grey'}"></div>
            </div>
        `).join('');
    }

    /**
     * обработка три неудачи подряд
     */
    async showTooManyFails() {
        this.roundEl.classList.add('default');
        this.roundTarget.innerHTML = 'Увы, но даже <br> Леонид Агутин <br> быстрее, чем ты...';
        this.roundResultTotal.innerHTML = '<p>Приходи позже и попробуй <br> еще раз!</p>'

        this.hideElement([this.roundStatus.parentElement, this.roundCoinInfo, this.counterContainer, this.roundResult, this.roundInfo]);
        await this.delay(500);
        this.showElement([this.roundFinish, this.roundResultTotal]);

        // перезагрузка
        await this.delay(5000);
        location.reload();
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

            countEl.querySelector(`[data-num="${i}"]`).classList.add('active');
            await this.delay(1000);
            countEl.querySelector(`[data-num="${i}"]`).classList.add('slide');

        }

        setTimeout(() => {
            textEl.classList.add('active');
        }, 300);
        await this.delay(1000);
        textEl.classList.add('scale');
        setTimeout(() => {
            textEl.classList.remove('active');
        }, 300);


        //продублируем время для анимаации
        await this.delay(1000)
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
     * показываем раунд
     * @param {*} roundNumber 
     * @param {*} counterArr 
     * @param {*} fact 
     */
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
            const safeIndex = typeof digit.current === 'number' ? digit.current : 0;
            digitContainer.textContent = digit.alfabet[safeIndex] ?? '?';

            const shadow = document.createElement('div');
            shadow.classList.add('shadow');
            shadow.classList.add(i === counterArr.length - 1 ? 'green' : 'grey');

            digitContainer.appendChild(shadow);
            this.counterContainer.appendChild(digitContainer);
        });
    }

    /**
     * блик фона
     * @param {*} selector 
     */
    async showblick(selector) {
        const image = document.querySelector(selector);
        image.classList.remove('hide');
        image.classList.add('blick');
        await this.delay(5000);
        image.classList.remove('blick');
        image.classList.add('hide');
    }

    /**
     * показываем успех
     * @param {*} result результат объект 
     */
    async showSuccess(result) {
        this.changecolor('green');
        this.roundEl.classList.add('right');
        this.roundEl.classList.remove('default');

        setTimeout(() => {
            this.showSalut();
        }, 2000);
        await this.showblick('.victory');

        this.hideElement([this.counterContainer, this.roundInfo]);
        this.showElement([this.roundCoinInfo, this.roundResult]);

        this.roundTarget.classList.add('winner');
        this.roundTarget.innerHTML = 'Победа! <br> Ты заработал';

        this.roundCoinInfo.querySelector('span').textContent = result.points;

        for (let i = 3; i > 0; i--) {
            this.roundResult.querySelector('span').textContent = i;
            await this.delay(1000);
        }
        this.roundEl.classList.add('default');
        this.roundEl.classList.remove('right');
    }

    /**
     * отрабатываем неудачу
     * @param {*} result 
     */
    async showFail(result) {
        this.changecolor('red');
        this.roundEl.classList.add('wrong');
        this.roundEl.classList.remove('default');
        await this.showblick('.fail');

        this.hideElement([this.counterContainer, this.roundInfo]);
        this.showElement([this.roundResult]);
        this.roundTarget.classList.add('winner');
        if (result.round === 3) {
            this.roundTarget.innerHTML = 'Ты ошибся! <br> Раундов <br> больше нет';
            this.roundResult.innerHTML = 'Общий результат через <span>3</span>'
        } else {
            this.roundTarget.innerHTML = 'Ты ошибся! <br> Попробуй <br> еще раз';
        }
        for (let i = 3; i > 0; i--) {
            this.roundResult.querySelector('span').textContent = i;
            await this.delay(1000);
        }

        this.roundEl.classList.add('default');
        this.roundEl.classList.remove('wrong');

        // result.round == 3 ? this.showEnd(result) : '';
    }

    /**
     * отображаем салют
     * @returns 
     */
    showSalut() {
        return new Promise((resolve) => {
            const coinImages = ['Coin.svg', 'Silver.svg', 'Gold.svg'];
            const count = 100;
            const container = document.getElementById('coin-fireworks');
            if (!container) return resolve();

            let done = 0;

            for (let i = 0; i < count; i++) {
                const img = document.createElement('img');
                img.src = `./assets/images/salut/${coinImages[Math.floor(Math.random() * coinImages.length)]}`;
                img.classList.add('coin-piece');

                const startX = Math.random() * window.innerWidth;
                const delay = Math.random() * 1000; // до 1 сек задержки

                img.style.left = `${startX}px`;
                img.style.top = `-50px`;
                img.style.animationDelay = `${delay}ms`;

                container.appendChild(img);

                setTimeout(() => {
                    img.remove();
                    done++;
                    if (done === count) resolve();
                }, 2500 + delay); // учли задержку + длительность анимации
            }
        });
    }



    /**
     * смена фона цифр
     * @param {*} color 
     */
    changecolor(color) {
        const shadows = this.counterContainer.querySelectorAll('.shadow');
        shadows.forEach(shadow => {
            if (shadow.classList.contains('grey') || shadow.classList.contains('green')) {
                shadow.classList.remove('grey');
                shadow.classList.remove('green');
                shadow.classList.add(color);
            }
        });
    }

    /**
     * отображение итога
     * @param {*} scope 
     */
    async showEnd(scope) {
        this.roundEl.classList.add('default');
        this.roundTarget.innerHTML = 'Игра закончилась, <br> всего ты заработал';
        this.roundCoinInfo.querySelector('span').textContent = scope;

        this.hideElement([this.roundStatus.parentElement, this.counterContainer, this.roundResult, this.roundInfo]);
        await this.delay(500);
        this.showElement([this.roundCoinInfo, this.roundResultTotal, this.roundFinish]);


        // перезагрузка
        await this.delay(5000);
        location.reload();

    }
}
export default UIController;
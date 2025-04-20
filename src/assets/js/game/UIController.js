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

    prepareSectionForRound() {
        // this.delay(300);
        if (this.roundTarget.classList.contains('winner')) {
            this.roundTarget.classList.remove('winner');
        }
        this.hideElement([this.roundCoinInfo, this.roundResult, this.roundResultTotal, this.roundFinish]);
        this.showElement([this.roundStatus, this.roundTarget, this.counterContainer, this.roundInfo]);
    }

    //  скрываем элементы 
    hideElement(elements) {
        elements.forEach(el => {
            el.classList.add('slide-hidden');
            setTimeout(() => {
                el.classList.add('none');
            }, this.animationTime);
        });
    }

    //  показываем элементы
    showElement(elements) {
        elements.forEach(el => {
            el.classList.remove('none');
            setTimeout(() => {
                el.classList.remove('slide-hidden');
            }, 10);
        });
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
            const safeIndex = typeof digit.current === 'number' ? digit.current : 0;
            digitContainer.textContent = digit.alfabet[safeIndex] ?? '?';

            const shadow = document.createElement('div');
            shadow.classList.add('shadow');
            shadow.classList.add(i === counterArr.length - 1 ? 'green' : 'grey');

            digitContainer.appendChild(shadow);
            this.counterContainer.appendChild(digitContainer);
        });
    }

    async showSuccess(result) {
        this.changecolor('green');
        this.roundEl.classList.add('right');
        this.roundEl.classList.remove('default');

        await this.showSalut();
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

    async showFail(result) {
        this.changecolor('red');
        this.roundEl.classList.add('wrong');
        this.roundEl.classList.remove('default');

        await this.delay(3000);


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

    showSalut() {
        return new Promise((resolve) => {
            const coinImages = ['Coin.svg', 'Silver.svg', 'Gold.svg'];
            const count = 30;
            const container = document.getElementById('coin-fireworks');
            if (!container) return resolve();

            for (let i = 0; i < count; i++) {
                const img = document.createElement('img');
                img.src = `./assets/images/salut/${coinImages[Math.floor(Math.random() * coinImages.length)]}`;
                img.classList.add('coin-piece');

                const dx = (Math.random() - 0.5) * 600;
                const dy = (Math.random() - 0.5) * 600;

                img.style.setProperty('--x', `${dx}px`);
                img.style.setProperty('--y', `${dy}px`);

                img.style.left = `${window.innerWidth / 2}px`;
                img.style.top = `${window.innerHeight / 2}px`;

                container.appendChild(img);

                // Удаляем после окончания
                setTimeout(() => {
                    img.remove();
                    if (i === count - 1) {
                        resolve(); // когда последний элемент удалится — завершить промис
                    }
                }, 2000); // <- длительность анимации
            }
        });
    }

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
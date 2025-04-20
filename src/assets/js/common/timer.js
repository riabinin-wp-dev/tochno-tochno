class Timer {
    constructor(maxDuration, onUpdate, onComplete) {
      this.maxDuration = maxDuration * 1000; // Переводим секунды в миллисекунды
      this.onUpdate = onUpdate; // callback для обновления
      this.onComplete = onComplete || (() => console.log('Таймер завершился (кнопка не нажата)'));
      this.startTime = null;
      this.animationFrameId = null;
      this.isRunning = false;
      this.lastTime = 0; // Хранит время в сантисекундах
    }
  
    start() {
      if (this.isRunning) return;
      
      this.isRunning = true;
      this.startTime = performance.now();
      this.update();
    }
  
    stop() {
      if (!this.isRunning) return null;
      
      this.isRunning = false;
      cancelAnimationFrame(this.animationFrameId);
      return this.lastTime; // Возвращаем время в сантисекундах
    }
  
    reset() {
      this.stop();
      this.lastTime = 0;
      this.updateDisplay(0);
    }
  
    update() {
      if (!this.isRunning) return;
  
      const currentTime = performance.now();
      const elapsedMs = currentTime - this.startTime;
      this.lastTime = Math.min(Math.floor(elapsedMs / 10), this.maxDuration / 10); // Сохраняем в сантисекундах
  
      this.updateDisplay(this.lastTime);
  
      if (elapsedMs < this.maxDuration) {
        this.animationFrameId = requestAnimationFrame(() => this.update());
      } else {
        this.isRunning = false;
        if (this.onComplete) this.onComplete();
      }
    }
  
    updateDisplay(centiseconds) {
      const seconds = Math.floor(centiseconds / 100);
      const cs = centiseconds % 100;
      const display = `${seconds}:${cs.toString().padStart(2, '0')}`;
      
      if (this.onUpdate) this.onUpdate(display);
    }
  
    // Получить текущее время в сантисекундах
    getCurrentTime() {
      return this.lastTime;
    }
  }
  
  // Пример использования:
  // const timerDisplay = document.getElementById('timer-display');
  // const startButton = document.getElementById('start-button');
  // const stopButton = document.getElementById('stop-button');
  // const resetButton = document.getElementById('reset-button');
  
  // // Создаем таймер на 20 секунд (2000 сантисекунд)
  // const timer = new Timer(
  //   20, // 20 секунд
  //   (time) => { timerDisplay.textContent = time; }
  // );
  
  // startButton.addEventListener('click', () => timer.start());
  // stopButton.addEventListener('click', () => {
  //   const stoppedTime = timer.stop(); // Время в сантисекундах
  //   console.log('Остановлено на:', stoppedTime, 'сантисекунд');
  //   console.log('Это:', Math.floor(stoppedTime/100), 'секунд', stoppedTime%100, 'сантисекунд');
  // });
  // resetButton.addEventListener('click', () => timer.reset());



//   const timer = new Timer(20, updateFn);

// // Запускаем таймер
// timer.start();

// // Через некоторое время останавливаем
// setTimeout(() => {
//   const cs = timer.stop(); // время в сантисекундах
//   const seconds = Math.floor(cs / 100);
//   const centiseconds = cs % 100;
  
//   console.log(`Точное время: ${cs}cs (${seconds}.${centiseconds}s)`);
// }, 5500); // Остановка через ~5.5 секунд
// Получить время в сантисекундах
// const cs = timer.getCurrentTime(); // Например: 543 (5.43 секунды)

// // Преобразовать в секунды с дробной частью
// const secondsFloat = cs / 100; // 5.43

// // Получить отдельно секунды и сантисекунды
// const seconds = Math.floor(cs / 100); // 5
// const centiseconds = cs % 100; // 43

// // Форматировать для вывода
// const formatted = `${seconds}:${centiseconds.toString().padStart(2, '0')}`; // "5:43"
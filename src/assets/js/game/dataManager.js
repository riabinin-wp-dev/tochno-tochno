class DataManager {
  constructor() {
    this.questions = [];
    this.usedIndexes = new Set();
  }

  /**
   * Загружает вопросы из локального JSON-файла
   */
  async loadQuestions() {
    if (this.questions.length) return; // Уже загружены

    try {
      const response = await fetch('./assets/js/questions.json');
      if (!response.ok) {
        throw new Error('Ошибка загрузки questions.json');
      }

      this.questions = await response.json();
    } catch (err) {
      console.error('Ошибка при загрузке вопросов:', err);
    }
  }

  /**
   * Возвращает случайный вопрос
   */
  async getRandomQuestion() {
    await this.loadQuestions();

    if (this.usedIndexes.size >= this.questions.length) {
      console.warn('Все вопросы использованы!');
      return null; // Или: this.resetUsedIndexes(); чтобы начать заново
    }

    let index;
    do {
      index = Math.floor(Math.random() * this.questions.length);
    } while (this.usedIndexes.has(index));

    this.usedIndexes.add(index);
    return this.questions[index];
  }

  /**
   * Очистка истории использования (если игра начинается заново)  (если не буду перезагружать)
   */
  resetUsedIndexes() {
    this.usedIndexes.clear();
  }

  calculateInitialCurrents(counterValues) {
    const exceptions = ['млн', 'лет', '%', '.', 'k', 'br'];
    const totalTime = 10000; // 10 секунд
    const stepDelay = 120;   // задержка между шагами
    const totalSteps = Math.floor(totalTime / stepDelay); // ~83 шага

    // Фильтруем только анимируемые цифры (исключая символы)
    const activeCounters = counterValues.filter(counter =>
      !counter.alfabet.some(symbol => exceptions.includes(symbol))
    );

    // Если нет анимируемых цифр, возвращаем как есть
    if (activeCounters.length === 0) return counterValues;

    // Распределяем шаги между цифрами (последняя цифра крутится чаще)
    const stepsPerDigit = Math.ceil(totalSteps / activeCounters.length);

    return counterValues.map(counter => {
      // Пропускаем исключения (просто ставим current = target)
      if (counter.alfabet.some(symbol => exceptions.includes(symbol))) {
        return { ...counter, current: counter.target };
      }

      const alphabetSize = counter.alfabet.length;
      const target = counter.target;

      // Вычисляем начальное значение: target - stepsPerDigit
      let initialCurrent = target - stepsPerDigit;

      // Если ушли в минус, корректируем с учётом цикличности
      while (initialCurrent < 0) {
        initialCurrent += alphabetSize;
      }

      // Гарантируем, что current < target (чтобы анимация шла вверх)
      if (initialCurrent >= target) {
        initialCurrent = (target - 1 + alphabetSize) % alphabetSize;
      }

      return { ...counter, current: initialCurrent };
    });
  }
}


export default DataManager;
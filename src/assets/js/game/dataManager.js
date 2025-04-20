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
  }
  
  
  export default DataManager;
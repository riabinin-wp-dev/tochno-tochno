/**
 * расчет current
 * @param {*} target 
 * @param {*} alfabet 
 * @param {*} totalTime 
 * @param {*} interval 
 * @returns 
 */

function calculateCurrent(target, alfabet, totalTime = 10000, interval = 120) {
    const steps = Math.floor(totalTime / interval);
    const index = alfabet.indexOf(target);
    const len = alfabet.length;

    // двигаемся по кругу, чтобы попасть в target через steps шагов
    const start = (index - steps + len) % len;

    return start;
}
export default calculateCurrent;


//вставка в game manager
// this.counterValues = question.counter.map(c => {
        //     const { target, alfabet } = c;
        
        //     if (!Array.isArray(alfabet)) {
        //         console.warn('❗ alfabet не массив:', alfabet);
        //         return c;
        //     }
        
        //     if (typeof target !== 'number') {
        //         console.warn('❗ target не число:', target);
        //         return c;
        //     }
        
        //     if (target < 0 || target >= alfabet.length) {
        //         console.warn('❗ target вне диапазона:', target, 'alfabet:', alfabet);
        //         return c;
        //     }
        
        //     const targetChar = alfabet[target];
        
        //     if (typeof targetChar === 'undefined') {
        //         console.warn('❗ targetChar undefined. target:', target, 'alfabet:', alfabet);
        //     } else {
        //         console.log('✅ targetChar:', targetChar, 'alfabet:', alfabet);
        //     }
        
        //     let calculatedCurrent;
        //     try {
        //         calculatedCurrent = calculateCurrent(targetChar, alfabet);
        //     } catch (e) {
        //         console.error('Ошибка при расчёте current:', e);
        //         calculatedCurrent = c.current ?? 0;
        //     }
        
        //     return {
        //         ...c,
        //         current: calculatedCurrent
        //     };
        // });
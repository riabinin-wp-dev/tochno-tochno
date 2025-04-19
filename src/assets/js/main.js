const test1 = {
    fact: "MAU b2c продуктов 2ГИС — 82.6 млн",
    counter:
        [
            {
                current: 7,
                target: 8,
                alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
            },
            {
                current: 0,
                target: 2,
                alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
            },
            {
                current: 0,
                target: 0,
                alfabet: ["."]
            },
            {
                current: 0,
                target: 6,
                alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
            }
        ]
};

const test2 = {
    fact: "RnD 2ГИС — 1000 инженеров",
    counter:
        [{
            current: 0,
            target: 1,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 8,
            target: 0,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 5,
            target: 0,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        },
        {
            current: 0,
            target: 0,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }
        ]
};

const test3 = {
    fact: "Первый пост на Хабре<br>Октябрь 2007 года",
    counter:
        [{
            current: 0,
            target: 1,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 9,
            target: 0,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 0,
            target: 0,
            alfabet: ["."]
        }, {
            current: 0,
            target: 0,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        },
        {
            current: 0,
            target: 7,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }
        ]
};

const test4 = {
    fact: "Самый просматриваемый пост на Хабре<br>Service Workers. Инструкция по применению<br>149 000 k",
    counter:
        [{
            current: 1,
            target: 1,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 4,
            target: 4,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 8,
            target: 9,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 8,
            target: 0,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 0,
            target: 0,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 0,
            target: 0,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }
        ]
};

const test5 = {
    fact: "Точность данных 2ГИС<br>95%",
    counter:
        [{
            current: 0,
            target: 9,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 0,
            target: 5,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 0,
            target: 0,
            alfabet: ["%"]
        }
        ]
};

const test6 = {
    fact: "Год основания компании<br>1999",
    counter:
        [{
            current: 1,
            target: 1,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 8,
            target: 9,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 0,
            target: 9,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }, {
            current: 0,
            target: 9,
            alfabet: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }
        ]
};



var tests = [test1, test2, test3, test4, test5, test6];
var currentTest = 0; currentAttempt = 1; maxAttempts = 1;
var counterValues = structuredClone(tests[currentTest].counter);
var counterFact = tests[currentTest].fact;

var started = false;

document.addEventListener('DOMContentLoaded', () => {
    gamefield = document.getElementById("gamefield");
    show();
});

function show() {

    let counterHTML = '', targetHTML = '';
    for (let i = 0; i < counterValues.length; i++) {
        counterHTML += `
        <div class="digit-container">${counterValues[i].alfabet[counterValues[i].current]}<div class="shadow"></div></div>
        `;
        targetHTML += counterValues[i].alfabet[counterValues[i].target]
    }

    gamefield.innerHTML = `
    <div id="counter-container">
    ${counterHTML}
    </div>
    <div id="target-container">
    ${counterFact}
    <br>
    ЦЕЛЬ: ${targetHTML}
    </div>`;

}

['keydown', 'mousedown'].forEach(evt =>
    document.addEventListener(evt, () => {
        if (started) stopCounter();
        else startCounter();
    })
);


function startCounter() {
    started = true;
    doCycle();
}

function stopCounter() {
    started = false;
    if (checkText()) alert(`Точно!
Это было непросто, правда?`);
    currentAttempt++;
    if (currentAttempt > maxAttempts) {
        currentTest++;
        currentAttempt = 1;
        if (currentTest == tests.length) currentTest = 0;

        counterValues = structuredClone(tests[currentTest].counter);
        counterFact = tests[currentTest].fact;
    }
}

function textNext() {
    for (let i = 0; i < counterValues.length; i++) {
        let currentEl = counterValues[counterValues.length - i - 1];
        currentEl.current++;
        if (currentEl.current < currentEl.alfabet.length) break;
        else currentEl.current = 0;
    }
}

function getText() {
    let text = '';
    for (let i = 0; i < counterValues.length; i++) {
        text += counterValues[i].alfabet[counterValues[i].current];
    }
    return text;
}

function checkText() {
    for (let i = 0; i < counterValues.length; i++) {
        if (counterValues[i].current !== counterValues[i].target) return false;
    }
    return true;
}

let doCycle = function () {
    if (!started) return;
    textNext();
    show();
    setTimeout(doCycle, 120);
}
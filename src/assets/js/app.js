import checkRatio from "./common/ratio.js";
import GameManager from "./game/gameManager.js";

document.addEventListener('DOMContentLoaded',()=>{
    new GameManager(); 
})


/**
 * ratio
 */
window.addEventListener('load', checkRatio);
window.addEventListener('resize', checkRatio);
import checkRatio from "./common/ratio.js";
import GameManager from "./game/gameManager.js";


new GameManager(); 


/**
 * ratio
 */
window.addEventListener('load', checkRatio);
window.addEventListener('resize', checkRatio);
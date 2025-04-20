/**
 * ratio
 */
function checkRatio() {
    const ratio = window.innerHeight / window.innerWidth;
    if (ratio > 1.6) {
      document.body.classList.add('vertical');
      document.body.classList.remove('horizontal');
    } else {
      document.body.classList.add('horizontal');
      document.body.classList.remove('vertical');
    }
  }

  export default checkRatio;
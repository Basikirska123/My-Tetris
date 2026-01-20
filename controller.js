//Keyboard handling
const Controller = (() => {
  function onKeyDown(e) {
    const key = e.key;

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'x', 'X', 'z', 'Z', 'Control', 'Escape', 'F1', 'Shift', 'c', 'C',].includes(key)) {
      e.preventDefault();
    }

    if (key === 'Escape' || key === 'F1') {
      Tetris.togglePause();
      return;
    }

    if (key === 'Shift' || key === 'c' || key === 'C') {
      Tetris.hold();
      return;
    }

    if (key === 'ArrowLeft') Tetris.moveLeft();
    if (key === 'ArrowRight') Tetris.moveRight();
    if (key === 'ArrowDown') Tetris.softDrop();
    if (key === ' ') Tetris.hardDrop();

    if (key === 'ArrowUp' || key === 'x' || key === 'X') {
      Tetris.rotateCW();
    } else if (key === 'z' || key === 'Z' || key === 'Control') {
      Tetris.rotateCCW();
    }
  }

  function bind() {
    window.addEventListener('keydown', onKeyDown);
  }

  return { bind };
})();
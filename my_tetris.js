// Core game logic

const Tetris = (() => {
  const ROWS = 40;
  const COLS = 10;
  const VISIBLE_START = 20;

  const board = Utils.createMatrix(ROWS, COLS);

  let bag = [];
  let activePiece = null;

  const dropInterval = 1000;
  let lastDropTime = 0;

  // Lock delay
  const lockDelayMs = 500;
  let isTouching = false;
  let touchStartTime = 0;

  let running = false;
  let gameOver = false;

  // score/lines/level
  let score = 0;
  let lines = 0;
  let level = 0;

  // pause/countdown support
  let playBtn = null;
  let countdownActive = false;
  let countdownStartTime = 0;

  // Hold / Next / Ghost (enabled by default)
  const NEXT_COUNT = 6;
  let nextQueue = [];
  let holdType = null;
  let holdUsed = false;

  function updateHUD() {
    const scoreEl = document.getElementById('score');
    const linesEl = document.getElementById('lines');
    const levelEl = document.getElementById('level');

    if (scoreEl) scoreEl.textContent = String(score);
    if (linesEl) linesEl.textContent = String(lines);
    if (levelEl) levelEl.textContent = String(level);
  }

  // helper for notice text
  function setNotice(text) {
    const notice = document.getElementById('notice');
    if (notice) notice.textContent = text;
  }

  // start 3..2..1 countdown (used on start and resume)
  function startCountdown() {
  countdownActive = true;
  countdownStartTime = null;
  running = false;
  setNotice('3');
}

  function getNextPieceType() {
    if (bag.length === 0) bag = Utils.createBag();
    return bag.pop();
  }

  function refillNextQueue() {
    while (nextQueue.length < NEXT_COUNT) {
      nextQueue.push(getNextPieceType());
    }
  }

  function createPiece(type) {
    const def = Pieces[type];
    return {
      type,
      color: def.color,
      shape: def.shape.map((r) => r.slice()),
      rotation: 0,
      x: 0,
      y: 0,
    };
  }

  function collide(nx, ny, shape) {
    for (let y = 0; y < shape.length; y += 1) {
      for (let x = 0; x < shape[y].length; x += 1) {
        if (!shape[y][x]) continue;

        const bx = nx + x;
        const by = ny + y;

        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
    }
    return false;
  }

  function isPieceTouchingDown() {
    if (!activePiece) return false;
    return collide(activePiece.x, activePiece.y + 1, activePiece.shape);
  }

  function getGhostY() {
    if (!activePiece) return null;
    let gy = activePiece.y;
    while (!collide(activePiece.x, gy + 1, activePiece.shape)) {
      gy += 1;
    }
    return gy;
  }

  function mergePiece() {
    if (!activePiece) return;

    activePiece.shape.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v && activePiece.y + y >= 0) {
          board[activePiece.y + y][activePiece.x + x] = activePiece.color;
        }
      })
    );
  }

  // clear lines + collapse
  function clearLines() {
    let cleared = 0;

    for (let y = ROWS - 1; y >= 0; y -= 1) {
      const full = board[y].every((cell) => cell !== 0);

      if (full) {
        board.splice(y, 1);
        board.unshift(new Array(COLS).fill(0));
        cleared += 1;
        y += 1;
      }
    }

    if (cleared > 0) {
      lines += cleared;

      const pointsTable = [0, 100, 300, 500, 800];
      score += pointsTable[cleared] * (level + 1);

      level = Math.floor(lines / 10);
      updateHUD();

      AudioSfx.playClear();
    }
  }

  // lock-out detection (piece locks completely above visible field)
  function isLockOut() {
    if (!activePiece) return false;

    for (let y = 0; y < activePiece.shape.length; y += 1) {
      for (let x = 0; x < activePiece.shape[y].length; x += 1) {
        if (!activePiece.shape[y][x]) continue;

        const by = activePiece.y + y;
        if (by >= VISIBLE_START) {
          return false;
        }
      }
    }
    return true;
  }

  // game over handler
  function doGameOver() {
    gameOver = true;
    running = false;
    countdownActive = false;
    setNotice('GAME OVER');
    if (playBtn) playBtn.textContent = 'PLAY';

    AudioSfx.playGameOver();
    AudioSfx.stopMusic();
  }

  function spawnPiece() {
    refillNextQueue();
    const type = nextQueue.shift();
    refillNextQueue();
    const p = createPiece(type);

    holdUsed = false;

    // Spawn above visible area
    p.y = VISIBLE_START - 1;

    // Spec: I and O center; others left-middle
    const centerX = Math.floor((COLS - p.shape[0].length) / 2);
    p.x = (p.type === 'I' || p.type === 'O') ? centerX : centerX - 1;

    // Reset lock delay state on spawn
    isTouching = false;
    touchStartTime = 0;

    // block-out = game over + notice
    if (collide(p.x, p.y, p.shape)) {
      activePiece = p;
      doGameOver();
      return;
    }

    activePiece = p;
  }

  function lockAndSpawnNext() {
    AudioSfx.playLock();

    mergePiece();

    // lock-out = game over
    if (isLockOut()) {
      doGameOver();
      return;
    }

    clearLines();
    spawnPiece();
  }

  // stepDown no longer locks immediately
  function stepDown() {
    if (!activePiece) return;

    if (!collide(activePiece.x, activePiece.y + 1, activePiece.shape)) {
      activePiece.y += 1;

      isTouching = false;
      touchStartTime = 0;
      return;
    }

    // It cannot move down => touching
    if (!isTouching) {
      isTouching = true;
      touchStartTime = performance.now();

      AudioSfx.playLanding();
    }
  }

  function move(dx) {
    if (!activePiece || !running || gameOver) return;

    const nx = activePiece.x + dx;

    if (!collide(nx, activePiece.y, activePiece.shape)) {
      activePiece.x = nx;

      AudioSfx.playMove();

      // If moved away from contact, cancel lock timer
      if (!isPieceTouchingDown()) {
        isTouching = false;
        touchStartTime = 0;
      }
    }
  }

  function softDrop() {
    if (!activePiece || !running || gameOver) return;
    stepDown();
    lastDropTime = performance.now();
  }

  function hardDrop() {
    if (!activePiece || !running || gameOver) return;

    while (!collide(activePiece.x, activePiece.y + 1, activePiece.shape)) {
      activePiece.y += 1;
    }

    // Lock immediately on hard drop
    isTouching = false;
    touchStartTime = 0;
    lockAndSpawnNext();
    lastDropTime = performance.now();
  }

  function hold() {
    if (!activePiece || !running || gameOver) return;
    if (holdUsed) return;

    const currentType = activePiece.type;

    // Reset lock delay state so swap doesn't instantly lock
    isTouching = false;
    touchStartTime = 0;

    if (holdType === null) {
      holdType = currentType;
      spawnPiece();
    } else {
      const swapType = holdType;
      holdType = currentType;

      const p = createPiece(swapType);
      p.y = VISIBLE_START - 1;
      const centerX = Math.floor((COLS - p.shape[0].length) / 2);
      p.x = (p.type === 'I' || p.type === 'O') ? centerX : centerX - 1;

      // block-out on swap => game over
      if (collide(p.x, p.y, p.shape)) {
        activePiece = p;
        doGameOver();
        return;
      }

      activePiece = p;
    }

    holdUsed = true;
  }

  function rotateMatrixCW(matrix) {
    const result = [];
    for (let x = 0; x < matrix[0].length; x += 1) {
      const row = [];
      for (let y = matrix.length - 1; y >= 0; y -= 1) {
        row.push(matrix[y][x]);
      }
      result.push(row);
    }
    return result;
  }

  function rotateMatrixCCW(matrix) {
    const result = [];
    for (let x = matrix[0].length - 1; x >= 0; x -= 1) {
      const row = [];
      for (let y = 0; y < matrix.length; y += 1) {
        row.push(matrix[y][x]);
      }
      result.push(row);
    }
    return result;
  }

  // SRS kicks (JLSTZ + T)
  const SRS_KICKS_JLSTZ_T = {
    '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };

  // SRS kicks (I)
  const SRS_KICKS_I = {
    '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };

  function getKickTests(type, from, to) {
    if (type === 'O') return [[0, 0]];
    const key = `${from}>${to}`;
    if (type === 'I') return SRS_KICKS_I[key] || [[0, 0]];
    return SRS_KICKS_JLSTZ_T[key] || [[0, 0]];
  }

  function rotate(direction) {
    if (!activePiece || !running || gameOver) return;

    const from = activePiece.rotation;
    const to = direction === 'CW' ? (from + 1) % 4 : (from + 3) % 4;

    const rotatedShape =
      direction === 'CW'
        ? rotateMatrixCW(activePiece.shape)
        : rotateMatrixCCW(activePiece.shape);

    const kicks = getKickTests(activePiece.type, from, to);

    for (let i = 0; i < kicks.length; i += 1) {
      const dx = kicks[i][0];
      const dyUp = kicks[i][1];

      const nx = activePiece.x + dx;
      const ny = activePiece.y - dyUp;

      if (!collide(nx, ny, rotatedShape)) {
        activePiece.shape = rotatedShape;
        activePiece.rotation = to;
        activePiece.x = nx;
        activePiece.y = ny;

        AudioSfx.playRotate();

        // If rotated away from contact, cancel lock timer
        if (!isPieceTouchingDown()) {
          isTouching = false;
          touchStartTime = 0;
        }

        return;
      }
    }
  }

  // toggle pause (Esc/F1)
  function togglePause() {
    if (gameOver) return;

    // If countdown is running, stop it and stay paused
    if (countdownActive) {
      countdownActive = false;
      running = false;
      setNotice('PAUSED');
      if (playBtn) playBtn.textContent = 'PLAY';
      return;
    }

    // If running -> pause now
    if (running) {
      running = false;
      setNotice('PAUSED');
      if (playBtn) playBtn.textContent = 'PLAY';
      return;
    }

    // If paused -> resume with countdown
    if (playBtn) playBtn.textContent = 'PAUSE';
    startCountdown();
  }

  function update(time = 0) {
    // countdown handling (3 seconds)
    if (!gameOver && countdownActive) {
      if (countdownStartTime === null) {
        countdownStartTime = time;
  }

      const elapsed = time - countdownStartTime;
      const remaining = 3 - Math.floor(elapsed / 1000);

      if (remaining > 0) {
        setNotice(String(remaining));
      } else {
        countdownActive = false;
        setNotice('');
        running = true;
        lastDropTime = time;
      }
    }

    if (running && !gameOver) {
      // Gravity (one step per interval)
      if (time - lastDropTime > dropInterval) {
        stepDown();
        lastDropTime = time;
      }

      // Lock delay check (0.5s)
      if (activePiece) {
        if (isPieceTouchingDown()) {
          if (!isTouching) {
            isTouching = true;
            touchStartTime = time;

            AudioSfx.playLanding();
          } else if (time - touchStartTime >= lockDelayMs) {
            isTouching = false;
            touchStartTime = 0;
            lockAndSpawnNext();
          }
        } else {
          isTouching = false;
          touchStartTime = 0;
        }
      }
    }

    const ghostY = getGhostY();
    Renderer.render(board, activePiece, VISIBLE_START, ghostY, nextQueue, holdType);
    requestAnimationFrame(update);
  }

  function init() {
    playBtn = document.getElementById('playBtn');

    playBtn.onclick = () => {
      AudioSfx.unlock();

      if (gameOver) return;

      // If running -> pause
      if (running) {
        running = false;
        countdownActive = false;
        setNotice('PAUSED');
        playBtn.textContent = 'PLAY';
        AudioSfx.pauseMusic();
        return;
      }

      // If paused -> start/resume with countdown
      playBtn.textContent = 'PAUSE';
      AudioSfx.playMusic();
      startCountdown();
    };

    refillNextQueue();
    spawnPiece();
    updateHUD();
    setNotice('');
    requestAnimationFrame(update);
  }

  return {
    init,
    togglePause,
    hold,
    moveLeft: () => move(-1),
    moveRight: () => move(1),
    softDrop,
    hardDrop,
    rotateCW: () => rotate('CW'),
    rotateCCW: () => rotate('CCW'),
  };
})();

Controller.bind();
Tetris.init();
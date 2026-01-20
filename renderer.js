// Rendering logic

const Renderer = (() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // side canvases for Step 12 (Hold / Next)
  const holdCanvas = document.getElementById('holdCanvas');
  const holdCtx = holdCanvas ? holdCanvas.getContext('2d') : null;
  const nextCanvas = document.getElementById('nextCanvas');
  const nextCtx = nextCanvas ? nextCanvas.getContext('2d') : null;

  const COLS = 10;
  const ROWS_VISIBLE = 20;
  const BLOCK = 24;

  // block size for preview canvases
  const PREVIEW_BLOCK = 20;

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS_VISIBLE * BLOCK);

    ctx.strokeStyle = '#e0e0e0';

    for (let x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK + 0.5, 0);
      ctx.lineTo(x * BLOCK + 0.5, ROWS_VISIBLE * BLOCK);
      ctx.stroke();
    }

    for (let y = 0; y <= ROWS_VISIBLE; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK + 0.5);
      ctx.lineTo(COLS * BLOCK, y * BLOCK + 0.5);
      ctx.stroke();
    }

    // Frame
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, COLS * BLOCK, ROWS_VISIBLE * BLOCK);
    ctx.lineWidth = 1;
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);

    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  }

  // raw preview cell (for hold/next canvases)
  function drawPreviewCell(pctx, x, y, color) {
    pctx.fillStyle = color;
    pctx.fillRect(x * PREVIEW_BLOCK, y * PREVIEW_BLOCK, PREVIEW_BLOCK, PREVIEW_BLOCK);
    pctx.strokeStyle = '#ffffff';
    pctx.strokeRect(x * PREVIEW_BLOCK, y * PREVIEW_BLOCK, PREVIEW_BLOCK, PREVIEW_BLOCK);
  }

  // Draw locked blocks from the full 40-row board,
  // showing only rows [visibleStart .. visibleStart+19]
  function drawBoard(board, visibleStart) {
    if (!board) return;

    for (let y = visibleStart; y < visibleStart + ROWS_VISIBLE; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = board[y][x];
        if (cell !== 0) {
          // convert board Y => visible Y
          drawCell(x, y - visibleStart, cell);
        }
      }
    }
  }

  // Draw a piece that is positioned in BOARD coordinates
  function drawMatrix(matrix, offsetX, offsetY, color, visibleStart) {
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue;

        const drawX = x + offsetX;

        // Convert board y to visible y by subtracting visibleStart
        const drawY = (y + offsetY) - visibleStart;

        // Draw only visible rows (0..19)
        if (drawY >= 0 && drawY < ROWS_VISIBLE) {
          drawCell(drawX, drawY, color);
        }
      }
    }
  }

  // draw a piece into a preview canvas (no visibleStart math)
  function drawPreviewMatrix(pctx, matrix, color, offsetX, offsetY) {
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue;
        drawPreviewCell(pctx, x + offsetX, y + offsetY, color);
      }
    }
  }

  // clear and paint background for preview canvases
  function clearPreviewCanvas(pctx, w, h) {
    pctx.clearRect(0, 0, w, h);
    pctx.fillStyle = '#ffffff';
    pctx.fillRect(0, 0, w, h);
    pctx.strokeStyle = '#999';
    pctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  // render HOLD box (single piece)
  function renderHold(holdType) {
    if (!holdCtx || !holdCanvas) return;

    clearPreviewCanvas(holdCtx, holdCanvas.width, holdCanvas.height);
    if (!holdType) return;

    const def = Pieces[holdType];
    if (!def) return;

    const shape = def.shape;
    const color = def.color;

    // Center the shape in a 6x6-ish grid
    const gridW = Math.floor(holdCanvas.width / PREVIEW_BLOCK);
    const gridH = Math.floor(holdCanvas.height / PREVIEW_BLOCK);
    const offsetX = Math.floor((gridW - shape[0].length) / 2);
    const offsetY = Math.floor((gridH - shape.length) / 2);

    drawPreviewMatrix(holdCtx, shape, color, offsetX, offsetY);
  }

  // render NEXT queue (up to 6 pieces stacked)
  function renderNext(nextQueue) {
    if (!nextCtx || !nextCanvas) return;

    clearPreviewCanvas(nextCtx, nextCanvas.width, nextCanvas.height);
    if (!nextQueue || nextQueue.length === 0) return;

    const show = nextQueue.slice(0, 6);

    // Each piece gets a 4-row tall "slot" in preview grid
    const slotH = 4;
    const gridW = Math.floor(nextCanvas.width / PREVIEW_BLOCK);

    for (let i = 0; i < show.length; i += 1) {
      const type = show[i];
      const def = Pieces[type];
      if (!def) continue;

      const shape = def.shape;
      const color = def.color;

      const offsetX = Math.floor((gridW - shape[0].length) / 2);
      const offsetY = i * slotH + Math.floor((slotH - shape.length) / 2);

      drawPreviewMatrix(nextCtx, shape, color, offsetX, offsetY);
    }
  }

  
  function render(board, activePiece, visibleStart, ghostY, nextQueue, holdType) {
    drawGrid();

    // Locked blocks first
    drawBoard(board, visibleStart);

    // Ghost piece (drawn under the active piece)
    if (activePiece && ghostY !== null && ghostY !== undefined) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      drawMatrix(activePiece.shape, activePiece.x, ghostY, activePiece.color, visibleStart);
      ctx.restore();
    }

    // Then the falling piece on top
    if (activePiece) {
      drawMatrix(activePiece.shape, activePiece.x, activePiece.y, activePiece.color, visibleStart);
    }

    // side previews
    renderHold(holdType);
    renderNext(nextQueue);
  }

  return { render };
})();

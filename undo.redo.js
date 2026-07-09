/* undo.redo.js — undo / redo logic */

/* DOM references */
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");

function undoMove() {
  if (moveHistory.length === 0) return;

  const last = moveHistory.pop();
  board = cloneBoard(last.prevBoard);
  castlingRights = { ...last.prevCastling };
  enPassantTarget = last.prevEP;
  whiteToMove = last.whiteToMoveBefore;

  redoStack.push(last);

  lastMoveInfo = moveHistory.length
    ? {
        fromX: moveHistory[moveHistory.length - 1].move.fromX,
        fromY: moveHistory[moveHistory.length - 1].move.fromY,
        toX: moveHistory[moveHistory.length - 1].move.toX,
        toY: moveHistory[moveHistory.length - 1].move.toY,
        resultType: "normal",
        special: moveHistory[moveHistory.length - 1].move.special,
        sideWhite: moveHistory[moveHistory.length - 1].whiteToMoveBefore
      }
    : null;

  rebuildCapturedUI();
  rebuildMoveLogUI();
  renderBoard();
}

function redoMove() {
  if (redoStack.length === 0) return;

  const entry = redoStack.pop();
  board = cloneBoard(entry.prevBoard);
  applyMove(entry.move);
  renderBoard();
}

function rebuildCapturedUI() {
  capturedPlayerEl.innerHTML = "";
  capturedAiEl.innerHTML = "";

  moveHistory.forEach(entry => {
    const captured = entry.captured;
    if (!captured) return;

    const isWhiteCap = isWhitePiece(captured);
    const typeCap = captured.toLowerCase();
    const sideCap = isWhiteCap ? "white" : "black";
    const svgPathCap = `pieces/${sideCap}_${pieceName(typeCap)}.svg`;

    const imgCap = document.createElement("img");
    imgCap.className = "captured-piece-img";
    imgCap.src = svgPathCap;

    const capturedEl = isWhiteCap ? capturedPlayerEl : capturedAiEl;
    capturedEl.appendChild(imgCap);
  });
}

function rebuildMoveLogUI() {
  moveLogEl.innerHTML = "";

  moveHistory.forEach(entry => {
    const { move, captured } = entry;
    const piece = entry.prevBoard[move.fromY][move.fromX];

    const li = document.createElement("li");
    const from = indexToCoord(move.fromX, move.fromY);
    const to = indexToCoord(move.toX, move.toY);

    let text = piece.toUpperCase() + " " + from + "→" + to;
    if (captured) text += " x" + pieceName(captured.toLowerCase());
    if (move.special === "castle") text += " (castle)";
    if (move.special === "enpassant") text += " (ep)";

    li.textContent = text;
    moveLogEl.appendChild(li);
  });

  moveLogEl.scrollTop = moveLogEl.scrollHeight;
}

/* BUTTON EVENTS */
undoBtn.addEventListener("click", undoMove);
redoBtn.addEventListener("click", redoMove);

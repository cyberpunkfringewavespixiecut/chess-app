/* undo.redo.js — undo / redo logic */

/* DOM references */
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");

window.redoStack = window.redoStack || [];

/* UNDO */
function undoMove() {
  if (!window.moveHistory || window.moveHistory.length === 0) return;

  const last = window.moveHistory.pop();
  window.redoStack.push(last);

  window.board = window.cloneBoard(last.prevBoard);
  window.castlingRights = { ...last.prevCastling };
  window.enPassantTarget = last.prevEP;
  window.whiteToMove = last.whiteToMoveBefore;

  if (window.moveHistory.length) {
    const prev = window.moveHistory[window.moveHistory.length - 1];
    window.lastMoveInfo = {
      fromX: prev.move.fromX,
      fromY: prev.move.fromY,
      toX: prev.move.toX,
      toY: prev.move.toY,
      resultType: prev.captured ? "capture" : "normal",
      special: prev.move.special,
      sideWhite: prev.whiteToMoveBefore
    };
  } else {
    window.lastMoveInfo = null;
  }

  window.renderCapturedPanels();
  window.renderMoveLog();
  window.currentHistoryIndex = null;
  window.highlightMoveInLog(null);
  window.renderBoard();
}

/* REDO */
function redoMove() {
  if (!window.redoStack || window.redoStack.length === 0) return;

  const entry = window.redoStack.pop();

  window.board = window.cloneBoard(entry.prevBoard);
  applyMove(entry.move);

  window.renderCapturedPanels();
  window.renderMoveLog();
  window.currentHistoryIndex = null;
  window.highlightMoveInLog(null);
  window.renderBoard();
}

/* BUTTON EVENTS */
undoBtn.addEventListener("click", undoMove);
redoBtn.addEventListener("click", redoMove);

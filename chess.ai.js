/* chess.ai.js — Stockfish engine, AI move (win handled in chess.logic.js) */

const engine = new Worker("chess-data/engine/stockfish.js");

/* ENGINE MESSAGE HANDLER */
engine.onmessage = (e) => {
  const text = e.data;
  if (typeof text !== "string") return;
  if (text.includes("bestmove")) {
    const move = text.split("bestmove ")[1].split(" ")[0];
    window.applyEngineMove(move);
  }
};

/* SEND FEN TO ENGINE */
function sendFenToEngine() {
  const fen = window.boardToFEN();
  engine.postMessage("uci");
  engine.postMessage("ucinewgame");
  engine.postMessage("position fen " + fen);
}

/* AI MOVE REQUEST (depth-based levels) */
function requestAiMoveIfNeeded() {
  const isAiTurn =
    (window.whiteToMove && window.playerSide === "black") ||
    (!window.whiteToMove && window.playerSide === "white");

  if (!isAiTurn || !window.aiLevel) return;

  if (window.aiLevel === "beginner") {
    engine.postMessage("go depth 2");
  } else if (window.aiLevel === "medium") {
    engine.postMessage("go depth 5");
  } else if (window.aiLevel === "hard") {
    engine.postMessage("go depth 10");
  } else {
    engine.postMessage("go depth 1");
  }
}

/* APPLY ENGINE MOVE */
function applyEngineMove(uciMove) {
  const fromFile = uciMove[0];
  const fromRank = parseInt(uciMove[1], 10);
  const toFile = uciMove[2];
  const toRank = parseInt(uciMove[3], 10);

  const from = window.coordToIndex(fromFile + fromRank);
  const to = window.coordToIndex(toFile + toRank);

  const moves = window.generateLegalMovesForSquare(from.x, from.y);
  let move = moves.find(m => m.toX === to.x && m.toY === to.y);
  if (!move) return;

  if (uciMove.length === 5) {
    window.applyMove(move, { promoteTo: uciMove[4] });
  } else {
    const piece = window.board[from.y][from.x];
    if (piece.toLowerCase() === "p" && (to.y === 0 || to.y === 7)) {
      window.applyMove(move, { promoteTo: "q" });
    } else {
      window.applyMove(move);
    }
  }

  // CHECK GAME END BEFORE ANY FURTHER ACTION
  const ended = window.checkGameEnd();
  if (ended) {
    // overlay + text handled inside chess.logic.js
    return;
  }

  window.renderBoard();
  window.sendFenToEngine();
  window.requestAiMoveIfNeeded();
}

/* expose globals */
window.sendFenToEngine = sendFenToEngine;
window.requestAiMoveIfNeeded = requestAiMoveIfNeeded;
window.applyEngineMove = applyEngineMove;

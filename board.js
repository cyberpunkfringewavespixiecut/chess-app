/* board.js — core board state */

/* INITIAL BOARD SETUP */
function createInitialBoard() {
  return [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"]
  ];
}

/* GLOBAL STATE */
window.board = createInitialBoard();
window.whiteToMove = true;

window.castlingRights = { WK: true, WQ: true, BK: true, BQ: true };
window.enPassantTarget = null;

window.selectedSquare = null;
window.legalMovesCache = [];
window.lastMoveInfo = null;

window.pendingPromotionMove = null;
window.pendingPromotionIsWhite = null;

window.flipBoard = false;

window.moveHistory = [];
window.redoStack = [];

window.files = ["a","b","c","d","e","f","g","h"];

/* PLAYER SIDE + AI LEVEL */
window.playerSide = "white";
window.aiLevel = "medium";

/* DOM REFERENCES */
window.boardEl = document.getElementById("board");
window.capturedPlayerEl = document.getElementById("captured-player");
window.capturedAiEl = document.getElementById("captured-ai");
window.moveLogEl = document.getElementById("move-log");

/* OVERLAY ELEMENTS */
window.winOverlayEl = document.getElementById("gameover-overlay");
window.winTextEl = document.getElementById("gameover-text");

/* PROMOTION OVERLAY */
window.promotionOverlayEl = document.getElementById("promotion-overlay");
window.promotionChoicesEl = document.getElementById("promotion-choices");

/* TRAP REMOVED — SILENT NO-OP */
window.trap = {
  log: () => {},
  warn: () => {},
  err: () => {}
};

/* HELPERS */
window.cloneBoard = b => b.map(row => row.slice());

window.coordToIndex = coord => {
  const file = coord[0];
  const rank = parseInt(coord[1], 10);
  const x = window.files.indexOf(file);
  const y = 8 - rank;
  return { x, y };
};

window.indexToCoord = (x, y) => {
  const file = window.files[x];
  const rank = 8 - y;
  return file + rank;
};

window.uiToBoard = (x, y) => window.flipBoard ? { x: 7 - x, y: 7 - y } : { x, y };
window.boardToUI = (x, y) => window.flipBoard ? { x: 7 - x, y: 7 - y } : { x, y };

/* RESET BOARD */
window.resetBoardState = function() {
  window.board = createInitialBoard();
  window.whiteToMove = true;
  window.castlingRights = { WK: true, WQ: true, BK: true, BQ: true };
  window.enPassantTarget = null;
  window.selectedSquare = null;
  window.legalMovesCache = [];
  window.lastMoveInfo = null;
  window.pendingPromotionMove = null;
  window.pendingPromotionIsWhite = null;
  window.moveHistory = [];
  window.redoStack = [];
  window.capturedPlayerEl.innerHTML = "";
  window.capturedAiEl.innerHTML = "";
  window.moveLogEl.innerHTML = "";

  window.winOverlayEl.classList.add("hidden");
};

/* FEN EXPORT */
window.boardToFEN = function() {
  let fen = "";
  for (let y = 0; y < 8; y++) {
    let empty = 0;
    for (let x = 0; x < 8; x++) {
      const p = window.board[y][x];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += p;
      }
    }
    if (empty > 0) fen += empty;
    if (y < 7) fen += "/";
  }

  fen += " " + (window.whiteToMove ? "w" : "b") + " ";

  let cr = "";
  if (window.castlingRights.WK) cr += "K";
  if (window.castlingRights.WQ) cr += "Q";
  if (window.castlingRights.BK) cr += "k";
  if (window.castlingRights.BQ) cr += "q";
  if (!cr) cr = "-";

  fen += cr + " ";
  fen += window.enPassantTarget ? window.enPassantTarget : "-";
  fen += " 0 1";

  return fen;
};

/* AUTO‑CLOSE GAMEOVER OVERLAY */
if (window.winOverlayEl) {
  window.winOverlayEl.addEventListener("click", () => {
    window.winOverlayEl.classList.add("hidden");
  });
}

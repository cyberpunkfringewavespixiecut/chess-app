/* moves.js — clickable move history + FEN rewind system */

window.moveLogEl = document.getElementById("move-log");
window.currentHistoryIndex = null;     // highlighted index

const pieceSVG = {
  w: {
    N: "chess-data/pieces/white_knight.svg",
    B: "chess-data/pieces/white_bishop.svg",
    R: "chess-data/pieces/white_rook.svg",
    Q: "chess-data/pieces/white_queen.svg",
    K: "chess-data/pieces/white_king.svg"
  },
  b: {
    N: "chess-data/pieces/black_knight.svg",
    B: "chess-data/pieces/black_bishop.svg",
    R: "chess-data/pieces/black_rook.svg",
    Q: "chess-data/pieces/black_queen.svg",
    K: "chess-data/pieces/black_king.svg"
  }
};

function formatMoveWithIcon(san, isWhite) {
  if (!san || san.length === 0) return san;
  const first = san[0];
  if (!pieceSVG[isWhite ? "w" : "b"][first]) return san;
  const cleaned = san.substring(1);
  const img = `<img src="${pieceSVG[isWhite ? "w" : "b"][first]}" class="move-icon" />`;
  return `${img} ${cleaned}`;
}

window.addMoveToHistory = function(san, fen, isWhiteMove) {
  const display = formatMoveWithIcon(san, isWhiteMove);
  window.moveHistory.push({ san: display, fen });

  renderMoveLog();

  // new move → live mode → clear highlight
  window.currentHistoryIndex = null;
  window.highlightMoveInLog(null);
};

window.renderMoveLog = function() {
  window.moveLogEl.innerHTML = "";

  window.moveHistory.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = entry.san;
    li.dataset.index = index;
    li.addEventListener("click", () => window.jumpToMove(index));
    window.moveLogEl.appendChild(li);
  });

  if (window.currentHistoryIndex !== null) {
    window.highlightMoveInLog(window.currentHistoryIndex);
  }
};

window.jumpToMove = function(index) {
  const entry = window.moveHistory[index];
  if (!entry) return;

  window.currentHistoryIndex = index;

  // load board snapshot
  window.board = createInitialBoard();
  window.whiteToMove = true;
  window.castlingRights = { WK: true, WQ: true, BK: true, BQ: true };
  window.enPassantTarget = null;
  window.selectedSquare = null;
  window.legalMovesCache = [];
  window.lastMoveInfo = null;
  window.pendingPromotionMove = null;
  window.pendingPromotionIsWhite = null;

  window.loadFEN(entry.fen);
  window.renderBoard();

  window.highlightMoveInLog(index);
};

window.loadFEN = function(fen) {
  const parts = fen.split(" ");
  const rows = parts[0].split("/");

  for (let y = 0; y < 8; y++) {
    let row = rows[y];
    let x = 0;

    for (let char of row) {
      if (isNaN(char)) {
        window.board[y][x] = char;
        x++;
      } else {
        const empty = parseInt(char, 10);
        for (let i = 0; i < empty; i++) {
          window.board[y][x] = "";
          x++;
        }
      }
    }
  }

  window.whiteToMove = parts[1] === "w";

  const cr = parts[2];
  window.castlingRights = {
    WK: cr.includes("K"),
    WQ: cr.includes("Q"),
    BK: cr.includes("k"),
    BQ: cr.includes("q")
  };

  window.enPassantTarget = parts[3] !== "-" ? parts[3] : null;
};

window.highlightMoveInLog = function(index) {
  const items = window.moveLogEl.querySelectorAll("li");

  items.forEach(li => li.classList.remove("active-move"));

  if (index === null) return;

  if (items[index]) {
    items[index].classList.add("active-move");
    items[index].scrollIntoView({ block: "nearest" });
  }
};

window.addEventListener("keydown", (e) => {
  if (!window.moveHistory.length) return;
  if (window.currentHistoryIndex === null) return;

  const lastIndex = window.moveHistory.length - 1;

  if (e.key === "ArrowUp") {
    e.preventDefault();
    window.currentHistoryIndex = Math.max(0, window.currentHistoryIndex - 1);
    window.jumpToMove(window.currentHistoryIndex);
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();

    if (window.currentHistoryIndex < lastIndex) {
      window.currentHistoryIndex++;
      window.jumpToMove(window.currentHistoryIndex);
    } else {
      // stick highlight at bottom
      window.currentHistoryIndex = lastIndex;
      window.highlightMoveInLog(lastIndex);
    }
  }
});

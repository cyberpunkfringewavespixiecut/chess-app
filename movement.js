/* movement.js — render, click, drag, promotion, move history glow, tint, AO depth */

window.glowEnabled = window.glowEnabled ?? true;
window.tintEnabled = window.tintEnabled ?? true;

/* AO (Ambient Occlusion) */
window.depthEnabled = window.depthEnabled ?? false;
window.depthIntensity = window.depthIntensity ?? 0.5;
window.depthWhiteColor = window.depthWhiteColor ?? "#d09090";
window.depthBlackColor = window.depthBlackColor ?? "#000000";

let dragSource = null;

/* PIECE NAME MAP */
function pieceName(t) {
  switch (t.toLowerCase()) {
    case "k": return "king";
    case "q": return "queen";
    case "r": return "rook";
    case "b": return "bishop";
    case "n": return "knight";
    case "p": return "pawn";
    default:  return "pawn";
  }
}

/* UI-SIDE KING LEGAL MOVE GENERATOR (HARD LOCK) */
function generateKingLegalMovesUI(x, y) {
  const piece = window.board[y][x];
  if (!piece || piece.toLowerCase() !== "k") return [];

  const isWhite = window.isWhitePiece(piece);

  // only allow current side to move
  if ((window.whiteToMove && !isWhite) || (!window.whiteToMove && isWhite)) return [];

  const moves = [];

  const addMove = (toX, toY, special = null) => {
    if (toX < 0 || toX > 7 || toY < 0 || toY > 7) return;
    const target = window.board[toY][toX];

    // destination must NOT be attacked by opponent
    if (window.squareAttacked(toX, toY, !isWhite)) return;

    if (special === "castle") {
      moves.push({ fromX: x, fromY: y, toX, toY, special });
      return;
    }

    if (!target) {
      moves.push({ fromX: x, fromY: y, toX, toY, special });
    } else {
      const targetIsWhite = window.isWhitePiece(target);
      if (isWhite && !targetIsWhite) moves.push({ fromX: x, fromY: y, toX, toY, special });
      if (!isWhite && targetIsWhite) moves.push({ fromX: x, fromY: y, toX, toY, special });
    }
  };

  // normal king steps
  const steps = [
    [1,0],[-1,0],[0,1],[0,-1],
    [1,1],[1,-1],[-1,1],[-1,-1]
  ];
  steps.forEach(([dx,dy]) => {
    const tx = x + dx;
    const ty = y + dy;
    addMove(tx, ty);
  });

  // castling (UI-side check, matching engine rights)
  const cr = window.castlingRights || {};

  // WHITE KING CASTLING
  if (isWhite && y === 7 && x === 4) {
    // King-side (e1 → g1)
    if (cr.WK &&
        !window.board[7][5] && !window.board[7][6] &&
        window.board[7][7] === "R" &&
        !window.squareAttacked(4,7,false) &&
        !window.squareAttacked(5,7,false) &&
        !window.squareAttacked(6,7,false)) {
      addMove(6, 7, "castle");
    }

    // Queen-side (e1 → c1)
    if (cr.WQ &&
        !window.board[7][3] && !window.board[7][2] && !window.board[7][1] &&
        window.board[7][0] === "R" &&
        !window.squareAttacked(4,7,false) &&
        !window.squareAttacked(3,7,false) &&
        !window.squareAttacked(2,7,false)) {
      addMove(2, 7, "castle");
    }
  }

  // BLACK KING CASTLING
  if (!isWhite && y === 0 && x === 4) {
    // King-side (e8 → g8)
    if (cr.BK &&
        !window.board[0][5] && !window.board[0][6] &&
        window.board[0][7] === "r" &&
        !window.squareAttacked(4,0,true) &&
        !window.squareAttacked(5,0,true) &&
        !window.squareAttacked(6,0,true)) {
      addMove(6, 0, "castle");
    }

    // Queen-side (e8 → c8)
    if (cr.BQ &&
        !window.board[0][3] && !window.board[0][2] && !window.board[0][1] &&
        window.board[0][0] === "r" &&
        !window.squareAttacked(4,0,true) &&
        !window.squareAttacked(3,0,true) &&
        !window.squareAttacked(2,0,true)) {
      addMove(2, 0, "castle");
    }
  }

  return moves;
}

/* RENDER PIECE */
function renderPiece(piece, square) {
  const isWhite = piece === piece.toUpperCase();
  const type = piece.toLowerCase();
  const side = isWhite ? "white" : "black";
  const svgPath = `chess-data/pieces/${side}_${pieceName(type)}.svg`;

  const img = document.createElement("img");
  img.className = "piece-img";
  img.draggable = true;
  img.src = svgPath;

  let filterParts = [];

  img.style.mixBlendMode = window.tintEnabled ? "screen" : "normal";

  if (window.glowEnabled) {
    filterParts.push("drop-shadow(0 0 12px rgba(148,163,184,0.85))");
  } else {
    filterParts.push("drop-shadow(0 0 4px rgba(148,163,184,0.45))");
  }

  if (window.depthEnabled) {
    const intensity = window.depthIntensity || 0.5;
    const aoColor = isWhite ? window.depthWhiteColor : window.depthBlackColor;
    filterParts.push(`drop-shadow(0 0 ${8 * intensity}px ${aoColor})`);
  }

  img.style.filter = filterParts.join(" ");

  img.onerror = () => {
    img.style.opacity = "0.6";
  };

  img.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    onPieceDragStart(e, square);

    const ghost = img.cloneNode(true);
    ghost.style.width = "48px";
    ghost.style.height = "48px";
    ghost.style.opacity = "0.9";
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    ghost.style.pointerEvents = "none";
    ghost.classList.add("drag-ghost");
    document.body.appendChild(ghost);

    e.dataTransfer.setDragImage(ghost, 24, 24);
    e.dataTransfer.setData("text/plain", "piece");
  });

  img.addEventListener("dragend", () => {
    onPieceDragEnd(square);
    document.querySelectorAll(".drag-ghost").forEach(g => g.remove());
  });

  square.appendChild(img);
}

/* RENDER BOARD */
function renderBoard() {
  window.boardEl.innerHTML = "";

  const light = window.boardColors.light;
  const dark = window.boardColors.dark;

  for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
    const y = window.flipBoard ? 7 - rowIndex : rowIndex;

    for (let colIndex = 0; colIndex < 8; colIndex++) {
      const x = window.flipBoard ? 7 - colIndex : colIndex;

      const square = document.createElement("div");
      square.classList.add("square");

      const isDark = (x + y) % 2 === 1;
      square.classList.add(isDark ? "dark" : "light");
      square.dataset.x = x;
      square.dataset.y = y;

      square.style.backgroundColor = isDark ? dark : light;

      const piece = window.board[y][x];
      if (piece) renderPiece(piece, square);

      if (window.selectedSquare &&
          window.selectedSquare.x === x &&
          window.selectedSquare.y === y) {
        square.classList.add("selected");
      }

      const isLegal = window.legalMovesCache.some(m => m.toX === x && m.toY === y);
      if (isLegal) square.classList.add("highlight");

      if (window.lastMoveInfo) {
        const { fromX, fromY, toX, toY, resultType, sideWhite } = window.lastMoveInfo;

        if (x === fromX && y === fromY) square.classList.add("history-from");

        if (x === toX && y === toY) {
          if (resultType === "capture") square.classList.add("history-to-capture");
          else if (resultType === "check") square.classList.add("history-to-check");
          else if (resultType === "checkmate") square.classList.add("history-to-check");
          else square.classList.add("history-to-normal");
        }

        if (resultType === "check" || resultType === "checkmate") {
          const kingPos = window.findKing(!sideWhite);
          if (kingPos && kingPos.x === x && kingPos.y === y) {
            square.classList.add(resultType === "check" ? "history-king-check" : "history-king-mate");
          }
        }
      }

      if (!window.glowEnabled) square.classList.add("glow-disabled");

      square.addEventListener("click", onSquareClick);
      square.addEventListener("dragover", onSquareDragOver);
      square.addEventListener("drop", onSquareDrop);
      square.addEventListener("dragleave", onSquareDragLeave);

      window.boardEl.appendChild(square);
    }
  }
}

/* CLICK HANDLER */
function onSquareClick(e) {
  const x = parseInt(e.currentTarget.dataset.x, 10);
  const y = parseInt(e.currentTarget.dataset.y, 10);
  const piece = window.board[y][x];

  const isPlayerTurn =
    (window.whiteToMove && window.playerSide === "white") ||
    (!window.whiteToMove && window.playerSide === "black");

  if (!isPlayerTurn && window.playerSide !== "none") return;

  if (window.selectedSquare) {
    const move = window.legalMovesCache.find(m => m.toX === x && m.toY === y);

    if (move) {
      const fromPiece = window.board[window.selectedSquare.y][window.selectedSquare.x];

      if (fromPiece.toLowerCase() === "p" && (move.toY === 0 || move.toY === 7)) {
        window.applyMove(move, { promoteTo: "q" });
      } else {
        window.applyMove(move);
      }

      window.selectedSquare = null;
      window.legalMovesCache = [];

      const ended = window.checkGameEnd();
      if (ended) return;

      renderBoard();
      window.sendFenToEngine();
      window.requestAiMoveIfNeeded();
      return;
    }

    window.selectedSquare = null;
    window.legalMovesCache = [];
    renderBoard();
    return;
  }

  if (!piece) return;

  const isWhitePiece = window.isWhitePiece(piece);
  if ((window.whiteToMove && !isWhitePiece) || (!window.whiteToMove && isWhitePiece)) return;

  window.selectedSquare = { x, y };

  let moves;
  if (piece.toLowerCase() === "k") {
    // use UI-side king generator (hard-locked by squareAttacked)
    moves = generateKingLegalMovesUI(x, y);
  } else {
    // other pieces use engine legal generator
    moves = window.generateLegalMovesForSquare(x, y);
  }

  window.legalMovesCache = moves;
  renderBoard();
}

/* DRAG START */
function onPieceDragStart(e, square) {
  const x = parseInt(square.dataset.x, 10);
  const y = parseInt(square.dataset.y, 10);
  const piece = window.board[y][x];

  const isPlayerTurn =
    (window.whiteToMove && window.playerSide === "white") ||
    (!window.whiteToMove && window.playerSide === "black");

  if (!isPlayerTurn && window.playerSide !== "none") {
    e.preventDefault();
    return;
  }

  const isWhite = window.isWhitePiece(piece);
  if ((window.whiteToMove && !isWhite) || (!window.whiteToMove && isWhite)) {
    e.preventDefault();
    return;
  }

  dragSource = { x, y };
  window.selectedSquare = { x, y };

  let moves;
  if (piece.toLowerCase() === "k") {
    moves = generateKingLegalMovesUI(x, y);
  } else {
    moves = window.generateLegalMovesForSquare(x, y);
  }

  window.legalMovesCache = moves;

  square.classList.add("drag-source");
}

/* DRAG END */
function onPieceDragEnd(square) {
  square.classList.remove("drag-source");
  dragSource = null;
  window.selectedSquare = null;
  window.legalMovesCache = [];
  renderBoard();
}

/* DRAG OVER */
function onSquareDragOver(e) {
  e.preventDefault();
  const x = parseInt(e.currentTarget.dataset.x, 10);
  const y = parseInt(e.currentTarget.dataset.y, 10);
  const isLegal = window.legalMovesCache.some(m => m.toX === x && m.toY === y);
  if (isLegal) e.currentTarget.classList.add("drag-over");
}

/* DRAG LEAVE */
function onSquareDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

/* DROP */
function onSquareDrop(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  e.currentTarget.classList.remove("drag-over");
  if (!dragSource) return;

  const toX = parseInt(e.currentTarget.dataset.x, 10);
  const toY = parseInt(e.currentTarget.dataset.y, 10);

  const move = window.legalMovesCache.find(m => m.toX === toX && m.toY === toY);
  if (move) {
    const fromPiece = window.board[dragSource.y][dragSource.x];

    if (
      fromPiece.toLowerCase() === "p" &&
      (move.toY === 0 || move.toY === 7) &&
      window.playerSide !== "none"
    ) {
      const promoteTo = prompt("Promote to (q,r,b,n):", "q") || "q";
      window.applyMove(move, { promoteTo });
    } else {
      window.applyMove(move);
    }

    window.selectedSquare = null;
    window.legalMovesCache = [];
    dragSource = null;

    const ended = window.checkGameEnd();
    if (ended) return;

    renderBoard();
    window.sendFenToEngine();
    window.requestAiMoveIfNeeded();
  }
}

/* INIT */
window.addEventListener("load", () => {
  renderBoard();
});

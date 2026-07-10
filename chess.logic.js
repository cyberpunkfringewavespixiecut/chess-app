/* chess.logic.js — rules, legal moves, applyMove, promotion overlay, game end */

/* === BASIC HELPERS === */
function isWhitePiece(p) { return p && p === p.toUpperCase(); }
function isBlackPiece(p) { return p && p === p.toLowerCase(); }

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

window.generateSAN = function(move) {
  const { fromX, fromY, toX, toY, special } = move;

  const board = window.board;
  const piece = board[fromY][fromX];
  const target = board[toY][toX];

  if (!piece) return "";

  const files = window.files || ["a","b","c","d","e","f","g","h"];
  const fromFile = files[fromX];
  const toFile = files[toX];
  const fromRank = 8 - fromY;
  const toRank = 8 - toY;

  const isWhite = piece === piece.toUpperCase();
  const type = piece.toLowerCase();

  // Castling
  if (special === "castle") {
    if (toX === 6) return "O-O";
    if (toX === 2) return "O-O-O";
  }

  let san = "";

  // Piece letter (no letter for pawn)
  if (type !== "p") {
    const map = { k: "K", q: "Q", r: "R", b: "B", n: "N" };
    san += map[type] || "";
  }

  // Capture
  const isCapture = !!target || special === "enpassant";
  if (type === "p" && isCapture) {
    san += fromFile;
  }
  if (isCapture) {
    san += "x";
  }

  // Destination square
  san += toFile + toRank;

  // Promotion
  if (type === "p" && (toY === 0 || toY === 7) && move.promoteTo) {
    const promoMap = { q: "Q", r: "R", b: "B", n: "N" };
    san += "=" + (promoMap[move.promoteTo.toLowerCase()] || "Q");
  }

  // Check / mate (simple check detection using inCheck)
  const sideWhite = isWhite;
  const kingPos = window.findKing(!sideWhite);
  if (kingPos && window.squareAttacked(kingPos.x, kingPos.y, sideWhite)) {
    const oppInMate = window.inCheckmate(!sideWhite);
    san += oppInMate ? "#" : "+";
  }

  return san;
};

/* === ATTACK / CHECK (PATCHED WITH TRACKER + CORRECT PAWN LOGIC) === */
function squareAttacked(x, y, byWhite) {
  const isAttacker = (p) => {
    if (!p) return false;
    return byWhite ? isWhitePiece(p) : isBlackPiece(p);
  };

  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      const p = board[ty][tx];
      if (!p) continue;
      const attackerIsWhite = isWhitePiece(p);
      if (attackerIsWhite !== byWhite) continue;

      if (p.toLowerCase() === "p") {
        if (attackerIsWhite) {
          if (x === tx + 1 && y === ty - 1) return true;
          if (x === tx - 1 && y === ty - 1) return true;
        } else {
          if (x === tx + 1 && y === ty + 1) return true;
          if (x === tx - 1 && y === ty + 1) return true;
        }
      }
    }
  }

  const knightMoves = [
    [1, 2], [2, 1], [-1, 2], [-2, 1],
    [1, -2], [2, -1], [-1, -2], [-2, -1]
  ];
  for (const [dx, dy] of knightMoves) {
    const tx = x + dx;
    const ty = y + dy;
    if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) continue;
    const p = board[ty][tx];
    if (p && p.toLowerCase() === "n" && isAttacker(p)) return true;
  }

  const diagDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [dx, dy] of diagDirs) {
    let tx = x + dx;
    let ty = y + dy;
    while (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) {
      const p = board[ty][tx];
      if (p) {
        const t = p.toLowerCase();
        if ((t === "b" || t === "q") && isAttacker(p)) return true;
        break;
      }
      tx += dx;
      ty += dy;
    }
  }

  const lineDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dy] of lineDirs) {
    let tx = x + dx;
    let ty = y + dy;
    while (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) {
      const p = board[ty][tx];
      if (p) {
        const t = p.toLowerCase();
        if ((t === "r" || t === "q") && isAttacker(p)) return true;
        break;
      }
      tx += dx;
      ty += dy;
    }
  }

  const kingSteps = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  for (const [dx, dy] of kingSteps) {
    const tx = x + dx;
    const ty = y + dy;
    if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) continue;
    const p = board[ty][tx];
    if (p && p.toLowerCase() === "k" && isAttacker(p)) {
      if (Math.abs(tx - x) <= 1 && Math.abs(ty - y) <= 1) return true;
    }
  }

  if (window.moveTracker && window.moveTracker.aiMoves) {
    const lastAi = window.moveTracker.lastAiMove();
    if (lastAi && lastAi.toX === x && lastAi.toY === y) {
      window.lastAiAttackSquare = { x, y };
    }
  }

  return false;
}


/* === FIND KING === */
function findKing(white) {
  const target = white ? "K" : "k";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === target) return { x, y };
    }
  }
  return null;
}

function inCheck(white) {
  const kingPos = findKing(white);
  if (!kingPos) return false;
  return squareAttacked(kingPos.x, kingPos.y, !white);
}

/* === PSEUDO MOVES === */
function generatePseudoMovesForSquare(x, y) {
  const piece = board[y][x];
  if (!piece) return [];
  const moves = [];
  const isWhite = isWhitePiece(piece);
  const dir = isWhite ? -1 : 1;

  const addMove = (fromX, fromY, toX, toY, special = null) => {
    if (toX < 0 || toX > 7 || toY < 0 || toY > 7) return;
    const target = board[toY][toX];
    if (special === "castle") {
      moves.push({ fromX, fromY, toX, toY, special });
      return;
    }
    if (!target) {
      moves.push({ fromX, fromY, toX, toY, special });
    } else {
      if (isWhite && isBlackPiece(target)) moves.push({ fromX, fromY, toX, toY, special });
      if (!isWhite && isWhitePiece(target)) moves.push({ fromX, fromY, toX, toY, special });
    }
  };

  const type = piece.toLowerCase();

  if (type === "p") {
    const startRank = isWhite ? 6 : 1;
    const oneY = y + dir;
    if (oneY >= 0 && oneY <= 7 && !board[oneY][x]) {
      addMove(x, y, x, oneY);
      const twoY = y + 2 * dir;
      if (y === startRank && !board[twoY][x]) {
        addMove(x, y, x, twoY);
      }
    }
    [-1, 1].forEach(dx => {
      const tx = x + dx;
      const ty = y + dir;
      if (tx >= 0 && tx <= 7 && ty >= 0 && ty <= 7) {
        const target = board[ty][tx];
        if (target && ((isWhite && isBlackPiece(target)) || (!isWhite && isWhitePiece(target)))) {
          addMove(x, y, tx, ty);
        }
      }
    });
    if (enPassantTarget) {
      const ep = coordToIndex(enPassantTarget);
      if (ep.y === y + dir && Math.abs(ep.x - x) === 1) {
        addMove(x, y, ep.x, ep.y, "enpassant");
      }
    }
  }

  if (type === "n") {
    const jumps = [
      [1,2],[2,1],[-1,2],[-2,1],
      [1,-2],[2,-1],[-1,-2],[-2,-1]
    ];
    jumps.forEach(([dx,dy]) => {
      const tx = x + dx;
      const ty = y + dy;
      if (tx < 0 || tx > 7 || ty < 0 || ty > 7) return;
      const target = board[ty][tx];
      if (!target || (isWhite && isBlackPiece(target)) || (!isWhite && isWhitePiece(target))) {
        addMove(x, y, tx, ty);
      }
    });
  }

  if (type === "b" || type === "r" || type === "q") {
    const dirs = [];
    if (type === "b" || type === "q") {
      dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
    }
    if (type === "r" || type === "q") {
      dirs.push([1,0],[-1,0],[0,1],[0,-1]);
    }
    dirs.forEach(([dx,dy]) => {
      let tx = x + dx;
      let ty = y + dy;
      while (tx >= 0 && tx <= 7 && ty >= 0 && ty <= 7) {
        const target = board[ty][tx];
        if (!target) {
          addMove(x, y, tx, ty);
        } else {
          if ((isWhite && isBlackPiece(target)) || (!isWhite && isWhitePiece(target))) {
            addMove(x, y, tx, ty);
          }
          break;
        }
        tx += dx;
        ty += dy;
      }
    });
  }

  if (type === "k") {
    const steps = [
      [1,0],[-1,0],[0,1],[0,-1],
      [1,1],[1,-1],[-1,1],[-1,-1]
    ];

    steps.forEach(([dx,dy]) => {
      const tx = x + dx;
      const ty = y + dy;
      if (tx < 0 || tx > 7 || ty < 0 || ty > 7) return;
      if (squareAttacked(tx, ty, !isWhite)) return;
      const target = board[ty][tx];
      if (!target || (isWhite && isBlackPiece(target)) || (!isWhite && isWhitePiece(target))) {
        addMove(x, y, tx, ty);
      }
    });

    if (isWhite && y === 7 && x === 4) {
      if (castlingRights.WK &&
          !board[7][5] && !board[7][6] &&
          board[7][7] === "R" &&
          !squareAttacked(4,7,false) &&
          !squareAttacked(5,7,false) &&
          !squareAttacked(6,7,false)) {
        addMove(x, y, 6, 7, "castle");
      }

      if (castlingRights.WQ &&
          !board[7][3] && !board[7][2] && !board[7][1] &&
          board[7][0] === "R" &&
          !squareAttacked(4,7,false) &&
          !squareAttacked(3,7,false) &&
          !squareAttacked(2,7,false)) {
        addMove(x, y, 2, 7, "castle");
      }
    }

    if (!isWhite && y === 0 && x === 4) {
      if (castlingRights.BK &&
          !board[0][5] && !board[0][6] &&
          board[0][7] === "r" &&
          !squareAttacked(4,0,true) &&
          !squareAttacked(5,0,true) &&
          !squareAttacked(6,0,true)) {
        addMove(x, y, 6, 0, "castle");
      }

      if (castlingRights.BQ &&
          !board[0][3] && !board[0][2] && !board[0][1] &&
          board[0][0] === "r" &&
          !squareAttacked(4,0,true) &&
          !squareAttacked(3,0,true) &&
          !squareAttacked(2,0,true)) {
        addMove(x, y, 2, 0, "castle");
      }
    }
  }

  return moves;
}


/* === LEGAL MOVES === */
function generateLegalMovesForSquare(x, y) {
  if (
    typeof x !== "number" || typeof y !== "number" ||
    x < 0 || x > 7 || y < 0 || y > 7 ||
    !board[y]
  ) {
    return [];
  }

  const piece = board[y][x];
  if (!piece) return [];

  const isWhite = isWhitePiece(piece);

  if ((whiteToMove && !isWhite) || (!whiteToMove && isWhite)) return [];

  const pseudo = generatePseudoMovesForSquare(x, y);
  const legal = [];

  for (const m of pseudo) {
    if (
      typeof m.toX !== "number" || typeof m.toY !== "number" ||
      m.toX < 0 || m.toX > 7 || m.toY < 0 || m.toY > 7
    ) {
      continue;
    }

    const savedBoard = cloneBoard(board);
    const savedCastling = { ...castlingRights };
    const savedEP = enPassantTarget;
    const savedWTM = whiteToMove;

    applyMoveInternal(m, { skipHistory: true });

    const kingPos = findKing(savedWTM);

    if (
      !kingPos ||
      typeof kingPos.x !== "number" || typeof kingPos.y !== "number" ||
      kingPos.x < 0 || kingPos.x > 7 ||
      kingPos.y < 0 || kingPos.y > 7
    ) {
      board = savedBoard;
      castlingRights = savedCastling;
      enPassantTarget = savedEP;
      whiteToMove = savedWTM;
      continue;
    }

    const stillInCheck = squareAttacked(kingPos.x, kingPos.y, !savedWTM);

    if (!stillInCheck) {
      if (m.special === "castle") {
        const pathSquares = [];

        if (m.toX === 6) {
          // king-side (right)
          pathSquares.push({ x: 5, y: kingPos.y }, { x: 6, y: kingPos.y });
        } else if (m.toX === 2) {
          // queen-side (left)
          pathSquares.push({ x: 3, y: kingPos.y }, { x: 2, y: kingPos.y });
        }

        let illegal = false;

        for (const sq of pathSquares) {
          if (
            sq.x < 0 || sq.x > 7 ||
            sq.y < 0 || sq.y > 7 ||
            squareAttacked(sq.x, sq.y, !savedWTM)
          ) {
            illegal = true;
            break;
          }
        }

        if (!illegal) {
          if (savedWTM) {
            if (m.toX === 6 && savedCastling.WK) legal.push(m);
            else if (m.toX === 2 && savedCastling.WQ) legal.push(m);
          } else {
            if (m.toX === 6 && savedCastling.BK) legal.push(m);
            else if (m.toX === 2 && savedCastling.BQ) legal.push(m);
          }
        }

      } else {
        const playerIsMoving =
          (window.playerSide === "white" && savedWTM === true) ||
          (window.playerSide === "black" && savedWTM === false);

        if (playerIsMoving) {
          const isLegalResponse = window.moveTracker.isplayerMoveLegalResponse(m);
          if (!isLegalResponse) {
            board = savedBoard;
            castlingRights = savedCastling;
            enPassantTarget = savedEP;
            whiteToMove = savedWTM;
            continue;
          }
        }

        legal.push(m);
      }
    }

    board = savedBoard;
    castlingRights = savedCastling;
    enPassantTarget = savedEP;
    whiteToMove = savedWTM;
  }

  return legal;
}


/* === INTERNAL MOVE === */
function applyMoveInternal(move, options = {}) {
  const { fromX, fromY, toX, toY, special } = move;

  if (
    typeof fromX !== "number" || typeof fromY !== "number" ||
    typeof toX !== "number" || typeof toY !== "number" ||
    fromX < 0 || fromX > 7 || fromY < 0 || fromY > 7 ||
    toX < 0 || toX > 7 || toY < 0 || toY > 7 ||
    !board[fromY] || !board[toY]
  ) {
    return;
  }

  const piece = board[fromY][fromX];

  if (!piece) return;

  board[fromY][fromX] = "";
  board[toY][toX] = piece;

  if (special === "enpassant") {
    const epY = whiteToMove ? toY + 1 : toY - 1;

    if (epY >= 0 && epY <= 7 && board[epY]) {
      board[epY][toX] = "";
    }
  }

  if (special === "castle") {
    if (toX === 6) {
      const rookFromX = 7;
      const rookToX = 5;
      const rookY = fromY;
      if (board[rookY]) {
        board[rookY][rookFromX] = "";
        board[rookY][rookToX] = isWhitePiece(piece) ? "R" : "r";
      }
    } else if (toX === 2) {
      const rookFromX = 0;
      const rookToX = 3;
      const rookY = fromY;
      if (board[rookY]) {
        board[rookY][rookFromX] = "";
        board[rookY][rookToX] = isWhitePiece(piece) ? "R" : "r";
      }
    }
  }

  enPassantTarget = null;
  if (piece.toLowerCase() === "p" && Math.abs(toY - fromY) === 2) {
    const epRank = (fromY + toY) / 2;
    enPassantTarget = indexToCoord(fromX, epRank);
  }

  if (piece === "K") {
    castlingRights.WK = false;
    castlingRights.WQ = false;
  }
  if (piece === "k") {
    castlingRights.BK = false;
    castlingRights.BQ = false;
  }
  if (piece === "R") {
    if (fromY === 7 && fromX === 0) castlingRights.WQ = false;
    if (fromY === 7 && fromX === 7) castlingRights.WK = false;
  }
  if (piece === "r") {
    if (fromY === 0 && fromX === 0) castlingRights.BQ = false;
    if (fromY === 0 && fromX === 7) castlingRights.BK = false;
  }

  if (piece.toLowerCase() === "p" && (toY === 0 || toY === 7)) {
    let promoteTo = options.promoteTo || "q";
    board[toY][toX] = isWhitePiece(piece)
      ? promoteTo.toUpperCase()
      : promoteTo.toLowerCase();
  }
}

/* === PROMOTION OVERLAY === */
function openPromotionOverlay(isWhite) {
  promotionChoicesEl.innerHTML = "";

  const choices = ["q", "r", "b", "n"];
  choices.forEach(type => {
    const side = isWhite ? "white" : "black";
    const svgPath = `chess-data/pieces/${side}_${pieceName(type)}.svg`;

    const btn = document.createElement("img");
    btn.src = svgPath;
    btn.className = "promotion-choice-icon";
    btn.dataset.promoteTo = type;

    btn.onclick = () => {
      finalizePromotion(type);
    };

    promotionChoicesEl.appendChild(btn);
  });

  promotionOverlayEl.classList.remove("hidden");
}

function finalizePromotion(type) {
  const move = pendingPromotionMove;
  const isWhite = pendingPromotionIsWhite;

  pendingPromotionMove = null;
  pendingPromotionIsWhite = null;
  promotionOverlayEl.classList.add("hidden");

  applyMove(move, { promoteTo: type });
}

/* === APPLY MOVE === */
function applyMove(move, options = {}) {
  const { fromX, fromY, toX, toY, special } = move;

  // DETECT CASTLING
  const piece = board[fromY][fromX];
  const isCastle =
    piece && piece.toLowerCase() === "k" && Math.abs(toX - fromX) === 2;

  const legalMoves = generateLegalMovesForSquare(fromX, fromY);
  const isLegal = legalMoves.some(m =>
    m.toX === toX &&
    m.toY === toY &&
    (m.special === special || m.special === "castle")
  );
  if (!isLegal && !options.promoteTo) {
    playMoveSounds("illegal");
    return;
  }

  const target = board[toY][toX];

  // SNAPSHOT BEFORE MOVE
  const prevBoard = cloneBoard(board);
  const prevCastling = { ...castlingRights };
  const prevEP = enPassantTarget;
  const prevWTM = whiteToMove;

  let captured = target || null;

  // SAN FROM PREV BOARD
  const san = window.generateSAN(
    { ...move, promoteTo: options.promoteTo || null },
    prevBoard
  );

  // APPLY MOVE TO BOARD
  board[fromY][fromX] = "";
  board[toY][toX] = piece;

  // EN PASSANT
  if (special === "enpassant") {
    const epY = prevWTM ? toY + 1 : toY - 1;
    captured = board[epY][toX];
    board[epY][toX] = "";
  }

  // CASTLING ROOK MOVE (BOTH SIDES, BASED ONLY ON KING MOVE)
  if (isCastle) {
    if (toX > fromX) {
      board[fromY][7] = "";
      board[fromY][5] = isWhitePiece(piece) ? "R" : "r";
    } else {
      board[fromY][0] = "";
      board[fromY][3] = isWhitePiece(piece) ? "R" : "r";
    }
  }

  // EN PASSANT TARGET
  enPassantTarget = null;
  if (piece.toLowerCase() === "p" && Math.abs(toY - fromY) === 2) {
    const epRank = (fromY + toY) / 2;
    enPassantTarget = indexToCoord(fromX, epRank);
  }

  // CASTLING RIGHTS UPDATE
  if (piece === "K") castlingRights.WK = castlingRights.WQ = false;
  if (piece === "k") castlingRights.BK = castlingRights.BQ = false;

  if (piece === "R") {
    if (fromY === 7 && fromX === 0) castlingRights.WQ = false;
    if (fromY === 7 && fromX === 7) castlingRights.WK = false;
  }
  if (piece === "r") {
    if (fromY === 0 && fromX === 0) castlingRights.BQ = false;
    if (fromY === 0 && fromX === 7) castlingRights.BK = false;
  }

  // PROMOTION
  if (piece.toLowerCase() === "p" && (toY === 0 || toY === 7)) {
    if (!options.promoteTo) {
      pendingPromotionMove = move;
      pendingPromotionIsWhite = isWhitePiece(piece);

      board = prevBoard;
      castlingRights = prevCastling;
      enPassantTarget = prevEP;
      whiteToMove = prevWTM;

      openPromotionOverlay(pendingPromotionIsWhite);
      return;
    }

    const promoteTo = options.promoteTo;
    board[toY][toX] = isWhitePiece(piece)
      ? promoteTo.toUpperCase()
      : promoteTo.toLowerCase();
  }

  const sideWhite = prevWTM;
  const kingPos = findKing(sideWhite);
  const kingInCheck =
    !kingPos || squareAttacked(kingPos.x, kingPos.y, !sideWhite);

  if (kingInCheck) {
    board = prevBoard;
    castlingRights = prevCastling;
    enPassantTarget = prevEP;
    whiteToMove = prevWTM;

    playMoveSounds("illegal");
    renderBoard();
    return;
  }

  // REGISTER CAPTURE FOR UI
  if (captured) {
    window.registerCapture(piece, captured);
  }

  const inChkAfter = inCheck(!sideWhite);
  let resultType = captured ? "capture" : "normal";
  if (inChkAfter) resultType = "check";

  lastMoveInfo = {
    fromX,
    fromY,
    toX,
    toY,
    resultType,
    special,
    sideWhite
  };

  whiteToMove = !whiteToMove;

  logMove(move, piece, captured);
  playMoveSounds(resultType);

  renderBoard();

  const fen = window.boardToFEN();

  // HISTORY ENTRY
  window.moveHistory.push({
    prevBoard,
    prevCastling,
    prevEP,
    whiteToMoveBefore: prevWTM,
    move,
    captured,
    san,
    fen
  });

  window.renderMoveLog();
  window.currentHistoryIndex = null;
  window.highlightMoveInLog(null);
  window.rebuildCapturedUI();

  const ended = checkGameEnd();
  if (ended) return;

  sendFenToEngine();
  requestAiMoveIfNeeded();
}


/* === LOGGING === */
function logMove(move, piece, captured) {
  const li = document.createElement("li");
  const from = indexToCoord(move.fromX, move.fromY);
  const to = indexToCoord(move.toX, move.toY);
  let text = piece.toUpperCase() + " " + from + "→" + to;
  if (captured) text += " x" + pieceName(captured.toLowerCase());
  if (move.special === "castle") text += " (castle)";
  if (move.special === "enpassant") text += " (ep)";
  li.textContent = text;
  moveLogEl.appendChild(li);
  moveLogEl.scrollTop = moveLogEl.scrollHeight;
}

/* === GAME END === */
function checkGameEnd() {
  const sideWhite = whiteToMove;
  const inChk = inCheck(sideWhite);

  let hasMove = false;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const p = board[y][x];
      if (!p) continue;
      if (sideWhite && !isWhitePiece(p)) continue;
      if (!sideWhite && !isBlackPiece(p)) continue;

      const moves = generateLegalMovesForSquare(x, y);
      if (moves.length > 0) {
        hasMove = true;
        break;
      }
    }
    if (hasMove) break;
  }

  if (!hasMove) {
    if (inChk) {
      const winner = sideWhite ? "Black" : "White";
      winTextEl.textContent = winner + " Wins";
      if (lastMoveInfo) lastMoveInfo.resultType = "checkmate";
      playCheckmateSound();
    } else {
      winTextEl.textContent = "Draw (stalemate)";
    }

    winOverlayEl.classList.remove("hidden");
    return true;
  }

  return false;
}

/* === EXPORT GLOBALS === */
window.squareAttacked = squareAttacked;
window.generatePseudoMovesForSquare = generatePseudoMovesForSquare;
window.generateLegalMovesForSquare = generateLegalMovesForSquare;
window.applyMove = applyMove;
window.checkGameEnd = checkGameEnd;
window.inCheck = inCheck;
window.findKing = findKing;
window.openPromotionOverlay = openPromotionOverlay;

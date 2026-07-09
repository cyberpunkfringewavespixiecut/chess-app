/* === chess.ai.movement.js — AI + player movement tracker === */

(function () {

  /* STORAGE */
  const aiMoves = [];
  const playerMoves = [];

  /* EXPORT TRACKER */
  window.moveTracker = {
    aiMoves,
    playerMoves,

    lastAiMove: () => aiMoves[aiMoves.length - 1] || null,
    lastplayerMove: () => playerMoves[playerMoves.length - 1] || null,

    clear: () => {
      aiMoves.length = 0;
      playerMoves.length = 0;
    },

    /* player MOVE LEGALITY CHECK BASED ON AI MOVE */
    isplayerMoveLegalResponse(playerMove) {
      const lastAi = aiMoves[aiMoves.length - 1];
      if (!lastAi) return true; // no AI move yet → always legal

      // BASIC RULE YOU REQUESTED:
      // player move must NOT repeat AI's last move coordinates
      if (
        playerMove.fromX === lastAi.fromX &&
        playerMove.fromY === lastAi.fromY &&
        playerMove.toX === lastAi.toX &&
        playerMove.toY === lastAi.toY
      ) {
        return false;
      }

      // You can add more rules here later
      return true;
    }
  };

  /* === WRAP applyMove TO TRACK AI + player === */
  const originalApplyMove = window.applyMove;

  window.applyMove = function (move, options = {}) {
    const prevWTM = window.whiteToMove;
    const playerSide = window.playerSide;

    // call original
    originalApplyMove(move, options);

    const sideWhite = prevWTM;

    const aiMoved =
      (playerSide === "white" && !sideWhite) ||
      (playerSide === "black" && sideWhite);

    const playerMoved =
      (playerSide === "white" && sideWhite) ||
      (playerSide === "black" && !sideWhite);

    if (aiMoved) {
      window.moveTracker.aiMoves.push(move);
    }

    if (playerMoved) {
      window.moveTracker.playerMoves.push(move);
    }
  };

})();
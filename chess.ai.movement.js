/* === chess.ai.movement.js — AI + Human movement tracker === */

(function () {

  /* STORAGE */
  const aiMoves = [];
  const humanMoves = [];

  /* EXPORT TRACKER */
  window.moveTracker = {
    aiMoves,
    humanMoves,

    lastAiMove: () => aiMoves[aiMoves.length - 1] || null,
    lastHumanMove: () => humanMoves[humanMoves.length - 1] || null,

    clear: () => {
      aiMoves.length = 0;
      humanMoves.length = 0;
    },

    /* HUMAN MOVE LEGALITY CHECK BASED ON AI MOVE */
    isHumanMoveLegalResponse(humanMove) {
      const lastAi = aiMoves[aiMoves.length - 1];
      if (!lastAi) return true; // no AI move yet → always legal

      // BASIC RULE YOU REQUESTED:
      // Human move must NOT repeat AI's last move coordinates
      if (
        humanMove.fromX === lastAi.fromX &&
        humanMove.fromY === lastAi.fromY &&
        humanMove.toX === lastAi.toX &&
        humanMove.toY === lastAi.toY
      ) {
        return false;
      }

      // You can add more rules here later
      return true;
    }
  };

  /* === WRAP applyMove TO TRACK AI + HUMAN === */
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

    const humanMoved =
      (playerSide === "white" && sideWhite) ||
      (playerSide === "black" && !sideWhite);

    if (aiMoved) {
      window.moveTracker.aiMoves.push(move);
    }

    if (humanMoved) {
      window.moveTracker.humanMoves.push(move);
    }
  };

})();
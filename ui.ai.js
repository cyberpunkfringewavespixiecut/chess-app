/* ui.ai.js — AI sidebar, fresh board on level select, win overlay close */

window.playerSide = "none";
window.aiLevel = null;

/* Hard-coded starting position (standard chess) */
function setStartingBoard() {
  window.board = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ];
}

/* Flip board based on human side */
function updateBoardOrientation() {
  window.flipBoard = window.playerSide === "black";
  renderBoard();
}

/* Full reset for AI game */
function resetBoardForAiGame() {
  setStartingBoard();

  window.whiteToMove = true;
  window.selectedSquare = null;
  window.legalMovesCache = [];
  window.lastMoveInfo = null;
  window.previewSquare = null;
  window.previewMoves = [];
  if (window.moveHistory) window.moveHistory.length = 0;

  const moveLog = document.getElementById("move-log");
  const capturedPlayer = document.getElementById("captured-player");
  const capturedAi = document.getElementById("captured-ai");

  if (moveLog) moveLog.innerHTML = "";
  if (capturedPlayer) capturedPlayer.innerHTML = "";
  if (capturedAi) capturedAi.innerHTML = "";

  renderBoard();
  if (typeof sendFenToEngine === "function") {
    sendFenToEngine();
  }
}

function wireWinOverlayClose() {
  const overlay = document.getElementById("win-overlay");
  const closeBtn = document.getElementById("close-overlay");
  if (overlay && closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.classList.add("hidden");
    });
  }
}


window.addEventListener("load", () => {
  const aiBtn = document.getElementById("ai-btn");
  const aiSidebar = document.getElementById("ai-sidebar");
  const closeAiSidebar = document.getElementById("close-ai-sidebar");
  const aiSideWhite = document.getElementById("ai-side-white");
  const aiSideBlack = document.getElementById("ai-side-black");
  const levelButtons = document.querySelectorAll(".ai-level-btn");

  wireWinOverlayClose();

  aiBtn.addEventListener("click", () => {
    aiSidebar.classList.remove("hidden");
    aiSideWhite.checked = true;
    aiSideBlack.checked = false;
  });

  closeAiSidebar.addEventListener("click", () => {
    aiSidebar.classList.add("hidden");
  });

  levelButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      window.aiLevel = btn.dataset.level;
      window.playerSide = aiSideBlack.checked ? "black" : "white";

      updateBoardOrientation();
      resetBoardForAiGame();

      aiSidebar.classList.add("hidden");

      if (typeof requestAiMoveIfNeeded === "function") {
        requestAiMoveIfNeeded();
      }
    });
  });
});

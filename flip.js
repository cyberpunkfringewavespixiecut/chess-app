/* flip.js — board orientation */

const flipBoardBtn = document.getElementById("flip-board-btn");

flipBoardBtn.addEventListener("click", () => {
  flipBoard = !flipBoard;
  renderBoard();
});

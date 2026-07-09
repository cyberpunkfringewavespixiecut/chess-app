/* capture.js — captured pieces UI: White captured, Black captured */

const capturedPlayerEl = document.getElementById("captured-player"); // label: White captured
const capturedAiEl = document.getElementById("captured-ai");         // label: Black captured

/* Uses global helpers from chess.logic.js: isWhitePiece, pieceName */

/* Add a captured piece to UI */
function addCapturedPieceToUI(capturedPiece) {
  if (!capturedPiece) return;

  const isWhiteCap = isWhitePiece(capturedPiece);
  const typeCap = capturedPiece.toLowerCase();
  const sideCap = isWhiteCap ? "white" : "black";
  const svgPathCap = `chess-data/pieces/${sideCap}_${pieceName(typeCap)}.svg`;

  const imgCap = document.createElement("img");
  imgCap.className = "captured-piece-img";
  imgCap.src = svgPathCap;
  imgCap.onerror = () => {
    imgCap.style.opacity = "0.6";
  };

  // Grammar requirement:
  // "White captured" → show BLACK pieces eaten by white
  // "Black captured" → show WHITE pieces eaten by black
  const targetEl = isWhiteCap ? capturedAiEl : capturedPlayerEl;
  targetEl.appendChild(imgCap);
}

/* Rebuild captured UI from moveHistory (used by undo.redo.js) */
function rebuildCapturedUI() {
  if (!capturedPlayerEl || !capturedAiEl) return;

  capturedPlayerEl.innerHTML = "";
  capturedAiEl.innerHTML = "";

  moveHistory.forEach(entry => {
    const captured = entry.captured;
    if (!captured) return;
    addCapturedPieceToUI(captured);
  });
}

/* Expose helpers */
window.addCapturedPieceToUI = addCapturedPieceToUI;
window.rebuildCapturedUI = rebuildCapturedUI;

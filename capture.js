/* capture.js — captured pieces UI */

const capturedPlayerEl = document.getElementById("captured-player"); // Black panel
const capturedAiEl = document.getElementById("captured-ai");         // White panel

// Map letter → your actual filenames
const pieceMap = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king"
};

/* Add a captured piece ICON to UI */
function addCapturedPieceToUI(capturedPiece) {
  if (!capturedPiece) return;

  const isWhite = capturedPiece === capturedPiece.toUpperCase();
  const type = capturedPiece.toLowerCase(); // p, r, n, b, q, k

  const fullName = pieceMap[type];
  if (!fullName) return;

  // EXACT MATCH TO YOUR REAL FILES:
  // white_pawn.svg, black_bishop.svg, etc.
  const iconPath = `chess-data/pieces/${isWhite ? "white" : "black"}_${fullName}.svg`;

  const img = document.createElement("img");
  img.className = "captured-piece-img";
  img.src = iconPath;
  img.width = 32;
  img.height = 32;

  img.onerror = () => {
    console.log("Missing icon:", iconPath);
    img.style.display = "none";
  };

  const targetEl = isWhite ? capturedPlayerEl : capturedAiEl;
  targetEl.appendChild(img);
}

/* Rebuild captured UI from moveHistory */
function rebuildCapturedUI() {
  if (!capturedPlayerEl || !capturedAiEl) return;
  if (!window.moveHistory) return;

  capturedPlayerEl.innerHTML = "";
  capturedAiEl.innerHTML = "";

  window.moveHistory.forEach(entry => {
    const captured = entry.captured; // letter
    if (!captured) return;
    addCapturedPieceToUI(captured);
  });
}

window.addCapturedPieceToUI = addCapturedPieceToUI;
window.rebuildCapturedUI = rebuildCapturedUI;

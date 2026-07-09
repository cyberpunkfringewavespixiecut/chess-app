/* ui.theme.js — theme loading, board colors, tint, depth */

window.boardEl = document.getElementById("board");
window.flipBoard = false;

/* BOARD COLORS */
window.boardColors = {
  light: "#1b1f2b",
  dark: "#05070c",
};

/* VISUAL FLAGS */
window.glowEnabled = true;
window.tintEnabled = true;

/* Depth */
window.depthEnabled = false;
window.depthIntensity = 0.5;
window.depthWhiteColor = "#d09090";
window.depthBlackColor = "#000000";

/* === SYNC UI CONTROLS TO CURRENT THEME === */
function renderTheme() {
  // Tint
  document.getElementById("tint-toggle").checked = window.tintEnabled;

  // Board colors
  document.getElementById("board-light-color").value = window.boardColors.light;
  document.getElementById("board-dark-color").value = window.boardColors.dark;

  // Depth
  document.getElementById("depth-enable").checked = window.depthEnabled;
  document.getElementById("depth-slider").value = String(window.depthIntensity);
  document.getElementById("depth-white-color").value = window.depthWhiteColor;
  document.getElementById("depth-black-color").value = window.depthBlackColor;
}

/* === LOAD DEFAULT THEME === */
async function loadDefaultTheme() {
  try {
    const res = await fetch("chess-data/chess.json");
    const theme = await res.json();

    if (theme.boardColors) {
      window.boardColors.light = theme.boardColors.light;
      window.boardColors.dark = theme.boardColors.dark;
    }
    if (typeof theme.tintEnabled === "boolean") {
      window.tintEnabled = theme.tintEnabled;
    }
    if (typeof theme.depthEnabled === "boolean") {
      window.depthEnabled = theme.depthEnabled;
    }
    if (typeof theme.depthIntensity === "number") {
      window.depthIntensity = theme.depthIntensity;
    }
    if (theme.depthWhiteColor) {
      window.depthWhiteColor = theme.depthWhiteColor;
    }
    if (theme.depthBlackColor) {
      window.depthBlackColor = theme.depthBlackColor;
    }

    renderBoard();
    renderTheme();
  } catch (err) {
    console.error("Default theme load failed:", err);
    renderBoard();
    renderTheme();
  }
}

/* === SAVE THEME (DOWNLOAD) === */
const downloadThemeBtn = document.getElementById("download-theme");

downloadThemeBtn.addEventListener("click", () => {
  const themeData = {
    boardColors: {
      light: window.boardColors.light,
      dark: window.boardColors.dark
    },
    tintEnabled: window.tintEnabled,
    depthEnabled: window.depthEnabled,
    depthIntensity: window.depthIntensity,
    depthWhiteColor: window.depthWhiteColor,
    depthBlackColor: window.depthBlackColor
  };

  const jsonString = JSON.stringify(themeData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "chess.json";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

/* === LOAD THEME LIST === */
async function loadThemeList() {
  const listbox = document.getElementById("theme-listbox");
  listbox.innerHTML = "";

  try {
    const res = await fetch("chess-data/chess.theme.json");
    const list = await res.json();

    if (Array.isArray(list) && list.length > 0) {
      list.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;

        const displayName = name.replace(/\.json$/i, "");
        opt.textContent = displayName;

        listbox.appendChild(opt);
      });

    } else {
      const opt = document.createElement("option");
      opt.value = "default";
      opt.textContent = "Default Theme";
      listbox.appendChild(opt);
    }
  } catch (err) {
    console.error("Theme list load failed:", err);
    const opt = document.createElement("option");
    opt.value = "default";
    opt.textContent = "Default Theme";
    listbox.appendChild(opt);
  }
}

/* === APPLY SELECTED THEME === */
async function applySelectedTheme(name) {
  if (name === "default") {
    await loadDefaultTheme();
    return;
  }

  try {
    const res = await fetch("chess-data/themes/" + name);
    const theme = await res.json();

    if (theme.boardColors) {
      window.boardColors.light = theme.boardColors.light;
      window.boardColors.dark = theme.boardColors.dark;
    }
    if (typeof theme.tintEnabled === "boolean") {
      window.tintEnabled = theme.tintEnabled;
    }
    if (typeof theme.depthEnabled === "boolean") {
      window.depthEnabled = theme.depthEnabled;
    }
    if (typeof theme.depthIntensity === "number") {
      window.depthIntensity = theme.depthIntensity;
    }
    if (theme.depthWhiteColor) {
      window.depthWhiteColor = theme.depthWhiteColor;
    }
    if (theme.depthBlackColor) {
      window.depthBlackColor = theme.depthBlackColor;
    }

    renderBoard();
    renderTheme();
  } catch (err) {
    console.error("Theme apply failed:", err);
  }
}

/* === UI WIRING === */
window.addEventListener("load", () => {

  /* SIDEBAR ELEMENTS */
  const themeBtn = document.getElementById("theme-btn");
  const themeSidebar = document.getElementById("theme-sidebar");
  const closeThemeSidebar = document.getElementById("close-theme-sidebar");

  const tintToggle = document.getElementById("tint-toggle");
  const boardLightColor = document.getElementById("board-light-color");
  const boardDarkColor = document.getElementById("board-dark-color");

  const depthEnable = document.getElementById("depth-enable");
  const depthSlider = document.getElementById("depth-slider");
  const depthWhiteColorInput = document.getElementById("depth-white-color");
  const depthBlackColorInput = document.getElementById("depth-black-color");

  /* FLOATING LOAD THEME PANEL */
  const openLoadTheme = document.getElementById("open-load-theme");
  const loadThemePanel = document.getElementById("load-theme-panel");
  const applyThemeBtn = document.getElementById("apply-theme-btn");
  const closeLoadThemeBtn = document.getElementById("close-load-theme-btn");
  const themeListbox = document.getElementById("theme-listbox");

  /* First page load */
  loadDefaultTheme();

  loadThemeList();

  /* Sidebar open/close */
  themeBtn.addEventListener("click", () => {
    themeSidebar.classList.remove("hidden");
  });

  closeThemeSidebar.addEventListener("click", () => {
    themeSidebar.classList.add("hidden");
  });

  /* Tint toggle */
  tintToggle.addEventListener("change", () => {
    window.tintEnabled = tintToggle.checked;
    renderBoard();
  });

  /* Board colors */
  boardLightColor.addEventListener("input", () => {
    window.boardColors.light = boardLightColor.value;
    renderBoard();
  });

  boardDarkColor.addEventListener("input", () => {
    window.boardColors.dark = boardDarkColor.value;
    renderBoard();
  });

  /* Depth enable */
  depthEnable.addEventListener("change", () => {
    window.depthEnabled = depthEnable.checked;
    renderBoard();
  });

  /* Depth intensity */
  depthSlider.addEventListener("input", () => {
    window.depthIntensity = parseFloat(depthSlider.value);
    renderBoard();
  });

  /* Depth colors */
  depthWhiteColorInput.addEventListener("input", () => {
    window.depthWhiteColor = depthWhiteColorInput.value;
    renderBoard();
  });

  depthBlackColorInput.addEventListener("input", () => {
    window.depthBlackColor = depthBlackColorInput.value;
    renderBoard();
  });

  /* === FLOATING LOAD THEME PANEL === */

  openLoadTheme.addEventListener("click", () => {
    loadThemePanel.classList.remove("hidden");
    loadThemePanel.classList.add("visible");
    loadThemeList();
  });

  applyThemeBtn.addEventListener("click", () => {
    const name = themeListbox.value;
    if (!name) return;

    applySelectedTheme(name);

    loadThemePanel.classList.remove("visible");
    loadThemePanel.classList.add("hidden");
  });

  closeLoadThemeBtn.addEventListener("click", () => {
    loadThemePanel.classList.remove("visible");
    loadThemePanel.classList.add("hidden");
  });

});

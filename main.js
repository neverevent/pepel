// main.js — общий кадр, хроника наверху, запуск игры

let logSig = null;

function renderLog() {
  const sig = state.log.length + ":" + state.log[0].day + ":" + state.log[0].text;
  if (sig === logSig) return;
  logSig = sig;
  const strip = $("#log-strip");
  strip.innerHTML = "";
  state.log.slice(0, 6).forEach((entry, i) => {
    const p = el("p", i > 0 ? "old" : null, `${T("ui.day") || "День"} ${entry.day} — ${entry.text}`);
    strip.appendChild(p);
  });
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const v = T(node.dataset.i18n);
    if (v) node.textContent = v;
  });
  const rb = $("#reset-btn");
  if (rb && !rb.dataset.armed) rb.textContent = T("ui.reset") || "Сброс";
  const eb = $("#export-btn");
  if (eb) eb.textContent = T("ui.export") || "Экспорт";
  const ib = $("#import-btn");
  if (ib) ib.textContent = T("ui.import") || "Импорт";
}

function resetSigs() {
  mapDrawnSeed = null;
  mapDraftSig = null;
  resSig = jobsSig = craftSig = buildSig = researchSig = marketSig = builtSig = logSig = moraleSig = cultureSig = null;
}

function importSaveFile() {
  const inp = $("#import-file");
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    inp.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const st = data && data.state ? data.state : data;
        if (!st || !st.res || typeof st.day !== "number") throw new Error("bad save");
        try { localStorage.setItem(CONFIG.saveKey, JSON.stringify(st)); } catch (e) { }
        state = null;
        load();
        resetSigs();
        logLine(T("msg.imported"));
      } catch (e) {
        logLine(T("msg.import_fail"));
      }
    };
    reader.readAsText(f);
  };
  inp.click();
}

function isGameOver() {
  return state.pop <= 0 && !state.expedition;
}

let goShown = false;

function renderGameOver() {
  const box = $("#gameover");
  if (!box) return;
  if (isGameOver()) {
    $("#gameover-text").textContent = T("msg.gameover") || "Деревня опустела. Игра окончена.";
    $("#go-restart-btn").textContent = T("ui.reset") || "Сброс";
    $("#go-import-btn").textContent = T("ui.import") || "Импорт";
    box.style.display = "flex";
    goShown = true;
  } else if (goShown) {
    box.style.display = "none";
    goShown = false;
  }
}
function render() {
  $("#day-label").textContent = `${T("ui.day") || "День"} ${state.day} · ${(T("seasons." + seasonIndex()) || season().name)}`;
  $("#population-label").textContent = `${T("ui.residents") || "Жители"}: ${state.pop}/${popCap()} · v${VERSION}`;
  $("#speed-btn").textContent = state.speed === 2 ? T("ui.speed_fast") || "x2" : T("ui.speed") || "x1";
  const pb = $("#pause-btn");
  if (pb) pb.textContent = state.paused ? (T("ui.resume") || "Продолжить") : (T("ui.pause") || "Пауза");
  $("#fire-status").textContent = state.res.food <= 0
    ? T("msg.fire_cold") || "Огонь слаб. Люди голодают."
    : T("msg.fire_ok") || "Огонь горит ровно. Деревня жива.";

  renderResources();
  renderMorale();
  renderJobs();
  renderCrafts();
  renderMarket();
  renderBuildings();
  renderCulture();
  renderBuilt();
  renderResearch();
  renderMap();
  renderLog();
  applyI18n();
  renderGameOver();

  const researchBtn = document.querySelector('[data-tab="research"]');
  if (researchBtn) researchBtn.style.display = researchTabOpen() ? "" : "none";
  const mapBtn = document.querySelector('[data-tab="map"]');
  if (mapBtn) {
    const open = researched("c_wheel");
    mapBtn.style.display = open ? "" : "none";
    if (!open && document.querySelector(".panel.active") === $("#panel-map")) tabTo("village");
  }
}

function showError(e) {
  let box = document.getElementById("error-box");
  if (!box) {
    box = document.createElement("pre");
    box.id = "error-box";
    box.style.cssText = "color:#e08a4a;white-space:pre-wrap;margin-top:12px;";
    document.getElementById("app").appendChild(box);
  }
  box.textContent = "Ошибка: " + (e && e.stack ? e.stack : String(e));
}
window.addEventListener("error", ev => showError(ev.error || ev.message));

load();

document.querySelectorAll(".tab").forEach(t =>
  t.addEventListener("click", () => tabTo(t.dataset.tab))
);

$("#speed-btn").addEventListener("click", () => {
  state.speed = state.speed === 2 ? 1 : 2;
});

$("#pause-btn").addEventListener("click", () => {
  state.paused = !state.paused;
});

$("#export-btn").addEventListener("click", () => {
  const data = JSON.stringify({ game: "pepel", version: VERSION, savedAt: new Date().toISOString(), state }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pepel-save-day${state.day}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  logLine(T("msg.exported"));
});

$("#import-btn").addEventListener("click", importSaveFile);
$("#go-import-btn").addEventListener("click", importSaveFile);

const goRestartBtn = $("#go-restart-btn");
goRestartBtn.addEventListener("click", () => {
  try { localStorage.removeItem(CONFIG.saveKey); } catch (e) { }
  state = initialState();
  resetSigs();
  logLine(T("msg.reset"));
});

const resetBtn = $("#reset-btn");
resetBtn.addEventListener("click", () => {
  if (!resetBtn.dataset.armed) {
    resetBtn.dataset.armed = "1";
    resetBtn.textContent = T("ui.reset_confirm") || "Точно?";
    setTimeout(() => { delete resetBtn.dataset.armed; resetBtn.textContent = T("ui.reset") || "Сброс"; }, 3000);
    return;
  }
  try { localStorage.removeItem(CONFIG.saveKey); } catch (e) { }
  state = initialState();
  resetSigs();
  resetBtn.dataset.armed = "";
  resetBtn.textContent = T("ui.reset") || "Сброс";
  logLine(T("msg.reset"));
});

let last = performance.now();
function loop(now) {
  try {
    const dt = Math.min(0.25, (now - last) / 1000) * (state.paused ? 0 : (state.speed || 1));
    last = now;
    if (!isGameOver()) tick(dt);
    render();
  } catch (e) {
    showError(e);
  }
  requestAnimationFrame(loop);
}

window.__gameLoaded = true;
window.GAME_LANG = localStorage.getItem("pepel-lang") || "ru";

const langBtn = $("#lang-btn");
langBtn.addEventListener("click", () => {
  window.GAME_LANG = window.GAME_LANG === "en" ? "ru" : "en";
  langBtn.textContent = window.GAME_LANG.toUpperCase();
  logSig = null; resSig = null; jobsSig = null; craftSig = null; buildSig = null;
  researchSig = null; marketSig = null; builtSig = null; moraleSig = null; cultureSig = null; mapDraftSig = null;
  mapDrawnSeed = null;
  localStorage.setItem("pepel-lang", window.GAME_LANG);
  logLine(TF("msg.lang_switched", { n: window.GAME_LANG.toUpperCase() }));
});
langBtn.textContent = (window.GAME_LANG || "ru").toUpperCase();
const vb = $("#ver-badge"); if (vb) vb.textContent = "v" + VERSION;
requestAnimationFrame(loop);

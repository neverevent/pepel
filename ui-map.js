// ui-map.js — карта: плиточные биомы, руины, экспедиции (WASD)

let mapDrawnSeed = null;
let mapDraftSig = null;
let mapActionsBuilt = false;

function drawMap() {
  if (mapDrawnSeed === state.mapSeed) return;
  mapDrawnSeed = state.mapSeed;
  const canvas = $("#map-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const seed = state.mapSeed;

  const T = 20;
  const TS = W / T;
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const G = 10;
  const grid = [];
  const grid2 = [];
  for (let y = 0; y <= G; y++) {
    grid.push([]); grid2.push([]);
    for (let x = 0; x <= G; x++) { grid[y].push(rand()); grid2[y].push(rand()); }
  }
  const smooth = t => t * t * (3 - 2 * t);
  function noise(g, nx, ny) {
    const gx = Math.min(G - 0.001, nx * G), gy = Math.min(G - 0.001, ny * G);
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = smooth(gx - x0), fy = smooth(gy - y0);
    const v00 = g[y0][x0], v10 = g[y0][Math.min(G, x0 + 1)];
    const v01 = g[Math.min(G, y0 + 1)][x0], v11 = g[Math.min(G, y0 + 1)][Math.min(G, x0 + 1)];
    return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
  }
  function centerDist(nx, ny) {
    return Math.hypot(nx - 0.5, ny - 0.5);
  }
  for (let ty = 0; ty < T; ty++) {
    for (let tx = 0; tx < T; tx++) {
      const nx = (tx + 0.5) / T, ny = (ty + 0.5) / T;
      const h = 0.65 * noise(grid, nx, ny) + 0.35 * noise(grid, (nx * 2) % 1, (ny * 2) % 1);
      const moist = noise(grid2, nx, ny);
      const cd = centerDist(nx, ny);
      let col;
      if (h < 0.30) col = "#284a70";
      else if (h < 0.36) col = "#7a6e46";
      else if (h < 0.55) {
        if (moist > 0.55) col = "#28502d";
        else col = "#507037";
      } else if (h < 0.70) col = "#64603c";
      else col = "#828079";
      if (cd < 0.06) col = "#f2b06a";
      ctx.fillStyle = col;
      ctx.fillRect(tx * TS, ty * TS, Math.ceil(TS), Math.ceil(TS));
    }
  }
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  for (let i = 1; i < T; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TS, 0); ctx.lineTo(i * TS, H);
    ctx.moveTo(0, i * TS); ctx.lineTo(W, i * TS);
    ctx.stroke();
  }
  ctx.font = "bold 13px monospace";
  ctx.fillStyle = "#000";
  ctx.fillText(TF("msg.settlement") || "Поселение", W / 2 + 12, H / 2 + 4);

  state.ruins = state.ruins || [];
  if (!state.ruins.length) {
    const count = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const rx = 0.15 + rand() * 0.7, ry = 0.15 + rand() * 0.7;
      if (Math.hypot(rx - 0.5, ry - 0.5) < 0.12) continue;
      state.ruins.push({ x: rx, y: ry });
    }
  }
  $("#map-info").textContent =
    TF("msg.map_info", { seed: seed, n: state.ruins.length });
}

function drawMapMarkers() {
  const canvas = $("#map-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const T = 20, TS = W / T;
  for (const ru of state.ruins || []) {
    const px = Math.floor(ru.x * T) * TS + TS / 2;
    const py = Math.floor(ru.y * T) * TS + TS / 2;
    ctx.fillStyle = "#1c1712";
    ctx.fillRect(px - TS * 0.4, py - TS * 0.4, TS * 0.8, TS * 0.8);
    ctx.fillStyle = "#e8dfd0";
    ctx.font = "bold 12px monospace";
    ctx.fillText(TF("msg.lvl", { n: ruinLevel(ru) }) || `ур.${ruinLevel(ru)}`, px - 14, py - TS * 0.5 - 3);
  }
  if (state.expedition) {
    const e = state.expedition;
    ctx.fillStyle = "#f2b06a";
    ctx.beginPath();
    ctx.arc(e.x * TS + TS / 2, e.y * TS + TS / 2, TS * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 12px monospace";
    ctx.fillText(window.GAME_LANG === "en" ? "squad" : "отряд", e.x * TS + TS * 0.35, e.y * TS - 2);
  }
}

function weightOf(d) {
  let w = 0;
  for (const k in d.gear) w += d.gear[k];
  return w;
}

function squadStats(people, gear) {
  let attack = people, defence = people * 0.5;
  for (const k in GEAR) {
    const n = gear[k] || 0;
    attack += (GEAR[k].attack || 0) * n;
    defence += (GEAR[k].defence || 0) * n;
  }
  if ((state.artifacts || {}).crown) attack *= 1.25;
  return { strength: Math.round(attack * 10) / 10, defence: Math.round(defence * 10) / 10 };
}

function ruinLevel(ru) {
  const T = 20;
  const dist = Math.hypot(ru.x - 9.5, ru.y - 9.5) / T;
  return 1 + Math.floor(dist * 12);
}

function passChance(strength, level) {
  const power = level * CONFIG.ruinPowerPerLevel;
  return strength / (strength + power);
}

function renderExpedition() {
  const holder = $("#map-actions");
  const d = state.draft;
  const e = state.expedition;
  const sig = JSON.stringify([d, e ? { x: e.x, y: e.y, people: e.people, gear: e.gear, food: Math.round(e.food) } : null, state.selectedRuin]);
  if (sig === mapDraftSig) return;
  mapDraftSig = sig;
  holder.innerHTML = "";

  if (e) {
    holder.appendChild(el("p", null, TF("msg.exp_active", { n: e.people, food: Math.round(e.food) })));
    holder.appendChild(mkBtn(T("ui.back") || "Отозвать отряд", () => {
      returnExpedition(false, T("msg.exp_recall"));
    }));
    return;
  }

  if (!d) {
    const b = mkBtn(T("ui.expedition") || "Отправить экспедицию", () => {
      if (freeVillagers() <= 0) { logLine(T("msg.no_free_exp")); return; }
      state.draft = { people: 1, gear: { bow: 0, sword: 0, musket: 0, armor: 0, medkit: 0 }, food: 0 };
    });
    holder.appendChild(b);
    return;
  }

  const peopleRow = el("div", "row");
  peopleRow.appendChild(el("span", null, TF("exp.people", { n: d.people, free: freeVillagers() })));
  peopleRow.appendChild(mkBtn("−", () => { if (d.people > 0) d.people--; }));
  peopleRow.appendChild(mkBtn("+", () => { if (d.people < freeVillagers()) d.people++; }));
  holder.appendChild(peopleRow);

  for (const gid in GEAR) {
    const row = el("div", "row");
    const stat = GEAR[gid].attack ? TF("exp.attack", { n: GEAR[gid].attack }) : (GEAR[gid].defence ? TF("exp.defence", { n: GEAR[gid].defence }) : TF("exp.heal", { n: GEAR[gid].heal || 1 }));
    row.appendChild(el("span", null, `${T("gear." + gid) || GEAR[gid].name}: ${d.gear[gid]} (${stat})`));
    row.appendChild(mkBtn("−", () => {
      if (d.gear[gid] > 0) { d.gear[gid]--; state.res[gid]++; }
    }));
    row.appendChild(mkBtn("+", () => {
      if ((state.res[gid] || 0) > 0) { state.res[gid]--; d.gear[gid]++; }
    }));
    holder.appendChild(row);
  }

  const foodRow = el("div", "row");
  foodRow.appendChild(el("span", null, TF("exp.food", { n: d.food })));
  foodRow.appendChild(mkBtn("−10", () => { const t = Math.min(10, d.food); d.food -= t; state.res.food += t; }));
  foodRow.appendChild(mkBtn("+10", () => {
    const t = Math.min(10, state.res.food);
    state.res.food -= t; d.food += t;
  }));
  holder.appendChild(foodRow);

  const st = squadStats(d.people, d.gear);
  holder.appendChild(el("p", "cost",
    TF("exp.stats", { str: st.strength, def: st.defence, w: weightOf(d), food: Math.round((d.people * CONFIG.expeditionFoodPerPerson + weightOf(d) * CONFIG.expeditionFoodPerWeight) * 10) / 10 })));

  for (const ru of state.ruins || []) {
    const lvl = ruinLevel(ru);
    const ch = Math.round(passChance(st.strength, lvl) * 100);
    holder.appendChild(el("p", "cost",
      TF("msg.ruin_list", { x: ru.x, y: ru.y, lvl: lvl, ch: ch })));
  }

  const go = mkBtn(T("ui.march") || "Выступить", () => {
    if (d.people <= 0) return;
    state.pop -= d.people;
    state.expedition = {
      x: 9, y: 10, people: d.people,
      gear: { ...d.gear }, food: d.food,
    };
    state.draft = null;
    logLine(TF("msg.exp_out", { n: state.expedition.people }));
  });
  go.disabled = d.people <= 0;
  holder.appendChild(go);
}

function moveExpedition(dx, dy) {
  const e = state.expedition;
  if (!e) return;
  const T = 20;
  const nx = e.x + dx, ny = e.y + dy;
  if (nx < 0 || ny < 0 || nx >= T || ny >= T) return;
  const cost = e.people * CONFIG.expeditionFoodPerPerson + weightOf(e) * CONFIG.expeditionFoodPerWeight;
  e.x = nx; e.y = ny;
  if (e.food < cost) {
    if (e.people > 1) {
      e.people--;
      logLine(T("msg.exp_hunger"));
    } else {
      logLine(T("msg.exp_dead"));
      state.expedition = null;
      mapDraftSig = null;
      return;
    }
  } else {
    e.food -= cost;
  }
  const idx = (state.ruins || []).findIndex(ru => Math.floor(ru.x * T) === nx && Math.floor(ru.y * T) === ny);
  if (idx >= 0) resolveExpedition(state.ruins[idx]);
}

function returnExpedition(success, note) {
  const e = state.expedition;
  if (!e) return;
  for (const k in e.gear) state.res[k] += e.gear[k];
  clampRes();
  state.pop = Math.min(popCap(), state.pop + e.people);
  state.expedition = null;
  mapDraftSig = null;
  logLine(note || TF("msg.exp_back", { n: e.people }));
}

function resolveExpedition(ru) {
  const e = state.expedition;
  if (!e) return;
  const lvl = ruinLevel(ru);
  const st = squadStats(e.people, e.gear);
  const chance = passChance(st.strength, lvl);
  const won = Math.random() < chance;
  let rawLoss = e.people * (1 - chance) * 0.5;
  const mitigated = Math.min(rawLoss, st.defence * 0.2);
  let losses = Math.max(0, Math.round(rawLoss - mitigated));
  const saved = Math.min(e.gear.medkit || 0, losses);
  losses -= saved;
  if (saved > 0) e.gear.medkit -= saved;
  const survivors = Math.max(0, e.people - losses);

  if (won) {
    const gold = lvl * 2, silver = lvl * 3;
    state.res.gold += gold;
    state.res.silver += silver;
    const books = 1 + (Math.random() < 0.4 ? 1 : 0);
    state.res.ancientbook = (state.res.ancientbook || 0) + books;
    logLine(TF("msg.exp_win", { lvl: lvl, gold: gold, silver: silver, books: books, losses: losses }));
    if (!(state.artifacts || {}).crown && lvl >= 3 && Math.random() < 0.3) {
      state.artifacts = state.artifacts || {};
      state.artifacts.crown = true;
      logLine(T("msg.crown_found"));
    }
  } else {
    logLine(TF("msg.exp_fail", { lvl: lvl, losses: losses }));
  }
  state.ruins = state.ruins.filter(r => r !== ru);
  e.people = survivors;
  returnExpedition(true);
}

function renderMap() {
  drawMap();
  drawMapMarkers();
  renderExpedition();
  if (mapActionsBuilt) return;
  mapActionsBuilt = true;
  window.addEventListener("keydown", ev => {
    if (!document.getElementById("panel-map").classList.contains("active")) return;
    const e = state.expedition;
    if (!e) return;
    const k = ev.key.toLowerCase();
    if (k === "w" || k === "ц") { moveExpedition(0, -1); ev.preventDefault(); }
    else if (k === "s" || k === "ы") { moveExpedition(0, 1); ev.preventDefault(); }
    else if (k === "a" || k === "ф") { moveExpedition(-1, 0); ev.preventDefault(); }
    else if (k === "d" || k === "в") { moveExpedition(1, 0); ev.preventDefault(); }
  });
  $("#map-canvas").addEventListener("click", ev => {
    const canvas = $("#map-canvas");
    const rect = canvas.getBoundingClientRect();
    const T = 20;
    const tx = Math.floor((ev.clientX - rect.left) / rect.width * T);
    const ty = Math.floor((ev.clientY - rect.top) / rect.height * T);
    const ru = (state.ruins || []).find(r => Math.floor(r.x * T) === tx && Math.floor(r.y * T) === ty);
    if (ru) {
      const lvl = ruinLevel(ru);
      const st = squadStats(
        state.expedition ? state.expedition.people : (state.draft ? state.draft.people : 0),
        state.expedition ? state.expedition.gear : (state.draft ? state.draft.gear : {}));
      const ch = Math.round(passChance(st.strength, lvl) * 100);
      $("#map-info").textContent =
        TF("msg.ruin_info", { x: tx, y: ty, lvl: lvl, str: st.strength, ch: ch });
    }
  });
}

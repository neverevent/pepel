// ui-build.js — стройка: дома, постройки, достопримечательности, свод построек

let buildSig = null;
const buildRows = {};

function renderBuildings() {
  const elb = $("#build-list");
  const shown = BUILDINGS.filter(b =>
    (state.built[b.id] || 0) < b.max && !(b.requiresSage && state.sages === 0) &&
    !(b.requiresResearch && !researched(b.requiresResearch)));
  const canUpgradeHut = researched("c_build") && (state.built.hut || 0) > ((state.upgrades || {}).hut || 0);
  const sig = shown.map(b => b.id).join(",") + "|" + (canUpgradeHut ? "u" : "");
  if (sig !== buildSig) {
    buildSig = sig;
    elb.innerHTML = "";
    for (const k in buildRows) delete buildRows[k];
    let housesBody = null, buildBody = null;
    const hutVisible = shown.some(b => b.id === "hut") || canUpgradeHut;
    if (hutVisible) {
      housesBody = collapsible(elb, T("blocks.houses") || "Дома", "build_houses");
    }
    const others = shown.filter(b => b.id !== "hut");
    if (others.length) {
      buildBody = collapsible(elb, T("blocks.buildings") || "Постройки", "build_others");
    }
    if (!shown.length && !canUpgradeHut) {
      elb.appendChild(el("p", "cost", T("msg.build_empty")));
      return;
    }
    for (const b of shown) {
      const row = el("div", "row");
      const left = el("span");
      left.appendChild(el("b", null, T("bld." + b.id) || b.name));
      const cost = el("span", "cost", " " + costStr(b.cost) + " · " + (TF("bld_text." + b.id + "_text") || b.text));
      left.appendChild(cost);
      row.appendChild(left);
      const btn = mkBtn(T("ui.build") || "Строить", () => {
        if (canAfford(b.cost, true)) {
          state.built[b.id] = (state.built[b.id] || 0) + 1;
          logLine(TF("msg.built", { name: T("bld." + b.id) || b.name }));
        }
      });
      row.appendChild(btn);
      if (b.id === "hut") housesBody.appendChild(row);
      else buildBody.appendChild(row);
      buildRows[b.id] = { cost, btn };
    }
    const upgradeTarget = canUpgradeHut ? housesBody : null;
    if (upgradeTarget) {
      const row = el("div", "row");
      const left = el("span");
      left.appendChild(el("b", null, T("bld.hut_upgrade") || "Улучшить хижину"));
      const cost = el("span", "cost", " " + costStr(CONFIG.hutUpgradeCost) + " · " + (TF("bld.hut_upgrade_text") || "вместимость 2 → 5"));
      left.appendChild(cost);
      row.appendChild(left);
      const btn = mkBtn(T("ui.upgrade") || "Улучшить", () => {
        if (canAfford(CONFIG.hutUpgradeCost, true)) {
          state.upgrades.hut = (state.upgrades.hut || 0) + 1;
          logLine(T("msg.hut_upgraded"));
        }
      });
      row.appendChild(btn);
      upgradeTarget.appendChild(row);
      buildRows.__hut = { cost, btn };
    }
    if (housesBody && !housesBody.childElementCount) housesBody.remove();
    if (buildBody && !buildBody.childElementCount) buildBody.remove();
  }
  for (const b of shown) {
    const r = buildRows[b.id];
    const visible = canAfford(b.cost, false);
    r.cost.classList.toggle("short", !visible);
    r.btn.disabled = !visible;
  }
  if (buildRows.__hut) {
    const ok = canAfford(CONFIG.hutUpgradeCost, false);
    buildRows.__hut.cost.classList.toggle("short", !ok);
    buildRows.__hut.btn.disabled = !ok;
  }
}

let cultureSig = null;

function renderCulture() {
  const elc = $("#culture-list");
  const hasUpgradedHut = ((state.upgrades || {}).hut || 0) > 0;
  const sig = (hasUpgradedHut ? "u" : "n") + "|" +
    Object.entries(state.cultureBuilt || {}).map(([k, v]) => `${k}:${v}`).join(",") + "|" + Math.floor(state.culture || 0);
  if (sig === cultureSig) return;
  cultureSig = sig;
  elc.innerHTML = "";
  if (!hasUpgradedHut) {
    elc.appendChild(el("h2", null, (T("blocks.landmarks") || "Уровень культуры") + (TF("blocks.culture_hint") || "")));
    elc.appendChild(el("p", "cost", T("msg.culture_locked")));
    return;
  }
  elc.appendChild(el("h2", null, (T("blocks.landmarks") || "Уровень культуры") + (TF("blocks.culture_hint") || "")));
  for (const cb of CULTURE_BUILDINGS) {
    const have = (state.cultureBuilt || {})[cb.id] || 0;
    if (have >= cb.max) continue;
    const row = el("div", "row");
    const left = el("span");
    left.appendChild(el("b", null, T("culture." + cb.id) || cb.name));
    left.appendChild(el("span", "cost",
      ` культура: ${cb.cost}${cb.morale ? ` · +${cb.morale} морали` : ""} · ${have}/${cb.max}`));
    row.appendChild(left);
    const b = mkBtn(T("ui.erect") || "Возвести", () => {
      if ((state.culture || 0) >= cb.cost) {
        state.culture -= cb.cost;
        state.cultureBuilt[cb.id] = (state.cultureBuilt[cb.id] || 0) + 1;
        logLine(cb.id === "village2"
          ? T("msg.ev.village2")
          : TF("msg.erected", { name: T("culture." + cb.id) || cb.name }));
      }
    });
    b.disabled = (state.culture || 0) < cb.cost;
    row.appendChild(b);
    elc.appendChild(row);
  }
}

let builtSig = null;

function renderBuilt() {
  const elb = $("#built-list");
  const built = BUILDINGS.filter(b => (state.built[b.id] || 0) > 0);
  const hutUp = (state.upgrades || {}).hut || 0;
  const sig = built.map(b => `${b.id}:${state.built[b.id]}`).join(",") + "|" + hutUp;
  if (sig === builtSig) return;
  builtSig = sig;
  elb.innerHTML = "";
  elb.appendChild(el("h2", null, T("blocks.built") || "Построено"));
  if (!built.length) {
    elb.appendChild(el("p", "cost", T("msg.nothing_built")));
    return;
  }
  for (const b of built) {
    let line = `${T("bld." + b.id) || b.name} — ${state.built[b.id]}`;
    if (b.id === "hut" && hutUp > 0) line += ` (улучшено: ${hutUp})`;
    elb.appendChild(el("p", null, line));
  }
}

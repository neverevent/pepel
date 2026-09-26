// ui-village.js — вкладка «Деревня»: ресурсы, работы, мораль

let resSig = null;
const resVals = {};

function buildResRows(elr, shown) {
  for (const r of shown) {
    const row = el("div", "row");
    row.appendChild(el("span", null, T("res." + r.id) || r.name));
    const v = el("span");
    row.appendChild(v);
    resVals[r.id] = v;
    elr.appendChild(row);
  }
}

function resourceVisible(r) {
  if (state.unlocked.resources[r.id]) return true;
  return JOBS.some(j => (j.produce && j.produce[r.id] && state.unlocked.jobs.includes(j.id)) ||
    (j.consumes && j.consumes[r.id] && state.unlocked.jobs.includes(j.id)));
}

function renderResources() {
  const elr = $("#resources");
  const mats = RESOURCES.filter(r => !r.item && !r.livestock && resourceVisible(r));
  const items = RESOURCES.filter(r => r.item && resourceVisible(r));
  const stock = RESOURCES.filter(r => r.livestock &&
    (state.unlocked.resources[r.id] || (r.id === "sheep" && state.unlocked.jobs.includes("shepherd")) ||
      (r.id === "dogs" && researched("c_dog"))));
  const sig = mats.map(r => r.id).join(",") + "|" + items.map(r => r.id).join(",") + "|" + stock.map(r => r.id).join(",");
  if (sig !== resSig) {
    resSig = sig;
    elr.innerHTML = "";
    for (const k in resVals) delete resVals[k];
    buildResRows(collapsible(elr, T("blocks.mats") || "Материалы", "res_mats"), mats);
    buildResRows(collapsible(elr, T("blocks.items") || "Инвентарь", "res_items"), items);
    buildResRows(collapsible(elr, T("blocks.stock") || "Скот", "res_stock"), stock);
  }
  for (const r of mats.concat(items, stock)) {
    let txt = fmt(state.res[r.id]);
    if (r.id === "wisdom") txt += " / " + Math.floor(wisdomCap() * 1.1);
    else if (r.cap != null) txt += " / " + Math.floor(resCap(r));
    resVals[r.id].textContent = txt;
  }
}

let jobsSig = null;
const jobRows = {};

function renderJobs() {
  const elj = $("#jobs");
  const shown = JOBS.filter(j => state.unlocked.jobs.includes(j.id));
  const sig = shown.map(j => j.id).join(",");
  if (sig !== jobsSig) {
    jobsSig = sig;
    elj.innerHTML = "";
    const body = collapsible(elj, T("blocks.jobs") || "Работы", "jobs");
    for (const k in jobRows) delete jobRows[k];
    for (const j of shown) {
      const row = el("div", "row");
      const prod = Object.entries(j.produce).map(([k, v]) => TF("ui.rate", { v: v, res: resName(k) })).join(", ") +
        Object.entries(j.consumes || {}).map(([k, v]) => " −" + TF("ui.rate", { v: v, res: resName(k) })).join(", ");
      const left = el("span");
      left.appendChild(document.createTextNode((T("job." + j.id) || j.name) + " "));
      const cnt = el("span", "cost");
      left.appendChild(cnt);
      left.appendChild(document.createTextNode(" " + prod));
      row.appendChild(left);
      const minus = mkBtn("−", () => { const n = jobCount(j.id); if (n > 0) state.jobs[j.id] = n - 1; });
      const plus = mkBtn("+", () => { if (freeVillagers() > 0) state.jobs[j.id] = jobCount(j.id) + 1; });
      row.appendChild(minus);
      row.appendChild(plus);
      body.appendChild(row);
      jobRows[j.id] = { cnt, minus, plus };
    }
    const fr = el("div", "row");
    fr.appendChild(el("span", "cost", (T("blocks.free") || "Свободные жители") + ":"));
    const freeVal = el("span");
    fr.appendChild(freeVal);
    body.appendChild(fr);
    jobRows.__free = freeVal;
  }
  for (const j of shown) {
    const r = jobRows[j.id];
    const n = jobCount(j.id);
    r.cnt.textContent = n > 0 ? String(n) : "";
    r.minus.disabled = n <= 0;
    r.plus.disabled = freeVillagers() <= 0;
  }
  jobRows.__free.textContent = String(freeVillagers());
}

let moraleSig = null;

function renderMorale() {
  const elm = $("#morale");
  const m = morale();
  const lvl = moraleLevel();
  const sig = `${m}:${state.culture}`;
  if (sig === moraleSig) return;
  moraleSig = sig;
  elm.innerHTML = "";
  elm.appendChild(el("h2", null, `${T("blocks.morale") || "Мораль"}: ${m} · ${lvl + 1} · ${T("blocks.culture") || "культура"}: ${Math.floor(state.culture)}`));
  const bar = el("div");
  bar.style.cssText = "height:8px;border:1px solid var(--line);";
  const fill = el("div");
  fill.style.cssText = `height:100%;width:${m}%;background:var(--ember);`;
  bar.appendChild(fill);
  elm.appendChild(bar);
  elm.appendChild(el("p", "cost",
    ((state.upgrades || {}).hut > 0 ? TF("morale.houses", { n: 10 * (state.upgrades.hut || 0) }) + " · " : "") +
    (state.res.food > 0 ? TF("morale.food", {}) : TF("morale.nofood", {})) +
    (freeVillagers() === 0 && state.pop > 0 ? " · " + TF("morale.free_zero", {}) : " · " + TF("morale.free", { n: freeVillagers() })) +
    (state.jobMoraleBonus ? " · " + TF("morale.jobs", { n: Math.round(state.jobMoraleBonus * 10) / 10 }) : "") +
    (landmarkMorale() ? " · " + TF("morale.landmarks", { n: landmarkMorale() }) : "") +
    (temporaryMorale() ? " · " + TF("morale.events", { n: temporaryMorale() }) : "")));
}

function temporaryMorale() {
  let m = 0;
  for (const b of state.moraleBoosts || []) if (state.day <= b.until) m += b.amount;
  return m;
}

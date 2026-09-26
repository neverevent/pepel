// core.js — состояние, сохранения, справочные функции, интерфейсные примитивы
// Данные (RESOURCES, JOBS, ...) и словарь локализации подключаются раньше.

let state = null;

function initialState() {
  const res = {};
  for (const r of RESOURCES) res[r.id] = r.start;
  return {
    day: 1,
    dayT: 0,
    pop: CONFIG.startingPopulation,
    jobs: {},
    res,
    built: {},
    unlocked: { resources: { food: true, wood: true }, jobs: ["gatherer", "hunter"] },
    seen: {},
    researched: {},
    sages: 0,
    speed: 1,
    culture: 0,
    cultureBuilt: {},
    moraleBoosts: [],
    maxMoraleLevel: Math.floor(CONFIG.baseMorale / 25),
    upgrades: {},
    artifacts: {},
    uiCollapsed: {},
    lastSeason: 0,
    seasonHungry: false,
    jobMoraleBonus: 0,
    log: [{ day: 1, text: T("msg.start") || "Просыпаетесь у потухшего костра. Рядом ещё один человек." }],
  };
}

function save() {
  try { localStorage.setItem(CONFIG.saveKey, JSON.stringify(state)); }
  catch (e) { /* доступ к localStorage закрыт — играем без сохранения */ }
}

function load() {
  try {
    const raw = localStorage.getItem(CONFIG.saveKey);
    if (raw) { state = JSON.parse(raw); }
  } catch (e) { }
  if (!state || typeof state !== "object" || !state.res) state = initialState();
  for (const r of RESOURCES) if (!(r.id in state.res)) state.res[r.id] = r.start;
  if (!state.unlocked) state.unlocked = initialState().unlocked;
  if (!state.seen) state.seen = {};
  if (!state.built) state.built = {};
  if (!state.jobs) state.jobs = {};
  if (!state.researched) state.researched = {};
  if (!state.upgrades) state.upgrades = {};
  if (!state.cultureBuilt) state.cultureBuilt = {};
  if (typeof state.culture !== "number") state.culture = 0;
  if (typeof state.maxMoraleLevel !== "number") state.maxMoraleLevel = 0;
  if (!state.moraleBoosts) state.moraleBoosts = [];
  if (typeof state.jobMoraleBonus !== "number") state.jobMoraleBonus = 0;
  if (state.seasonHungry !== true) state.seasonHungry = false;
  if (typeof state.lastSeason !== "number") state.lastSeason = 0;
  if (!state.mapSeed) state.mapSeed = Math.floor(Math.random() * 1e9);
  if (typeof state.sages !== "number") state.sages = 0;
  if (state.speed !== 2) state.speed = 1;
  if (typeof state.paused !== "boolean") state.paused = false;
  if (state.unlocked && !state.unlocked.jobs.includes("hunter")) state.unlocked.jobs.push("hunter");
  const baseLvl = Math.floor(CONFIG.baseMorale / 25);
  if (state.maxMoraleLevel < baseLvl) state.maxMoraleLevel = baseLvl;
  fixJobs();
}

function popCap() {
  let cap = CONFIG.startingPopulation;
  for (const b of BUILDINGS) cap += ((b.effect || {}).population || 0) * (state.built[b.id] || 0);
  cap += (CONFIG.hutUpgradeBonus || 0) * ((state.upgrades || {}).hut || 0);
  return cap;
}

function seasonIndex() {
  return Math.floor((state.day - 1) / CONFIG.seasonLengthDays) % SEASONS.length;
}
function season() { return SEASONS[seasonIndex()]; }

function storageCap() {
  let cap = CONFIG.baseStorage;
  for (const b of BUILDINGS) cap += ((b.effect || {}).storage || 0) * (state.built[b.id] || 0);
  return cap;
}

function resCap(r) {
  const mult = 1 + (state.built.storage || 0);
  if (r.cap != null) return r.cap * mult;
  return storageCap();
}

function clampRes() {
  for (const r of RESOURCES) {
    if (r.intangible) continue;
    state.res[r.id] = Math.min(resCap(r), Math.max(0, state.res[r.id] || 0));
  }
}

function jobCount(id) { return state.jobs[id] || 0; }
function freeVillagers() { return state.pop - Object.values(state.jobs).reduce((a, b) => a + b, 0); }

function fixJobs() {
  let assigned = 0;
  for (const j of JOBS) assigned += jobCount(j.id);
  while (assigned > state.pop && assigned > 0) {
    const pool = JOBS.filter(j => jobCount(j.id) > 0);
    const j = pool[Math.floor(Math.random() * pool.length)];
    state.jobs[j.id]--;
    assigned--;
  }
}

function buildingEffect(id, key) {
  const b = BUILDINGS.find(x => x.id === id);
  if (!b || !b.effect || !b.effect[key]) return 0;
  return b.effect[key] * (state.built[id] || 0);
}

function canAfford(cost, spend) {
  for (const k in cost) {
    if ((state.res[k] || 0) < cost[k]) return false;
  }
  if (spend) for (const k in cost) state.res[k] -= cost[k];
  return true;
}

function addPopulation(n) {
  state.pop = Math.min(popCap(), state.pop + n);
}

function costStr(cost) {
  return Object.entries(cost)
    .map(([k, v]) => `${resName(k)}: ${Math.ceil(v)}`)
    .join(", ");
}

function resName(id) {
  const r = RESOURCES.find(x => x.id === id);
  return T("res." + id) || (r ? r.name : id);
}

function logLine(text) {
  state.log.unshift({ day: state.day, text });
  if (state.log.length > 120) state.log.length = 120;
}

function researched(id) { return !!(state.researched && state.researched[id]); }

function researchEffects() {
  const eff = { finds: [], hunterFinds: [] };
  for (const r of RESEARCHES) {
    if (!researched(r.id) || !r.effect) continue;
    if (r.effect.finds) eff.finds = eff.finds.concat(r.effect.finds);
    if (r.effect.hunterFinds) eff.hunterFinds = eff.hunterFinds.concat(r.effect.hunterFinds);
    if (r.effect.gathererExtra) {
      eff.gathererExtra = eff.gathererExtra || {};
      for (const k in r.effect.gathererExtra) {
        eff.gathererExtra[k] = (eff.gathererExtra[k] || 0) + r.effect.gathererExtra[k];
      }
    }
  }
  return eff;
}

function craftVisible(c) {
  if (c.requiresBuilding && !(state.built[c.requiresBuilding] > 0)) return false;
  if (c.unlockBy && !researched(c.unlockBy)) return false;
  return true;
}

function researchTabOpen() {
  return !!state.researchTab || state.res.wisdom >= CONFIG.wisdomForResearch;
}

function addMoraleBoost(amount, days) {
  state.moraleBoosts = state.moraleBoosts || [];
  state.moraleBoosts.push({ amount, until: state.day + days });
}

function landmarkMorale() {
  let m = 0;
  for (const cb of CULTURE_BUILDINGS) {
    m += (cb.morale || 0) * ((state.cultureBuilt || {})[cb.id] || 0);
  }
  return m;
}

function morale() {
  let m = CONFIG.baseMorale;
  if ((state.upgrades || {}).hut > 0) m += 10 * (state.upgrades.hut || 0);
  if (state.res.food > 0) m += 5;
  m += state.jobMoraleBonus || 0;
  m += landmarkMorale();
  for (const b of state.moraleBoosts || []) {
    if (state.day <= b.until) m += b.amount;
  }
  if ((state.artifacts || {}).crown) {
    m -= Math.min(20, Math.floor((state.crownDays || 0) / 30) * 2);
  }
  return Math.max(0, Math.min(100, Math.round(m)));
}

function moraleLevel() { return Math.floor(morale() / 25); }

function wisdomCap() {
  let cap = CONFIG.baseWisdomCap;
  for (const b of BUILDINGS) cap += ((b.effect || {}).wisdomCap || 0) * (state.built[b.id] || 0);
  cap += 25 * (state.res.scroll || 0);
  cap += 100 * (state.res.book || 0);
  return cap;
}

// --- интерфейсные примитивы ---

const $ = sel => document.querySelector(sel);

function T(path) {
  const pack = (window.I18N || {})[window.GAME_LANG || "ru"] || {};
  let v = pack;
  for (const p of path.split(".")) {
    if (v == null) return null;
    v = v[p];
  }
  return typeof v === "string" ? v : null;
}

// шаблон: TF("msg.built", {name: "Хижина"}) подставляет {ключ} значениями
function TF(path, params) {
  let s = T(path);
  if (s == null) return null;
  for (const k in params || {}) s = s.split("{" + k + "}").join(String(params[k]));
  return s;
}

function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return "0";
  if (n >= 100) return String(Math.floor(n));
  return n.toFixed(1).replace(/\.0$/, "");
}

function tabTo(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === `panel-${name}`));
}

function mkBtn(label, fn) {
  const b = document.createElement("button");
  b.className = "action";
  b.textContent = label;
  b.addEventListener("click", fn);
  return b;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function sectionTitle(label, key) {
  const h = el("h2", "collapsible", label);
  const apply = () => {
    const collapsed = (state.uiCollapsed || {})[key];
    h.nextSibling && (h.nextSibling.style.display = collapsed ? "none" : "");
    h.textContent = (collapsed ? "▸ " : "▾ ") + label;
  };
  h.addEventListener("click", () => {
    state.uiCollapsed = state.uiCollapsed || {};
    state.uiCollapsed[key] = !(state.uiCollapsed || {})[key];
    apply();
  });
  return { h, apply };
}

function collapsible(parent, label, key) {
  const t = sectionTitle(label, key);
  const body = el("div");
  parent.appendChild(t.h);
  parent.appendChild(body);
  t.apply();
  return body;
}

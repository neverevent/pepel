// tick.js — игровой цикл: производство, потребление, события, открытия

function tick(dt) {
  state.dayT += dt;
  const dayChanged = state.dayT >= CONFIG.dayLengthSec;
  if (dayChanged) {
    state.dayT = 0;
    state.day++;
    if (typeof state.maxMoraleLevel !== "number") state.maxMoraleLevel = 0;
    const lvl = moraleLevel();
    if (lvl > state.maxMoraleLevel) {
      for (let L = state.maxMoraleLevel + 1; L <= lvl; L++) state.culture += L * (CONFIG.culturePerLevel || 1);
      state.maxMoraleLevel = lvl;
    }
    state.culture += lvl * (CONFIG.culturePerDay || 0);
    if (state.moraleBoosts) {
      state.moraleBoosts = state.moraleBoosts.filter(b => state.day <= b.until);
    }
    if ((state.artifacts || {}).crown) {
      state.crownDays = (state.crownDays || 0) + 1;
      const p = Math.min(0.08, 0.0004 * state.crownDays * Math.sqrt(state.crownDays));
      if (Math.random() < p && state.pop > 1) {
        state.pop--;
        logLine(T("msg.villager_lost"));
      }
    }
    if (state.res.food <= 0 && state.day % CONFIG.starveCheckDays === 0 && state.pop > 0) {
      state.pop--;
      logLine(T("msg.starved"));
    }
    const wCap = wisdomCap();
    if ((state.res.wisdom || 0) > wCap && Math.random() < CONFIG.madnessChance) {
      const roll = Math.random();
      if (roll < 0.34 && state.pop > 1) {
        state.pop--;
        logLine(T("msg.mad_murder"));
      } else if (roll < 0.68 && state.pop > 1) {
        state.pop--;
        logLine(T("msg.mad_suicide"));
      } else {
        const loss = Math.floor((state.res.food || 0) * 0.25);
        state.res.food = Math.max(0, (state.res.food || 0) - loss);
        state._evLoss = loss;
        logLine(TF("msg.mad_gluttony", { loss: loss }));
      }
    }
    fixJobs();
    const si = seasonIndex();
    if (state.lastSeason !== si) {
      let assigned = 0;
      for (const j of JOBS) assigned += jobCount(j.id);
      state.jobMoraleBonus = state.seasonHungry
        ? 0
        : Math.min(CONFIG.moralePerWorkerCap, assigned * CONFIG.moralePerWorker);
      state.seasonHungry = false;
      state.lastSeason = si;
      logLine(state.jobMoraleBonus > 0
        ? TF("msg.season_turn", { n: Math.round(state.jobMoraleBonus * 10) / 10 })
        : T("msg.season_hungry"));
    }
  }
  if (state.res.food <= 0) state.seasonHungry = true;

  const wisdomMult = (buildingEffect("school", "wisdomRate") || 1)
    * (1 + 0.02 * (state.res.scroll || 0) + 0.05 * (state.res.book || 0))
    * (1 + 0.05 * (state.built.library || 0));
  const cap = storageCap();
  const eff = researchEffects();
  const gathererExtra = eff.gathererExtra || {};
  const foodBoost = buildingEffect("dryer", "foodBoost") || 1;

  for (const j of JOBS) {
    const n = jobCount(j.id);
    if (!n) continue;
    let produce = j.produce;
    if (j.id === "farmer") {
      const si = seasonIndex();
      if (si === 3) continue;
      let sm = CONFIG.farmSeasonMult[["spring", "summer", "autumn"][si]] || 1;
      let crop = "grain";
      if (si === 1 && (state.res.rice || 0) > 0) { crop = "rice"; sm = CONFIG.riceSummerMult; }
      produce = { [crop]: j.produce.grain * sm };
    }
    let mult = 1;
    if (j.boostedBy) mult = 1 + 1.25 * (state.res[j.boostedBy] / n);
    let scale = 1;
    if (j.consumes) {
      for (const k in j.consumes) {
        const need = j.consumes[k] * n * dt;
        const got = Math.min(state.res[k] || 0, need);
        state.res[k] -= got;
        scale = need > 0 ? Math.min(scale, got / need) : 0;
      }
    }
    let firstKey = null;
    for (const k in produce) {
      if (firstKey === null) firstKey = k;
      const isWis = k === "wisdom";
      let rate = produce[k] * n * (isWis ? wisdomMult : mult);
      if (k === "food" && j.id === "hunter") {
        rate *= foodBoost;
        if (foodBoost > 1 && (state.res.salt || 0) > 0) {
          state.res.salt = Math.max(0, state.res.salt - rate * 0.002 * dt);
        } else if (foodBoost > 1) {
          rate /= foodBoost;
        }
        if (seasonIndex() === 3) rate *= 1.2;
      }
      rate *= scale;
      if (RESOURCES.find(r => r.id === k)?.intangible) {
        state.res[k] += rate * dt;
      } else {
        state.res[k] = Math.min(cap, state.res[k] + rate * dt);
      }
      if (j.boostedBy && k === firstKey && scale > 0 && state.res[j.boostedBy] > 0) {
        const life = j.id === "miner" && researched("m_forge")
          ? CONFIG.toolCostPerUnitForged : CONFIG.toolCostPerUnit;
        state.res[j.boostedBy] = Math.max(0,
          state.res[j.boostedBy] - (produce[k] * n / life) * dt);
      }
    }
    if (j.id === "gatherer") {
      for (const k in gathererExtra) {
        state.res[k] = Math.min(cap, state.res[k] + gathererExtra[k] * n * dt);
      }
    }
    if (j.id === "miner") {
      for (const f of eff.finds) {
        if (Math.random() < f.chance * n * dt) state.res[f.res]++;
      }
    }
    if (j.id === "hunter") {
      for (const f of eff.hunterFinds) {
        if (Math.random() < f.chance * n * dt) state.res[f.res]++;
      }
    }
  }

  const s = season();
  let eatPop = 0;
  let assigned = 0;
  for (const j of JOBS) {
    const n = jobCount(j.id);
    eatPop += n * (j.foodUse || 1);
    assigned += n;
  }
  eatPop += Math.max(0, state.pop - assigned);
  let cold = false;
  if (s.clothesUse > 0) {
    const need = state.pop * s.clothesUse * dt / (CONFIG.seasonLengthDays * CONFIG.dayLengthSec);
    let got = 0;
    const useWarm = Math.min(state.res.warmclothes || 0, need);
    state.res.warmclothes -= useWarm;
    got += useWarm;
    const usePlain = Math.min(state.res.clothes || 0, (need - got) / 0.5);
    state.res.clothes -= usePlain;
    got += usePlain * 0.5;
    if (got < need - 1e-9) cold = true;
    const key = "cold" + seasonIndex();
    if (cold && state.seen[key] !== true) {
      state.seen[key] = true;
      logLine(T("msg.cold_winter"));
    }
  }
  let workers = 0;
  for (const j of JOBS) workers += jobCount(j.id);
  state.res.wisdom += 0.01 * workers * wisdomMult * dt;

  if (researched("t_history") && researched("t_translate") && (state.res.ancientbook || 0) > 0) {
    state.res.ancientbook -= 1;
    state.res.wisdom += 300;
    logLine(T("msg.book_read"));
  }

  const eat = CONFIG.foodPerVillager * eatPop * s.foodMult * (cold ? 1.5 : 1) * dt;
  state.res.food = Math.max(0, state.res.food - eat);
  state.res.wood = Math.max(0, state.res.wood - state.pop * s.woodBurn * dt);

  clampRes();
  state.res.wisdom = Math.min(state.res.wisdom || 0, wisdomCap() * 1.1);

  unlockCheck();

  if (dayChanged && state.sages === 0 && state.res.wisdom >= CONFIG.wisdomForSage) {
    if (Math.random() < CONFIG.sageChance) {
      state.sages = 1;
      logLine(T("msg.sage"));
    }
  }

  for (const ev of EVENTS) {
    if ((state.seen[ev.id] || 0) + ev.interval <= state.day) {
      const c = typeof ev.chance === "function" ? ev.chance() : ev.chance;
      if (Math.random() < c * dt) {
        state.seen[ev.id] = state.day;
        const wasPop = state.pop;
        if (ev.id === "wanderer") {
          ev.effect();
          logLine(state.pop > wasPop
            ? T("msg.ev.wanderer_ok") : T("msg.ev.wanderer_no"));
        } else {
          const key = ev.effect();
          if (typeof key === "string") logLine(TF("msg." + key, { loss: state._evLoss || 0 }));
          else if (typeof ev.text === "string") logLine(T("msg.ev." + ev.id) || ev.text);
        }
      }
    }
  }

  fixJobs();

  save();
}

function unlockCheck() {
  for (const j of JOBS) {
    if (state.unlocked.jobs.includes(j.id)) continue;
    let open = false;
    if (j.requires && canAfford(j.requires, false)) open = true;
    if (j.requiresBuilding && (state.built[j.requiresBuilding] || 0) > 0) open = true;
    if (j.requiresResearch && researched(j.requiresResearch)) open = true;
    if (open) {
      state.unlocked.jobs.push(j.id);
      logLine(TF("msg.job_opened", { name: T("job." + j.id) || j.name }));;
    }
  }
  if ((state.built.workshop || 0) > 0 && !state.seen.workshopOpen) {
    state.seen.workshopOpen = true;
    logLine(T("msg.workshop_open") || null);
  }
  if (state.res.wisdom >= CONFIG.wisdomForResearch && !state.researchTab) {
    state.researchTab = true;
    logLine(TF("msg.research_call", { n: CONFIG.wisdomForResearch }));;
  }
  for (const r of RESOURCES) {
    if (state.res[r.id] > 0) state.unlocked.resources[r.id] = true;
  }
  for (const j of JOBS) {
    if (!state.unlocked.jobs.includes(j.id)) continue;
    for (const k in (j.produce || {})) state.unlocked.resources[k] = true;
    for (const k in (j.consumes || {})) state.unlocked.resources[k] = true;
  }
}

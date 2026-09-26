// ui-craft.js — ремесло и торговцы

let craftSig = null;
const craftRows = {};

function renderCrafts() {
  const elc = $("#craft-list");
  const shown = CRAFTS.filter(craftVisible);
  const sig = shown.map(c => c.id).join(",");
  if (sig !== craftSig) {
    craftSig = sig;
    elc.innerHTML = "";
    for (const k in craftRows) delete craftRows[k];
    if (!shown.length) {
      elc.appendChild(el("p", "cost", T("msg.craft_empty")));
      return;
    }
    for (const c of shown) {
      const row = el("div", "row");
      const left = el("span");
      left.appendChild(el("b", null, T("craft." + c.id) || c.name));
      const cost = el("span", "cost", " " + costStr(c.cost));
      left.appendChild(cost);
      if (c.desc) {
        left.appendChild(document.createElement("br"));
        left.appendChild(el("span", "cost", T("craft." + c.id + "_desc") || c.desc));
      }
      row.appendChild(left);
      const b = mkBtn(T("ui.craft") || "Мастерить", () => {
        if (canAfford(c.cost, true)) {
          state.res[c.id] = (state.res[c.id] || 0) + 1;
          clampRes();
          logLine(TF("msg.crafted", { name: T("craft." + c.id) || c.name }));
        } else {
          logLine(TF("msg.missing", { name: T("craft." + c.id) || c.name, cost: costStr(c.cost) }));
        }
      });
      row.appendChild(b);
      elc.appendChild(row);
      craftRows[c.id] = { cost, b };
    }
  }
  for (const c of shown) {
    const r = craftRows[c.id];
    const full = c.cap && (state.res[c.id] || 0) >= c.cap;
    const have = canAfford(c.cost, false) && !full;
    r.cost.textContent = " " + costStr(c.cost) + (c.cap ? ` · ${Math.floor(state.res[c.id] || 0)}/${c.cap}` : "");
    r.cost.classList.toggle("short", !have);
    r.b.disabled = !have;
  }
}

let marketSig = null;
const marketRows = {};

function renderMarket() {
  const elm = $("#market-list");
  const open = (state.built.tradingpost || 0) > 0
    && state.marketUntil && state.day <= state.marketUntil;
  const sig = open ? "open" : "closed";
  if (sig !== marketSig) {
    marketSig = sig;
    elm.innerHTML = "";
    for (const k in marketRows) delete marketRows[k];
    if (!open) {
      elm.appendChild(el("h2", null, T("blocks.merchants") || "Торговцы"));
      elm.appendChild(el("p", "cost", T("msg.no_merchants")));
      return;
    }
    elm.appendChild(el("h2", null, `${T("blocks.merchants") || "Торговцы"} (${TF("msg.market_until", { n: state.marketUntil }) || "уезжают в день " + state.marketUntil})`));
    for (const t of TRADES) {
      const row = el("div", "row");
      const left = el("span");
      left.appendChild(el("b", null, T("trade." + t.id) || t.name));
      row.appendChild(left);
      const holder = el("span");
      for (const v of t.variants) {
        const b = mkBtn(costStr(v), () => {
          if (!canAfford(v, true)) return;
          if (t.id.startsWith("research:")) {
            const rid = t.id.slice(9);
            state.researched[rid] = true;
            const r = RESEARCHES.find(x => x.id === rid);
            logLine(TF("msg.sold_knowledge", { name: r ? (T("tech." + r.id) || r.name) : rid }));
          } else {
            state.res[t.id] = (state.res[t.id] || 0) + 1;
            clampRes();
            logLine(TF("msg.bought", { name: T("trade." + t.id) || t.name }));
          }
        });
        b.style.marginLeft = "6px";
        holder.appendChild(b);
      }
      row.appendChild(holder);
      elm.appendChild(row);
      marketRows[t.id] = { holder, t };
    }
  }
  if (open) {
    for (const t of TRADES) {
      const r = marketRows[t.id];
      if (t.id.startsWith("research:")) {
        const rid = t.id.slice(9);
        const done = researched(rid);
        r.holder.querySelectorAll("button").forEach(b => {
          b.disabled = done;
          if (done) b.textContent = T("msg.done") || "изучено";        });
        continue;
      }
      r.holder.querySelectorAll("button").forEach((b, i) => {
        b.disabled = !canAfford(t.variants[i], false);
      });
    }
  }
}

// ui-research.js — дерево технологий по ветвям

let researchSig = null;
const researchRows = {};
let capLine = null;

function updateCapLine() {
  if (capLine) capLine.textContent = TF("msg.wisdom_cap", { n: Math.floor(wisdomCap()) }) || "";
}

const BRANCH_KEYS = { m: "m", h: "h", c: "c", t: "t" };

function renderResearch() {
  const elr = $("#research-list");
  const sig = RESEARCHES.map(r => researched(r.id) ? r.id : "").join(",");
  if (sig !== researchSig) {
    researchSig = sig;
    elr.innerHTML = "";
    capLine = el("p", "cost");
    elr.appendChild(capLine);
    updateCapLine();
    for (const k in researchRows) delete researchRows[k];
    const branches = {};
    for (const r of RESEARCHES) (branches[r.id[0]] = branches[r.id[0]] || []).push(r);
    for (const p in branches) {
      const body = collapsible(elr, T("branches." + p) || BRANCH_FALLBACK(p), "tech_" + p);
      for (const r of branches[p]) {
        const row = el("div", "row");
        row.style.paddingLeft = "14px";
        const left = el("span");
        left.appendChild(el("b", null, T("tech." + r.id) || r.name));
        const status = el("span", "cost", " " + (T("tech." + r.id + "_desc") || r.desc));
        left.appendChild(status);
        row.appendChild(left);
        if (!researched(r.id)) {
          const b = mkBtn(T("ui.research") || "Изучить", () => {
            const prev = !r.requires || researched(r.requires);
            if (prev && state.res.wisdom >= r.cost) {
              state.res.wisdom -= r.cost;
              state.researched[r.id] = true;
              logLine(TF("msg.researched", { name: T("tech." + r.id) || r.name }) || `Learned: ${r.name}.`);
            }
          });
          row.appendChild(b);
          researchRows[r.id] = { status, b };
        } else {
          status.textContent = " " + T("msg.done");
        }
        body.appendChild(row);
      }
    }
  }
  for (const r of RESEARCHES) {
    const ui = researchRows[r.id];
    if (!ui) continue;
    const prev = !r.requires || researched(r.requires);
    const merchantOnly = !!r.merchantOnly;
    const canDo = prev && state.res.wisdom >= r.cost && !merchantOnly;
    let need = "";
    if (r.requires && !researched(r.requires)) {
      const reqName = T("tech." + r.requires) || (RESEARCHES.find(x => x.id === r.requires) || {}).name;
      const clause = TF("msg.after_tech", { name: reqName })
        || (window.GAME_LANG === "en" ? `after «${reqName}»` : `после «${reqName}»`);
      need = " \u00A0·\u00A0 " + String(clause).replace(/ /g, "\u00A0");
    }
    ui.status.textContent = merchantOnly
      ? T("msg.merchant_only")
      : ` ${resName("wisdom")}: ${Math.ceil(r.cost)}${need}`;
    ui.b.disabled = !canDo && !merchantOnly;
  }
  updateCapLine();
}

function BRANCH_FALLBACK(p) {
  const names = {
    m: "Ветвь: Шахтёрское дело",
    h: "Ветвь: Охотничье дело",
    c: "Ветвь: Строительство и хозяйство",
    t: "Ветвь: Знание и торговля",
  };
  return names[p] || ("Ветвь: " + p);
}

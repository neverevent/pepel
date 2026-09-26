
const VERSION = "2.8";

const RESOURCES = [
  { id: "wood",      name: "Дрова",      start: 0, cap: 500 },
  { id: "food",      name: "Еда",        start: 10, cap: 400 },
  { id: "stone",     name: "Камень",     start: 0, cap: 400 },
  { id: "wisdom",    name: "Мудрость",   start: 0, intangible: true },
  { id: "tools",     name: "Инструменты", start: 0, item: true, cap: 20 },
  { id: "axe",       name: "Топоры",     start: 0, item: true, cap: 20 },
  { id: "bow",       name: "Луки",       start: 0, item: true, cap: 20 },
  { id: "trap",      name: "Ловушки",    start: 0, item: true, cap: 20 },
  { id: "skins",     name: "Шкуры",      start: 0, cap: 200 },
  { id: "bones",     name: "Кости",      start: 0, cap: 200 },
  { id: "leather",   name: "Кожа",       start: 0, cap: 150 },
  { id: "fertilizer", name: "Удобрение", start: 0, item: true, cap: 30 },
  { id: "herbs",     name: "Травы",      start: 0, cap: 200 },
  { id: "tendons",   name: "Сухожилия",  start: 0, cap: 100 },
  { id: "salt",      name: "Соль",       start: 0, cap: 150 },
  { id: "ratpoison", name: "Крысиный яд", start: 0, cap: 20 },
  { id: "grain",     name: "Зерно пшеницы", start: 0, cap: 300 },
  { id: "rice",      name: "Рис",        start: 0, cap: 300 },
  { id: "flour",     name: "Мука",       start: 0, cap: 200 },
  { id: "wool",      name: "Шерсть",     start: 0, cap: 200 },
  { id: "sheep",     name: "Овцы",       start: 0, intangible: true, livestock: true, cap: 60 },
  { id: "dogs",      name: "Собаки",     start: 0, intangible: true, livestock: true, cap: 20 },
  { id: "clothes",   name: "Одежда",     start: 0, item: true, cap: 40 },
  { id: "warmclothes", name: "Тёплая одежда", start: 0, item: true, cap: 40 },
  { id: "scroll",    name: "Свитки",     start: 0, item: true, cap: 20 },
  { id: "paper",     name: "Бумага",     start: 0, cap: 100 },
  { id: "book",      name: "Книги",      start: 0, item: true, cap: 10 },
  { id: "sword",     name: "Мечи",       start: 0, item: true, cap: 20 },
  { id: "armor",     name: "Броня",      start: 0, item: true, cap: 20 },
  { id: "medkit",    name: "Медикаменты", start: 0, item: true, cap: 10 },
  { id: "musket",    name: "Мушкеты",    start: 0, item: true, cap: 10 },
  { id: "ancientbook", name: "Древние книги", start: 0, item: true, intangible: true },
  { id: "coal",      name: "Уголь",      start: 0, cap: 300 },
  { id: "iron",      name: "Железо",     start: 0, cap: 200 },
  { id: "silver",    name: "Серебро",    start: 0, cap: 150 },
  { id: "gold",      name: "Золото",     start: 0, cap: 150 },
  { id: "gems",      name: "Самоцветы",  start: 0, cap: 50 },
  { id: "saltpeter", name: "Селитра",    start: 0, cap: 150 },
  { id: "sulfur",    name: "Сера",       start: 0, cap: 150 },
];

const JOBS = [
  { id: "gatherer", name: "Собиратель",  produce: { wood: 0.5 }, visibleAtStart: true, boostedBy: "axe" },
  { id: "hunter",   name: "Охотник",     produce: { food: 0.4, wisdom: 0.05 }, requires: { wood: 30 }, boostedBy: "bow", foodUse: 1.2 },
  { id: "miner",    name: "Шахтёр",      produce: { stone: 0.25, wisdom: 0.05 }, requires: { wood: 60 }, boostedBy: "tools", foodUse: 1.2 },
  { id: "pupil",    name: "Мудрец", produce: { wisdom: 0.2 }, requiresBuilding: "school", foodUse: 0.8 },
  { id: "farmer",   name: "Фермер",      produce: { grain: 0.45 }, requiresBuilding: "field", foodUse: 1.1, boostedBy: "fertilizer" },
  { id: "shepherd", name: "Пастух",      produce: { wool: 0.05, sheep: 0.005 }, requiresBuilding: "pen" },
  { id: "miller",   name: "Мельник",     consumes: { grain: 0.3 }, produce: { flour: 0.15 }, requiresBuilding: "mill" },
  { id: "baker",    name: "Пекарь",      consumes: { flour: 0.15 }, produce: { food: 0.6 }, requiresBuilding: "bakery", foodUse: 1 },
  { id: "tanner",   name: "Кожевник",    consumes: { skins: 0.05, herbs: 0.02 }, produce: { leather: 0.05 }, requiresBuilding: "tannery" },
  { id: "scribe",   name: "Писарь",      consumes: { leather: 0.05 }, produce: { scroll: 0.02 }, requiresBuilding: "tannery" },
  { id: "herbalist", name: "Травник",    produce: { herbs: 0.15 }, requiresResearch: "h_herbs" },
];

const BUILDINGS = [
  {
    id: "hut", name: "Хижина", max: 10,
    cost: { wood: 50 },
    effect: { population: 2 },
    text: "+2 к вместимости деревни",
  },
  {
    id: "workshop", name: "Мастерская", max: 1,
    cost: { wood: 80, stone: 20 },
    text: "открывает изготовление инструментов, топоров и луков",
  },
  {
    id: "storage", name: "Малое хранилище", max: 20,
    cost: { wood: 60, stone: 30 },
    effect: { storage: 1000 },
    text: "удваивает лимит каждого материального ресурса (суммируется)",
  },
  {
    id: "school", name: "Школа", max: 1,
    cost: { wood: 120, stone: 60 },
    requiresSage: true,
    unlockJobs: ["pupil"],
    effect: { wisdomRate: 1.5 },
    text: "производство мудрости x1.5; воспитанники дают усиленную мудрость",
  },
  {
    id: "tannery", name: "Кожевня", max: 1,
    cost: { wood: 60, stone: 10 },
    requiresResearch: "h_tan",
    text: "дубление кожи и писарское дело",
  },
  {
    id: "field", name: "Поле", max: 5,
    cost: { wood: 40 },
    requiresResearch: "c_farm",
    text: "позволяет назначать фермеров",
  },
  {
    id: "dryer", name: "Сушилка", max: 1,
    cost: { wood: 60, stone: 10 },
    requiresResearch: "c_dry",
    effect: { foodBoost: 1.5 },
    text: "охотники приносят еды x1.5",
  },
  {
    id: "pen", name: "Загон", max: 3,
    cost: { wood: 50, stone: 10 },
    requiresResearch: "c_sheep",
    text: "позволяет назначать пастухов",
  },
  {
    id: "mill", name: "Мельница", max: 1,
    cost: { wood: 150, stone: 80 },
    requiresResearch: "c_grind",
    text: "мельники мелют зерно в муку",
  },
  {
    id: "bakery", name: "Пекарня", max: 1,
    cost: { wood: 120, stone: 60 },
    requiresResearch: "c_bread",
    text: "пекари превращают муку в еду",
  },
  {
    id: "library", name: "Библиотека", max: 3,
    cost: { wood: 100, stone: 50 },
    requiresResearch: "t_books",
    effect: { wisdomCap: 1000, wisdomRateAdd: 0.05 },
    text: "+1000 к лимиту мудрости; +5% к производству мудрости",
  },
  {
    id: "tradingpost", name: "Торговый пост", max: 1,
    cost: { wood: 200, stone: 100 },
    requiresResearch: "c_trade",
    text: "торговцы начинают прибывать; открывается обмен вещами",
  },
];

const CRAFTS = [
  {
    id: "tools", name: "Инструменты",
    cost: { wood: 10, stone: 5 },
    requiresBuilding: "workshop",
    desc: "Повышают добычу шахтёров: производство умножается на 1 + 1.25 × (инструменты ÷ шахтёры). Расходуются: 1 на каждые 150 единиц камня (с «Ковкой» — на 600).",
  },
  {
    id: "axe", name: "Топор",
    cost: { wood: 12, stone: 4 },
    requiresBuilding: "workshop",
    desc: "Усиливает собирателей: производство умножается на 1 + 1.25 × (топоры ÷ собиратели). Расходуется: 1 на каждые 500 единиц дров.",
  },
  {
    id: "bow", name: "Лук",
    cost: { wood: 15, tendons: 2 },
    requiresBuilding: "workshop",
    unlockBy: "h_bones",
    desc: "Усиливает охотников: добыча умножается на 1 + 1.25 × (луки ÷ охотники). Расходуется: 1 на каждые 500 единиц еды. Требует сухожилия (Охотничье дело II).",
  },
  {
    id: "trap", name: "Ловушка",
    cost: { wood: 20, stone: 5 },
    requiresBuilding: "workshop",
    unlockBy: "h_traps",
    desc: "Защищает припасы от крыс; сработавшая ловушка приносит крысиный яд.",
  },
  {
    id: "grain", name: "Зерно из трав",
    cost: { herbs: 5 },
    unlockBy: "c_grain",
    desc: "Из собранных трав получается зерно для поля и мельницы.",
  },
  {
    id: "fertilizer", name: "Удобрение",
    cost: { bones: 2 },
    requiresBuilding: "mill",
    cap: 30,
    desc: "Кости мелются в костную муку на мельнице. Усиливает фермеров: производство умножается на 1 + 1.25 × (удобрение ÷ фермеры). Расходуется: 1 на каждые 500 единиц зерна.",
  },
  {
    id: "clothes", name: "Одежда",
    cost: { leather: 4 },
    requiresBuilding: "workshop",
    unlockBy: "c_sheep",
    cap: 40,
    desc: "Обычная одежда из кожи: частично спасает от замерзания зимой (эффективность 50%) и даёт небольшую защиту в экспедициях (+1 к обороне). Расходуется зимой.",
  },
  {
    id: "warmclothes", name: "Тёплая одежда",
    cost: { wool: 4 },
    requiresBuilding: "workshop",
    unlockBy: "c_sheep",
    cap: 40,
    desc: "Тёплая одежда из шерсти: хорошо спасает от замерзания зимой (эффективность 100%), но почти не защищает в экспедициях (+0.5 к обороне). Расходуется зимой первой.",
  },
  {
    id: "paper", name: "Бумага",
    cost: { herbs: 4 },
    unlockBy: "t_paper",
    desc: "Лёгкая основа для книг.",
  },
  {
    id: "book", name: "Книга",
    cost: { paper: 5, leather: 2, wisdom: 150 },
    unlockBy: "t_books",
    cap: 10,
    desc: "Не тратится. Каждая книга: +5% к мудрости и +100 к лимиту мудрости. Максимум 10 в сундуке.",
  },
  {
    id: "sword", name: "Меч",
    cost: { iron: 5, wood: 2 },
    requiresBuilding: "workshop",
    unlockBy: "m2",
    desc: "Ближнебойное оружие для экспедиций: +4 к силе отряда за меч.",
  },
  {
    id: "armor", name: "Броня",
    cost: { iron: 3, leather: 4 },
    requiresBuilding: "workshop",
    unlockBy: "m2",
    desc: "Защита для экспедиций: +3 к обороне отряда за броню, снижает потери.",
  },
  {
    id: "medkit", name: "Медикаменты",
    cost: { herbs: 3, ratpoison: 1 },
    unlockBy: "t_med",
    desc: "Набор лекаря: спасает раненого в экспедиции. Требует Медицину I.",
  },
];

const RESEARCHES = [
  {
    id: "m1", name: "Шахтёрское дело I", cost: 50, requires: null,
    desc: "Шахтёры со шансом находят уголь.",
    effect: { finds: [{ res: "coal", chance: 0.01 }] },
  },
  {
    id: "m_forge", name: "Ковка", cost: 300, requires: "m1",
    desc: "Упрочнение в горне: инструменты изнашиваются вчетверо медленнее (1 изнашивается за 600 единиц камня вместо 150).",
    effect: {},
  },
  {
    id: "m2", name: "Шахтёрское дело II", cost: 120, requires: "m1",
    desc: "Шанс найти железо и соль; чаще попадается уголь. Соль нужна сушилке для мяса.",
    effect: { finds: [{ res: "iron", chance: 0.005 }, { res: "salt", chance: 0.005 }, { res: "coal", chance: 0.01 }] },
  },
  {
    id: "m3", name: "Шахтёрское дело III", cost: 250, requires: "m2",
    desc: "Шанс найти серебро.",
    effect: { finds: [{ res: "silver", chance: 0.003 }] },
  },
  {
    id: "m4", name: "Шахтёрское дело IV", cost: 500, requires: "m3",
    desc: "Шанс найти золото.",
    effect: { finds: [{ res: "gold", chance: 0.002 }] },
  },
  {
    id: "m5", name: "Шахтёрское дело V", cost: 1000, requires: "m4",
    desc: "Шанс найти самоцветы.",
    effect: { finds: [{ res: "gems", chance: 0.001 }] },
  },
  {
    id: "m6", name: "Шахтёрское дело VI", cost: 2000, requires: "m5",
    desc: "Шанс найти селитру.",
    effect: { finds: [{ res: "saltpeter", chance: 0.002 }] },
  },
  {
    id: "m7", name: "Шахтёрское дело VII", cost: 4000, requires: "m6",
    desc: "Шанс найти серу.",
    effect: { finds: [{ res: "sulfur", chance: 0.002 }] },
  },
  {
    id: "h1", name: "Охотничье дело I", cost: 50, requires: null,
    desc: "Охотники приносят шкуры и кости.",
    effect: { hunterFinds: [{ res: "skins", chance: 0.02 }, { res: "bones", chance: 0.02 }] },
  },
  {
    id: "h2", name: "Охотничье дело II", cost: 250, requires: "h1",
    desc: "Охотники приносят сухожилия — основу для тетивы луков.",
    effect: { hunterFinds: [{ res: "tendons", chance: 0.02 }] },
  },
  {
    id: "h_tan", name: "Дубление", cost: 120, requires: "h1",
    desc: "Открывает профессию Кожевник (шкуры + травы → кожа). Строится кожевня.",
    effect: {},
  },
  {
    id: "h_bones", name: "Обработка костей", cost: 200, requires: "h_tan",
    desc: "Открывает ремесло «Лук» (нужны сухожилия с «Охотничьего дела II»).",
    effect: { unlockCrafts: ["bow"] },
  },
  {
    id: "h_herbs", name: "Сбор трав", cost: 150, requires: "h1",
    desc: "Открывает профессию Травник; собиратели тоже приносят травы.",
    effect: { gathererExtra: { herbs: 0.1 } },
  },
  {
    id: "h_traps", name: "Ловушки", cost: 250, requires: "h_bones",
    desc: "Открывает ремесло «Ловушка»; ловушки защищают от крыс и дают яд.",
    effect: { unlockCrafts: ["trap"] },
  },
  {
    id: "c_build", name: "Улучшенное строительство", cost: 300, requires: null,
    desc: "Открывает улучшение хижин (вместимость 2 → 5) и постройку поля.",
    effect: {},
  },
  {
    id: "c_farm", name: "Фермерство", cost: 500, requires: "c_build",
    desc: "Поле и фермеры: хлебная цепочка даёт больше еды за тик, чем охота, но только в тёплые сезоны и с поправкой на культуру. Зимой поле спит.",
    effect: {},
  },
  {
    id: "c_dry", name: "Сушка мяса", cost: 400, requires: "c_build",
    desc: "Сушилка: охотники приносят еды в полтора раза больше. Работа сушилки требует соль (шахтёры добывают её со «Шахтёрского дела II»).",
    effect: {},
  },
  {
    id: "c_grain", name: "Зерноводство", cost: 600, requires: "c_farm",
    desc: "Открывает ремесло «Зерно из трав».",
    effect: { unlockCrafts: ["grain"] },
  },
  {
    id: "c_sheep", name: "Приручение овец", cost: 800, requires: "c_farm",
    desc: "Загон, пастухи, шерсть и одежда из шерсти.",
    effect: { unlockCrafts: ["clothes"] },
  },
  {
    id: "c_dog", name: "Одомашнивание собак", cost: 1000, requires: "c_sheep",
    desc: "Редкий шанс приручить собаку на охоте; собаки защищают деревню от волков и медведей.",
    effect: { hunterFinds: [{ res: "dogs", chance: 0.001 }] },
  },
  {
    id: "c_wheel", name: "Колесо", cost: 1200, requires: "c_grain",
    desc: "Шаг к механизации: без колеса нет мельницы.",
    effect: {},
  },
  {
    id: "c_grind", name: "Помол", cost: 1500, requires: "c_wheel",
    desc: "Мельница и мельники: зерно превращается в муку.",
    effect: {},
  },
  {
    id: "c_bread", name: "Хлебопечение", cost: 2000, requires: "c_grind",
    desc: "Пекарня и пекари: мука становится сытной едой.",
    effect: {},
  },
  {
    id: "c_trade", name: "Торговое дело", cost: 1500, requires: "c_build",
    desc: "Новый уровень строительства: торговый пост, куда прибывают караваны.",
    effect: {},
  },
  {
    id: "t_write", name: "Письменность", cost: 800, requires: null,
    desc: "Деревня учится записывать знание.",
    effect: {},
  },
  {
    id: "t_parch", name: "Пергамент и свитки", cost: 1000, requires: "t_write",
    desc: "Открывает профессию Писарь: кожа превращается в свитки; свитки усиливают мудрость и лимит мудрости.",
    effect: {},
  },
  {
    id: "t_paper", name: "Изготовление бумаги", cost: 1500, requires: "t_write",
    merchantOnly: true,
    desc: "Нигде не изучается сама по себе — знание продают только торговцы.",
    effect: { unlockCrafts: ["paper"] },
  },
  {
    id: "t_books", name: "Книги", cost: 2500, requires: "t_paper",
    desc: "Открывает ремесло «Книга» и постройку библиотек: книги и библиотеки поднимают лимит мудрости.",
    effect: { unlockCrafts: ["book"] },
  },
  {
    id: "t_med", name: "Медицина I", cost: 600, requires: "h_herbs",
    desc: "Открывает ремесло «Медикаменты» из трав и крысиного яда.",
    effect: { unlockCrafts: ["medkit"] },
  },
  {
    id: "t_history", name: "История", cost: 1200, requires: "c_trade",
    desc: "Шаг к чтению древних книг, найденных в руинах.",
    effect: {},
  },
  {
    id: "t_translate", name: "Перевод древних текстов", cost: 2000, requires: "t_history",
    desc: "Позволяет прочесть древние книги: каждая даёт деревне мудрость.",
    effect: {},
  },
  {
    id: "t_powder", name: "Порох", cost: 4000, requires: "m7",
    desc: "Селитра, сера и уголь — шаг к огнестрельному оружию. Мушкеты продают торговцы.",
    effect: {},
  },
];

const TRADES = [
  { id: "tools",   name: "Инструменты", variants: [{ gold: 5 }, { silver: 12 }, { stone: 40 }] },
  { id: "axe",     name: "Топор",       variants: [{ gold: 3 }, { silver: 8 }, { wood: 30 }] },
  { id: "bow",     name: "Лук",         variants: [{ gold: 4 }, { silver: 10 }, { skins: 5 }] },
  { id: "clothes", name: "Одежда",      variants: [{ gold: 8 }, { silver: 20 }, { leather: 4 }] },
  { id: "iron",    name: "Железо",      variants: [{ gold: 2 }, { silver: 5 }, { food: 30 }] },
  { id: "grain",   name: "Зерно",       variants: [{ gold: 1 }, { silver: 2 }, { food: 15 }] },
  { id: "paper",   name: "Бумага",      variants: [{ gold: 2 }, { silver: 4 }, { herbs: 10 }] },
  { id: "research:t_paper", name: "Знание: изготовление бумаги", variants: [{ gold: 15 }, { silver: 30 }] },
  { id: "musket",  name: "Мушкет",     variants: [{ gold: 25 }, { silver: 50 }] },
  { id: "rice",    name: "Рис посевной", variants: [{ gold: 10 }, { silver: 20 }] },
  { id: "sword",   name: "Меч",        variants: [{ gold: 12 }, { silver: 25 }] },
];

const GEAR = {
  bow:     { name: "Луки",        attack: 3 },
  sword:   { name: "Мечи",        attack: 4 },
  musket:  { name: "Мушкеты",     attack: 8 },
  armor:   { name: "Броня",       defence: 3 },
  medkit:  { name: "Медикаменты", heal: 1 },
  clothes: { name: "Одежда",      defence: 1 },
  warmclothes: { name: "Тёплая одежда", defence: 0.5 },
};

const CULTURE_BUILDINGS = [
  { id: "townhall",  name: "Ратуша",          cost: 80,  morale: 5,  max: 1 },
  { id: "temple",    name: "Храм",            cost: 150, morale: 10, max: 1 },
  { id: "monument",  name: "Памятник",        cost: 60,  morale: 5,  max: 3 },
  { id: "garden",    name: "Сад",             cost: 40,  morale: 3,  max: 2 },
  { id: "village2",  name: "Вторая деревня",  cost: 400, morale: 0,  max: 1 },
];

const SEASONS = [
  { name: "Весна", foodMult: 1,   woodBurn: 0.015,  clothesUse: 0 },
  { name: "Лето",  foodMult: 0.9, woodBurn: 0.0075, clothesUse: 0 },
  { name: "Осень", foodMult: 1.1, woodBurn: 0.03,  clothesUse: 0.2 },
  { name: "Зима",  foodMult: 1.4, woodBurn: 0.06,  clothesUse: 1 },
];

const EVENTS = [
  {
    id: "wanderer",
    interval: 10,
    chance: () => Math.min(0.9, 0.3 * Math.max(0, popCap() - state.pop)),
    effect: () => addPopulation(1),
  },
  {
    id: "ratpack",
    text: "Стая крыс утащила часть припасов.",
    interval: 15, chance: 0.35,
    effect: () => {
      if (state.res.trap > 0) {
        state.res.ratpoison += Math.min(2, state.res.trap);
        addMoraleBoost(5, 2);
        return "ev.rats_traps";
      }
      const loss = Math.floor(state.res.food * 0.15);
      state.res.food = Math.max(0, state.res.food - loss);
      state._evLoss = loss;
      return "ev.rats";
    },
  },
  {
    id: "wolves",
    interval: 12, chance: 0.25,
    effect: () => {
      const dogs = state.res.dogs || 0;
      if (dogs > 0) {
        addMoraleBoost(5, 2);
        if (Math.random() < 0.3) {
          state.res.dogs--;
          logLine(T("msg.ev.dog_lost"));
        }
        if (Math.random() < 0.25 * (1 - Math.min(0.9, dogs * 0.15)) && state.pop > 1) {
          state.pop--;
          return "ev.wolves_villager";
        }
        return "ev.wolves_ok";
      }
      const loss = Math.floor(state.res.food * 0.35);
      state.res.food = Math.max(0, state.res.food - loss);
      state._evLoss = loss;
      if (Math.random() < 0.25 && state.pop > 1) {
        state.pop--;
        return "ev.wolves_villager";
      }
      return "ev.wolves_bad";
    },
  },
  {
    id: "bears",
    interval: 20, chance: 0.18,
    effect: () => {
      const dogs = state.res.dogs || 0;
      const prot = Math.min(0.6, dogs * 0.07);
      if (dogs > 0 && Math.random() < 0.5) {
        state.res.dogs--;
        logLine(T("msg.ev.dog_lost"));
      }
      if (Math.random() < 0.4 * (1 - prot) && state.pop > 1) {
        state.pop--;
        return "ev.bears";
      }
      return "ev.bears_ok";
    },
  },
  {
    id: "merchants",
    interval: 8,
    chance: () => ((state.built.tradingpost || 0) > 0 ? 0.4 : 0),
    effect: () => {
      state.marketUntil = state.day + 3;
      return "ev.merchants";
    },
  },
];

const CONFIG = {
  startingPopulation: 2,
  dayLengthSec: 10,     
  foodPerVillager: 0.08, 
  starveCheckDays: 5,    
  farmSeasonMult: { spring: 1, summer: 1.2, autumn: 0.9, winter: 0 },
  riceSummerMult: 1.4,   
  baseStorage: 1000,     
  wisdomForSage: 50,     
  sageChance: 0.3,       
  wisdomForResearch: 250,
  baseWisdomCap: 1000,   
  madnessChance: 0.12,   
  toolCostPerUnit: 150,  
  toolCostPerUnitForged: 600,  
  seasonLengthDays: 90, 
  hutUpgradeBonus: 3,
  hutUpgradeCost: { wood: 80, stone: 20 },
  baseMorale: 30,        
  moralePerWorker: 0.5,  
  moralePerWorkerCap: 10,
  culturePerLevel: 5,    
  culturePerDay: 5,      
  expeditionFoodPerPerson: 0.5, 
  expeditionFoodPerWeight: 0.2, 
  ruinPowerPerLevel: 5,  
  saveKey: "pepel-save-v1",
};





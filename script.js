const PITY_LIMIT = 15;

const rarityCfg = {
  "Обычный ⭐": { chance: 60, color: "var(--common)" },
  "Редкий ⭐⭐": { chance: 25, color: "var(--rare)" },
  "Эпик ⭐⭐⭐": { chance: 10, color: "var(--epic)" },
  "Легендарный ⭐⭐⭐⭐": { chance: 5, color: "var(--legendary)" }
};

const agents = {
  Jett:"Эпик ⭐⭐⭐", Reyna:"Эпик ⭐⭐⭐", Phoenix:"Обычный ⭐",
  Neon:"Редкий ⭐⭐", Raze:"Редкий ⭐⭐", Yoru:"Легендарный ⭐⭐⭐⭐",
  Iso:"Эпик ⭐⭐⭐", Sova:"Обычный ⭐", Skye:"Редкий ⭐⭐",
  Breach:"Обычный ⭐", Fade:"Эпик ⭐⭐⭐", Gekko:"Редкий ⭐⭐",
  "KAY/O":"Эпик ⭐⭐⭐", Omen:"Редкий ⭐⭐", Brimstone:"Обычный ⭐",
  Viper:"Легендарный ⭐⭐⭐⭐", Astra:"Легендарный ⭐⭐⭐⭐",
  Harbor:"Эпик ⭐⭐⭐", Clove:"Легендарный ⭐⭐⭐⭐",
  Sage:"Редкий ⭐⭐", Cypher:"Обычный ⭐",
  Killjoy:"Легендарный ⭐⭐⭐⭐", Chamber:"Эпик ⭐⭐⭐",
  Deadlock:"Редкий ⭐⭐"
};

const roles = {
  "Все": Object.keys(agents),
  "Дуэлянты": ["Jett","Phoenix","Reyna","Neon","Raze","Yoru","Iso"],
  "Инициаторы": ["Sova","Skye","Breach","Fade","Gekko","KAY/O"],
  "Контроллеры": ["Omen","Brimstone","Viper","Astra","Harbor","Clove"],
  "Стражи": ["Sage","Cypher","Killjoy","Chamber","Deadlock"]
};

let state = JSON.parse(localStorage.getItem("save")) || {
  rolls: 0,
  pity: 0,
  history: []
};

let role = "Все";
let rolling = false;

const result = document.getElementById("result");
const card = document.getElementById("card");
const stats = document.getElementById("stats");
const history = document.getElementById("history");
const rollBtn = document.getElementById("rollBtn");
const rolesDiv = document.getElementById("roles");

Object.keys(roles).forEach(r => {
  const b = document.createElement("button");
  b.textContent = r;
  if (r === "Все") b.classList.add("active");
  b.onclick = () => {
    if (rolling) return;
    role = r;
    [...rolesDiv.children].forEach(x => x.classList.remove("active"));
    b.classList.add("active");
  };
  rolesDiv.appendChild(b);
});

function pickRarity() {
  if (state.pity >= PITY_LIMIT) return "Легендарный ⭐⭐⭐⭐";
  let roll = Math.random() * 100, acc = 0;
  for (let r in rarityCfg) {
    acc += rarityCfg[r].chance;
    if (roll <= acc) return r;
  }
  return "Обычный ⭐";
}

function rollAgent() {
  if (rolling) return;
  rolling = true;
  rollBtn.disabled = true;
  card.classList.remove("legendary");

  let i = 0;
  const anim = setInterval(() => {
    result.textContent = roles[role][Math.random() * roles[role].length | 0];
    if (++i > 18) {
      clearInterval(anim);
      finish();
    }
  }, 60);
}

function finish() {
  state.rolls++;
  state.pity++;

  const rarity = pickRarity();
  const pool = roles[role].filter(a => agents[a] === rarity);
  const agent = (pool.length ? pool : roles[role])[Math.random() * (pool.length || roles[role].length) | 0];

  result.textContent = agent + "\n" + rarity;
  result.style.color = rarityCfg[rarity].color;

  if (rarity.includes("⭐⭐⭐⭐")) {
    state.pity = 0;
    card.classList.add("legendary");
  }

  state.history.unshift(`${agent} (${rarity})`);
  state.history = state.history.slice(0, 5);

  localStorage.setItem("save", JSON.stringify(state));
  updateUI();

  rolling = false;
  rollBtn.disabled = false;
}

function updateUI() {
  stats.textContent = `Роллы: ${state.rolls} | Pity: ${state.pity}/${PITY_LIMIT}`;
  history.textContent = state.history.length
    ? "История:\n" + state.history.join("\n")
    : "История пуста";
}

rollBtn.onclick = rollAgent;
updateUI();

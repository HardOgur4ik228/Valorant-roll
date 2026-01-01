/* ===== CANVAS ===== */
const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");
function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

/* ===== DATA ===== */
const PITY_LIMIT = 15;

const rarityCfg = {
  "Обычный ⭐": { chance:60, color:"#b0b0b0", fx:20 },
  "Редкий ⭐⭐": { chance:25, color:"#4da6ff", fx:40 },
  "Эпик ⭐⭐⭐": { chance:10, color:"#b84dff", fx:70 },
  "Легендарный ⭐⭐⭐⭐": { chance:5, color:"#ffd700", fx:140 }
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
  "Все":Object.keys(agents),
  "Дуэлянты":["Jett","Phoenix","Reyna","Neon","Raze","Yoru","Iso"],
  "Инициаторы":["Sova","Skye","Breach","Fade","Gekko","KAY/O"],
  "Контроллеры":["Omen","Brimstone","Viper","Astra","Harbor","Clove"],
  "Стражи":["Sage","Cypher","Killjoy","Chamber","Deadlock"]
};

/* ===== STATE ===== */
let state = JSON.parse(localStorage.getItem("save")) || {
  rolls:0,
  pity:0,
  history:[],
  achievements:{},
  lastDaily:0
};

let role = "Все";
let rolling = false;

/* ===== UI ===== */
const result = document.getElementById("result");
const card = document.getElementById("card");
const stats = document.getElementById("stats");
const history = document.getElementById("history");
const ach = document.getElementById("achievements");

const rollBtn = document.getElementById("roll");
const roll10Btn = document.getElementById("roll10");
const dailyBtn = document.getElementById("daily");
const resetBtn = document.getElementById("reset");
const rolesDiv = document.getElementById("roles");

/* ===== ROLES UI ===== */
Object.keys(roles).forEach(r=>{
  const b = document.createElement("button");
  b.textContent = r;
  if(r==="Все") b.classList.add("active");
  b.onclick = ()=>{
    if(rolling) return;
    role = r;
    [...rolesDiv.children].forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
  };
  rolesDiv.appendChild(b);
});

/* ===== PARTICLES ===== */
let particles = [];
function spawn(x,y,color,count){
  for(let i=0;i<count;i++){
    particles.push({
      x,y,
      vx:(Math.random()-0.5)*12,
      vy:(Math.random()-0.5)*12,
      life:80,
      size:Math.random()*4+2,
      color
    });
  }
}

function fxLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles = particles.filter(p=>{
    p.x+=p.vx;
    p.y+=p.vy;
    p.vy+=0.15;
    p.life--;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x,p.y,p.size,p.size);
    return p.life>0;
  });
  requestAnimationFrame(fxLoop);
}
fxLoop();

/* ===== LOGIC ===== */
function pickRarity(){
  if(state.pity >= PITY_LIMIT) return "Легендарный ⭐⭐⭐⭐";
  let r = Math.random()*100, a=0;
  for(let k in rarityCfg){
    a+=rarityCfg[k].chance;
    if(r<=a) return k;
  }
  return "Обычный ⭐";
}

function rollOnce(){
  state.rolls++;
  state.pity++;

  const rarity = pickRarity();
  const pool = roles[role].filter(a=>agents[a]===rarity);
  const list = pool.length ? pool : roles[role];
  const agent = list[Math.random()*list.length|0];

  result.textContent = agent + "\n" + rarity;
  result.style.color = rarityCfg[rarity].color;

  spawn(innerWidth/2, innerHeight/2, rarityCfg[rarity].color, rarityCfg[rarity].fx);

  if(rarity.includes("⭐⭐⭐⭐")){
    state.pity = 0;
    card.classList.add("legendary");
    document.body.classList.add("shake");
    setTimeout(()=>document.body.classList.remove("shake"),300);
  } else {
    card.classList.remove("legendary");
  }

  state.history.unshift(`${agent} (${rarity})`);
  state.history = state.history.slice(0,5);

  checkAchievements();
  save();
  updateUI();
}

rollBtn.onclick = ()=>{
  if(rolling) return;
  rolling = true;
  rollOnce();
  setTimeout(()=>rolling=false,300);
};

roll10Btn.onclick = async ()=>{
  if(rolling) return;
  rolling = true;
  for(let i=0;i<10;i++){
    rollOnce();
    await new Promise(r=>setTimeout(r,120));
  }
  rolling = false;
};

dailyBtn.onclick = ()=>{
  const now = Date.now();
  if(now - state.lastDaily < 86400000){
    alert("Daily уже был");
    return;
  }
  state.lastDaily = now;
  state.pity = PITY_LIMIT - 1;
  alert("Daily активирован");
  save();
};

resetBtn.onclick = ()=>{
  if(confirm("Стереть всё?")){
    localStorage.clear();
    location.reload();
  }
};

/* ===== ACHIEVEMENTS ===== */
function unlock(name){
  if(state.achievements[name]) return;
  state.achievements[name]=true;
}

function checkAchievements(){
  if(state.rolls>=10) unlock("Новичок");
  if(state.rolls>=50) unlock("Гача-зависимый");
  if(state.history.some(h=>h.includes("⭐⭐⭐⭐"))) unlock("Легенда");
}

/* ===== SAVE / UI ===== */
function save(){
  localStorage.setItem("save", JSON.stringify(state));
}

function updateUI(){
  stats.textContent = `Роллы: ${state.rolls} | Pity: ${state.pity}/${PITY_LIMIT}`;
  history.textContent = state.history.length ? "История:\n"+state.history.join("\n") : "История пуста";
  ach.textContent = "Ачивки:\n" + Object.keys(state.achievements).join("\n");
}
updateUI();

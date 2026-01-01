const PITY_LIMIT = 15;
const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");
resize();
window.addEventListener("resize", resize);

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

/* ---------- AUDIO ---------- */
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
function beep(freq, dur=0.1){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value=freq;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+dur);
  o.stop(audioCtx.currentTime+dur);
}

/* ---------- DATA ---------- */
const rarityCfg={
  "Обычный ⭐":{chance:60,color:"#b0b0b0",fx:20},
  "Редкий ⭐⭐":{chance:25,color:"#4da6ff",fx:35},
  "Эпик ⭐⭐⭐":{chance:10,color:"#b84dff",fx:60},
  "Легендарный ⭐⭐⭐⭐":{chance:5,color:"#ffd700",fx:120}
};

const agents={Jett:"Эпик ⭐⭐⭐",Reyna:"Эпик ⭐⭐⭐",Phoenix:"Обычный ⭐",
Neon:"Редкий ⭐⭐",Raze:"Редкий ⭐⭐",Yoru:"Легендарный ⭐⭐⭐⭐",
Iso:"Эпик ⭐⭐⭐",Sova:"Обычный ⭐",Skye:"Редкий ⭐⭐",
Breach:"Обычный ⭐",Fade:"Эпик ⭐⭐⭐",Gekko:"Редкий ⭐⭐",
"KAY/O":"Эпик ⭐⭐⭐",Omen:"Редкий ⭐⭐",Brimstone:"Обычный ⭐",
Viper:"Легендарный ⭐⭐⭐⭐",Astra:"Легендарный ⭐⭐⭐⭐",
Harbor:"Эпик ⭐⭐⭐",Clove:"Легендарный ⭐⭐⭐⭐",
Sage:"Редкий ⭐⭐",Cypher:"Обычный ⭐",
Killjoy:"Легендарный ⭐⭐⭐⭐",Chamber:"Эпик ⭐⭐⭐",
Deadlock:"Редкий ⭐⭐"};

const roles={
  "Все":Object.keys(agents),
  "Дуэлянты":["Jett","Phoenix","Reyna","Neon","Raze","Yoru","Iso"],
  "Инициаторы":["Sova","Skye","Breach","Fade","Gekko","KAY/O"],
  "Контроллеры":["Omen","Brimstone","Viper","Astra","Harbor","Clove"],
  "Стражи":["Sage","Cypher","Killjoy","Chamber","Deadlock"]
};

let state=JSON.parse(localStorage.getItem("save"))||{rolls:0,pity:0,history:[]};
let role="Все",rolling=false;

/* ---------- UI ---------- */
const result=document.getElementById("result");
const card=document.getElementById("card");
const stats=document.getElementById("stats");
const history=document.getElementById("history");
const rollBtn=document.getElementById("rollBtn");
const rolesDiv=document.getElementById("roles");

Object.keys(roles).forEach(r=>{
  const b=document.createElement("button");
  b.textContent=r;
  if(r==="Все") b.classList.add("active");
  b.onclick=()=>{if(!rolling){role=r;[...rolesDiv.children].forEach(x=>x.classList.remove("active"));b.classList.add("active");}};
  rolesDiv.appendChild(b);
});

/* ---------- PARTICLES ---------- */
let particles=[];
function spawn(x,y,color,count){
  for(let i=0;i<count;i++){
    particles.push({
      x,y,
      vx:(Math.random()-0.5)*8,
      vy:(Math.random()-0.5)*8,
      life:60,
      color
    });
  }
}

function updateFX(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles=particles.filter(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life--;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x,p.y,3,3);
    return p.life>0;
  });
  requestAnimationFrame(updateFX);
}
updateFX();

/* ---------- LOGIC ---------- */
function pickRarity(){
  if(state.pity>=PITY_LIMIT) return "Легендарный ⭐⭐⭐⭐";
  let r=Math.random()*100,a=0;
  for(let k in rarityCfg){a+=rarityCfg[k].chance;if(r<=a)return k;}
  return "Обычный ⭐";
}

rollBtn.onclick=()=>{
  if(rolling) return;
  audioCtx.resume();
  rolling=true;
  rollBtn.disabled=true;
  card.classList.remove("legendary");
  card.classList.add("shake");

  let i=0;
  const anim=setInterval(()=>{
    result.textContent=roles[role][Math.random()*roles[role].length|0];
    beep(300+i*10,0.03);
    if(++i>18){clearInterval(anim);finish();}
  },60);
};

function finish(){
  card.classList.remove("shake");
  state.rolls++; state.pity++;

  const rarity=pickRarity();
  const pool=roles[role].filter(a=>agents[a]===rarity);
  const agent=(pool.length?pool:roles[role])[Math.random()*(pool.length||roles[role].length)|0];

  result.textContent=agent+"\n"+rarity;
  result.style.color=rarityCfg[rarity].color;

  spawn(innerWidth/2,innerHeight/2,rarityCfg[rarity].color,rarityCfg[rarity].fx);
  beep(rarity.includes("⭐⭐⭐⭐")?120:600,0.2);

  if(rarity.includes("⭐⭐⭐⭐")){
    state.pity=0;
    card.classList.add("legendary");
  }

  state.history.unshift(`${agent} (${rarity})`);
  state.history=state.history.slice(0,5);
  localStorage.setItem("save",JSON.stringify(state));
  updateUI();

  rolling=false;
  rollBtn.disabled=false;
}

function updateUI(){
  stats.textContent=`Роллы: ${state.rolls} | Pity: ${state.pity}/${PITY_LIMIT}`;
  history.textContent=state.history.length?"История:\n"+state.history.join("\n"):"История пуста";
}
updateUI();

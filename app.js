// ===== TELEGRAM INIT =====
const tg = window.Telegram.WebApp;
tg.expand();

// ===== GAME STATE =====
let state = JSON.parse(localStorage.getItem("game")) || {
  balance: 0,
  hash: 0,
  adsToday: 0,
  lastAdDate: null
};

// ===== USERNAME =====
document.getElementById("username").innerText =
  tg.initDataUnsafe?.user?.username || "Guest Miner";

// ===== CONSTANTS =====
const HASH_COEF = 0.1;
const MAX_ADS_PER_DAY = 20;

// ===== GAME LOOP =====
setInterval(() => {
  state.balance += state.hash * HASH_COEF;
  save();
  renderStats();
}, 1000);

// ===== SAVE / LOAD =====
function save() {
  localStorage.setItem("game", JSON.stringify(state));
}

// ===== RENDER =====
function renderStats() {
  document.getElementById("balance").innerText = state.balance.toFixed(2);
  document.getElementById("hash").innerText = state.hash.toFixed(2);
  document.getElementById("income").innerText =
    (state.hash * HASH_COEF).toFixed(2);
}

// ===== SCREENS =====
function openScreen(screen) {
  const s = document.getElementById("screen");

  if (screen === "main") {
    s.innerHTML = `<p>Добро пожаловать в Hash Mining Idle.</p>`;
  }

  if (screen === "shop") {
    s.innerHTML = `
      <h3>🛒 Магазин видеокарт</h3>
      <button onclick="buy(50, 1)">GTX 1050 (+1 Hash) — 50 HC</button>
      <button onclick="buy(300, 6)">RTX 3060 (+6 Hash) — 300 HC</button>
      <button onclick="buy(2000, 50)">RTX 4090 (+50 Hash) — 2000 HC</button>
    `;
  }

  if (screen === "ads") {
    s.innerHTML = `
      <h3>📺 Реклама</h3>
      <p>Просмотров сегодня: ${state.adsToday}/${MAX_ADS_PER_DAY}</p>
      <button onclick="watchAd()">Смотреть рекламу (+0.01 Hash)</button>
    `;
  }

  if (screen === "refs") {
    s.innerHTML = `
      <h3>👥 Рефералы</h3>
      <p>В будущем: реферальная система</p>
    `;
  }

  if (screen === "profile") {
    s.innerHTML = `
      <h3>⚙️ Профиль</h3>
      <p>Total Hash: ${state.hash.toFixed(2)}</p>
      <button onclick="reset()">Сбросить прогресс</button>
    `;
  }
}

// ===== ACTIONS =====
function buy(price, hash) {
  if (state.balance >= price) {
    state.balance -= price;
    state.hash += hash;
    save();
    renderStats();
  } else {
    alert("Недостаточно HashCoin");
  }
}

function watchAd() {
  const today = new Date().toDateString();

  if (state.lastAdDate !== today) {
    state.adsToday = 0;
    state.lastAdDate = today;
  }

  if (state.adsToday >= MAX_ADS_PER_DAY) {
    alert("Лимит рекламы на сегодня");
    return;
  }

  // здесь будет реальный рекламный SDK
  state.adsToday++;
  state.hash += 0.01;

  save();
  renderStats();
  openScreen("ads");
}

function reset() {
  if (confirm("Точно сбросить прогресс?")) {
    localStorage.removeItem("game");
    location.reload();
  }
}

// ===== START =====
renderStats();
openScreen("main");

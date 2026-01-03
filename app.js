const tg = window.Telegram.WebApp;
tg.expand();

/* ======================
   STATE
====================== */
let state = JSON.parse(localStorage.getItem("grokGame")) || {
  balance: 0,
  hash: 0,
  totalEarned: 0,
  adsWatched: 0
};

/* ======================
   USER
====================== */
const username =
  tg.initDataUnsafe?.user?.username ||
  tg.initDataUnsafe?.user?.first_name ||
  "Guest";

document.getElementById("username").innerText = username;

/* ======================
   CONSTANTS (временно)
====================== */
const HASH_COEF = 0.1;

/* ======================
   GAME LOOP
====================== */
setInterval(() => {
  const income = state.hash * HASH_COEF;
  state.balance += income;
  state.totalEarned += income;
  save();
  renderStats();
}, 1000);

/* ======================
   SAVE / RENDER
====================== */
function save() {
  localStorage.setItem("grokGame", JSON.stringify(state));
}

function renderStats() {
  document.getElementById("balance").innerText = state.balance.toFixed(3);
  document.getElementById("hash").innerText = state.hash.toFixed(3);
  document.getElementById("income").innerText =
    (state.hash * HASH_COEF).toFixed(3);
}

/* ======================
   NAV
====================== */
function openScreen(screen, btn) {
  document
    .querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const s = document.getElementById("screen");

  /* ===== BALANCE ===== */
  if (screen === "balance") {
    s.innerHTML = `
      <h3>💰 Баланс Grok</h3>
      <p>Доступно: <b>${state.balance.toFixed(3)} GRK</b></p>

      <button onclick="deposit()">➕ Пополнить</button>
      <button class="small" onclick="withdraw()">➖ Вывести</button>

      <p style="margin-top:12px; font-size:13px; opacity:0.8;">
        Вывод и пополнение работают через TON (в разработке)
      </p>
    `;
  }

  /* ===== SHOP ===== */
  if (screen === "shop") {
    s.innerHTML = `
      <h3>🛒 Видеокарты</h3>
      <button onclick="buy(100, 0.1)">GTX 1050 — +0.1 Hash</button>
      <button onclick="buy(300, 0.3)">GTX 1660 — +0.3 Hash</button>
      <button onclick="buy(800, 1)">RTX 3060 — +1 Hash</button>
      <button onclick="buy(2500, 4)">RTX 3080 — +4 Hash</button>
      <button onclick="buy(8000, 12)">RTX 4090 — +12 Hash</button>
    `;
  }

  /* ===== ADS ===== */
  if (screen === "ads") {
    s.innerHTML = `
      <h3>📺 Реклама</h3>
      <p>Просмотрено: ${state.adsWatched}</p>
      <button onclick="watchAd()">Смотреть рекламу</button>
    `;
  }

  /* ===== ACCOUNT ===== */
  if (screen === "account") {
    s.innerHTML = `
      <h3>👤 Аккаунт</h3>
      <p>Ник: <b>${username}</b></p>
      <p>⚡ Hash Power: ${state.hash.toFixed(3)}</p>
      <p>💰 Всего заработано: ${state.totalEarned.toFixed(3)} GRK</p>
      <p>📺 Просмотров рекламы: ${state.adsWatched}</p>
    `;
  }
}

/* ======================
   ACTIONS
====================== */
function buy(price, hash) {
  if (state.balance >= price) {
    state.balance -= price;
    state.hash += hash;
    save();
    renderStats();
  } else {
    alert("Недостаточно Grok");
  }
}

function watchAd() {
  state.hash += 0.02; // временно
  state.adsWatched++;
  save();
  renderStats();
  openScreen("ads", document.querySelectorAll(".bottom-nav button")[2]);
}

function deposit() {
  alert("Пополнение через TON Wallet (будет подключено)");
}

function withdraw() {
  alert("Вывод доступен при минимальной сумме (будет подключено)");
}

/* ======================
   START
====================== */
renderStats();
openScreen("balance", document.querySelector(".bottom-nav button.active"));

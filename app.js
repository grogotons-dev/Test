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
   CONSTANTS
====================== */
const HASH_TO_GRK = 0.1; // 1 Hash = 0.1 GRK / sec

/* ======================
   SHOP DATA
====================== */
const shopItems = [
  { name: "GTX 1050", price: 100, hash: 0.1 },
  { name: "GTX 1660", price: 300, hash: 0.3 },
  { name: "RTX 3060", price: 800, hash: 1.0 },
  { name: "RTX 3080", price: 2500, hash: 4.0 },
  { name: "RTX 4090", price: 8000, hash: 12.0 }
];

/* ======================
   GAME LOOP
====================== */
setInterval(() => {
  const income = state.hash * HASH_TO_GRK;
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
    (state.hash * HASH_TO_GRK).toFixed(3);
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
    `;
  }

  /* ===== SHOP ===== */
  if (screen === "shop") {
    let html = `<h3>🛒 Видеокарты</h3>`;

    shopItems.forEach((item, index) => {
      const income = item.hash * HASH_TO_GRK;

      html += `
        <div class="shop-card">
          <h4>${item.name}</h4>
          <p>💰 Цена: ${item.price} GRK</p>
          <p>⚡ Hash Power: +${item.hash}</p>
          <p>📈 Доход: +${income.toFixed(3)} GRK / сек</p>
          <button onclick="buy(${index})">Купить</button>
        </div>
      `;
    });

    s.innerHTML = html;
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
function buy(index) {
  const item = shopItems[index];

  if (state.balance >= item.price) {
    state.balance -= item.price;
    state.hash += item.hash;
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
  alert("Пополнение через TON Wallet (в разработке)");
}

function withdraw() {
  alert("Вывод через TON Wallet (в разработке)");
}

/* ======================
   START
====================== */
renderStats();
openScreen("balance", document.querySelector(".bottom-nav button.active"));

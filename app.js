const tg = window.Telegram.WebApp;
tg.expand();

/* =====================
   STATE
===================== */
let state = JSON.parse(localStorage.getItem("grokGame")) || {
  balance: 0,
  cards: [],
  lastAdDay: null,
  adsToday: 0
};

/* =====================
   USER
===================== */
const username =
  tg.initDataUnsafe?.user?.username ||
  tg.initDataUnsafe?.user?.first_name ||
  "Guest";

document.getElementById("username").innerText = username;

/* =====================
   CONSTANTS
===================== */
const GRK_PER_AD = 15;
const ADS_LIMIT = 20;

/* =====================
   SHOP (15 days ROI)
===================== */
const shopItems = [
  {
    name: "GTX 1050",
    price: 1000,
    incomePerSec: 66.6 / 86400
  },
  {
    name: "GTX 1660",
    price: 3000,
    incomePerSec: 200 / 86400
  },
  {
    name: "RTX 3060",
    price: 8000,
    incomePerSec: 533 / 86400
  },
  {
    name: "RTX 4090",
    price: 30000,
    incomePerSec: 2000 / 86400
  }
];

/* =====================
   GAME LOOP
===================== */
setInterval(() => {
  let income = 0;
  state.cards.forEach(c => income += c.incomePerSec);
  state.balance += income;
  save();
  renderStats();
}, 1000);

/* =====================
   SAVE / RENDER
===================== */
function save() {
  localStorage.setItem("grokGame", JSON.stringify(state));
}

function renderStats() {
  const income =
    state.cards.reduce((s, c) => s + c.incomePerSec, 0);

  document.getElementById("balance").innerText =
    state.balance.toFixed(2);
  document.getElementById("income").innerText =
    income.toFixed(4);
}

/* =====================
   NAV
===================== */
function openScreen(screen, btn) {
  document.querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const s = document.getElementById("screen");

  if (screen === "balance") {
    s.innerHTML = `
      <h3>💰 Баланс</h3>
      <p>Доступно: <b>${state.balance.toFixed(2)} GRK</b></p>
      <button onclick="withdraw()">➖ Вывести</button>
      <button class="small" onclick="deposit()">➕ Пополнить</button>
    `;
  }

  if (screen === "shop") {
    let html = `<h3>🛒 Видеокарты</h3>`;
    shopItems.forEach((item, i) => {
      html += `
        <div class="shop-card">
          <h4>${item.name}</h4>
          <p>💰 Цена: ${item.price} GRK</p>
          <p>📈 Доход: ${item.incomePerSec.toFixed(4)} GRK / сек</p>
          <p>⏱ Окупаемость: 15 дней</p>
          <button onclick="buy(${i})">Купить</button>
        </div>
      `;
    });
    s.innerHTML = html;
  }

  if (screen === "ads") {
    checkAdDay();
    s.innerHTML = `
      <h3>📺 Реклама</h3>
      <p>Сегодня просмотрено: ${state.adsToday} / ${ADS_LIMIT}</p>
      <button onclick="watchAd()">Смотреть рекламу</button>
    `;
  }
}

/* =====================
   ACTIONS
===================== */
function buy(index) {
  const item = shopItems[index];
  if (state.balance >= item.price) {
    state.balance -= item.price;
    state.cards.push(item);
    save();
    renderStats();
  } else {
    alert("Недостаточно Grok");
  }
}

function checkAdDay() {
  const today = new Date().toDateString();
  if (state.lastAdDay !== today) {
    state.lastAdDay = today;
    state.adsToday = 0;
  }
}

function watchAd() {
  checkAdDay();
  if (state.adsToday >= ADS_LIMIT) {
    alert("Лимит рекламы на сегодня исчерпан");
    return;
  }

  state.adsToday++;
  state.balance += GRK_PER_AD;
  save();
  renderStats();
  openScreen("ads", document.querySelectorAll(".bottom-nav button")[2]);
}

function withdraw() {
  alert("Вывод через TON Wallet (будет позже)");
}

function deposit() {
  alert("Пополнение через TON Wallet (будет позже)");
}

/* =====================
   START
===================== */
renderStats();
openScreen("balance", document.querySelector(".bottom-nav button.active"));

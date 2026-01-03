const tg = window.Telegram.WebApp;
tg.expand();

/* =====================
   CONSTANTS
===================== */
const GRK_PER_AD = 15;
const ADS_LIMIT = 20;
const AD_COOLDOWN = 60;

const CONTRACT_DAYS = 15;

/* =====================
   STATE
===================== */
let state = JSON.parse(localStorage.getItem("grokGame")) || {
  balance: 0,
  contracts: [],
  adsToday: 0,
  lastAdDay: null,
  lastAdTime: 0
};

/* =====================
   USER
===================== */
const user = tg.initDataUnsafe?.user || {};
document.getElementById("username").innerText =
  user.username || user.first_name || "Guest";

/* =====================
   SHOP (CONTRACTS)
===================== */
const shopItems = [
  { name: "GTX 1050", price: 1000, percent: 0.20 },
  { name: "GTX 1660", price: 3000, percent: 0.25 },
  { name: "RTX 3060", price: 8000, percent: 0.30 },
  { name: "RTX 4090", price: 30000, percent: 0.35 }
];

/* =====================
   GAME LOOP
===================== */
setInterval(() => {
  const now = Date.now();
  let income = 0;

  state.contracts = state.contracts.filter(c => {
    if (now >= c.endTime) return false;
    income += c.incomePerSec;
    return true;
  });

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
  const income = state.contracts.reduce((s, c) => s + c.incomePerSec, 0);
  document.getElementById("balance").innerText = state.balance.toFixed(2);
  document.getElementById("income").innerText = income.toFixed(4);
}

/* =====================
   NAV
===================== */
function openScreen(screen, btn) {
  document.querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const s = document.getElementById("screen");

  if (screen === "shop") {
    s.innerHTML = `<h3>🛒 Инвестиции</h3>` +
      shopItems.map((i, idx) => {
        const profit = i.price * i.percent;
        return `
          <div class="shop-card">
            <h4>${i.name}</h4>
            <p>Цена: ${i.price} GRK</p>
            <p>Доход: +${profit} GRK</p>
            <p>Срок: 15 дней</p>
            <button onclick="buy(${idx})">Инвестировать</button>
          </div>
        `;
      }).join("");
  }

  if (screen === "ads") {
    checkAdDay();
    const cd = Math.max(0, AD_COOLDOWN - Math.floor((Date.now() - state.lastAdTime) / 1000));
    s.innerHTML = `
      <h3>📺 Реклама</h3>
      <p>${state.adsToday}/${ADS_LIMIT}</p>
      <button ${cd > 0 ? "disabled" : ""} onclick="watchAd()">Смотреть</button>
      ${cd > 0 ? `<p>⏳ ${cd} сек</p>` : ""}
    `;
  }

  if (screen === "balance") {
    s.innerHTML = `
      <h3>💰 Баланс</h3>
      <p>${state.balance.toFixed(2)} GRK</p>
    `;
  }
}

/* =====================
   ACTIONS
===================== */
function buy(i) {
  const item = shopItems[i];
  if (state.balance < item.price) return alert("Недостаточно GRK");

  const now = Date.now();
  const profit = item.price * item.percent;
  const incomePerSec = (profit / CONTRACT_DAYS) / 86400;

  state.balance -= item.price;
  state.contracts.push({
    name: item.name,
    startTime: now,
    endTime: now + CONTRACT_DAYS * 86400000,
    incomePerSec
  });

  save();
  renderStats();
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
  if (state.adsToday >= ADS_LIMIT) return alert("Лимит рекламы");

  state.adsToday++;
  state.lastAdTime = Date.now();
  state.balance += GRK_PER_AD;
  save();
  renderStats();
}

/* =====================
   START
===================== */
renderStats();
openScreen("balance", document.querySelector(".bottom-nav button.active"));

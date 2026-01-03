const tg = window.Telegram.WebApp;
tg.expand();

/* =====================
   CONSTANTS
===================== */
const GRK_PER_AD = 15;
const ADS_LIMIT = 20;
const AD_COOLDOWN = 60; // seconds

const TON_TO_GRK = 10000; // 1 TON = 10000 GRK
const MIN_WITHDRAW_GRK = 5000; // 0.5 TON
const WITHDRAW_FEE = 0.02;
const REF_PERCENT = 0.05;

/* =====================
   STATE
===================== */
let state = JSON.parse(localStorage.getItem("grokGame")) || {
  balance: 0,
  cards: [],
  adsToday: 0,
  lastAdDay: null,
  lastAdTime: 0,
  referralId: Math.random().toString(36).slice(2, 10),
  referrer: null,
  referralEarnings: 0
};

/* =====================
   USER
===================== */
const user =
  tg.initDataUnsafe?.user || {};
const username = user.username || user.first_name || "Guest";
document.getElementById("username").innerText = username;

/* =====================
   SHOP (15 DAYS ROI)
===================== */
const shopItems = [
  { name: "GTX 1050", price: 1000, incomePerSec: 66.6 / 86400 },
  { name: "GTX 1660", price: 3000, incomePerSec: 200 / 86400 },
  { name: "RTX 3060", price: 8000, incomePerSec: 533 / 86400 },
  { name: "RTX 4090", price: 30000, incomePerSec: 2000 / 86400 }
];

/* =====================
   REFERRAL INIT
===================== */
const params = new URLSearchParams(window.location.search);
if (params.get("ref") && !state.referrer) {
  state.referrer = params.get("ref");
}

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
  const income = state.cards.reduce((s, c) => s + c.incomePerSec, 0);
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

  if (screen === "balance") {
    s.innerHTML = `
      <h3>💰 Баланс</h3>
      <p><b>${state.balance.toFixed(2)} GRK</b></p>
      <p>Минимальный вывод: 0.5 TON</p>
      <p>Комиссия: 2%</p>
      <button onclick="withdraw()">➖ Вывести</button>
    `;
  }

  if (screen === "shop") {
    s.innerHTML = `<h3>🛒 Видеокарты</h3>` +
      shopItems.map((i, idx) => `
        <div class="shop-card">
          <h4>${i.name}</h4>
          <p>Цена: ${i.price} GRK</p>
          <p>Доход: ${i.incomePerSec.toFixed(4)} GRK / сек</p>
          <p>Окупаемость: 15 дней</p>
          <button onclick="buy(${idx})">Купить</button>
        </div>
      `).join("");
  }

  if (screen === "ads") {
    checkAdDay();
    const cooldown = Math.max(0, AD_COOLDOWN - Math.floor((Date.now() - state.lastAdTime) / 1000));
    s.innerHTML = `
      <h3>📺 Реклама</h3>
      <p>${state.adsToday} / ${ADS_LIMIT} сегодня</p>
      <button ${cooldown > 0 ? "disabled" : ""} onclick="watchAd()">Смотреть рекламу</button>
      ${cooldown > 0 ? `<p>⏳ Следующая через: <b id="timer"></b></p>` : ""}
    `;
    if (cooldown > 0) startTimer(cooldown);
  }
}

/* =====================
   ADS
===================== */
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
    alert("Лимит рекламы исчерпан");
    return;
  }

  state.adsToday++;
  state.lastAdTime = Date.now();
  state.balance += GRK_PER_AD;
  save();
  renderStats();
  openScreen("ads", document.querySelectorAll(".bottom-nav button")[2]);
}

function startTimer(sec) {
  const el = document.getElementById("timer");
  if (!el) return;

  const t = setInterval(() => {
    sec--;
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor(sec % 3600 / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    el.innerText = `${h}:${m}:${s}`;
    if (sec <= 0) clearInterval(t);
  }, 1000);
}

/* =====================
   ACTIONS
===================== */
function buy(i) {
  const item = shopItems[i];
  if (state.balance < item.price) return alert("Недостаточно Grok");
  state.balance -= item.price;
  state.cards.push(item);
  save();
  renderStats();
}

function withdraw() {
  if (state.balance < MIN_WITHDRAW_GRK) {
    alert("Минимальный вывод — 0.5 TON");
    return;
  }

  const fee = state.balance * WITHDRAW_FEE;
  const amount = state.balance - fee;

  if (state.referrer) {
    const refBonus = amount * REF_PERCENT;
    console.log("Рефералу начислено:", refBonus);
  }

  state.balance = 0;
  save();
  alert("Заявка на вывод создана (TON Wallet позже)");
}

/* =====================
   START
===================== */
renderStats();
openScreen("balance", document.querySelector(".bottom-nav button.active"));

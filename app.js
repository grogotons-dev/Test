// =====================================================
// SPLASH
// =====================================================
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    const app = document.querySelector('.app');
    if (splash) splash.style.display = 'none';
    if (app) app.classList.add('show');
  }, 2000);
});

// =====================================================
// TELEGRAM
// =====================================================
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// =====================================================
// ADSGRAM + SERVER НАСТРОЙКИ
// =====================================================
const SERVER_URL = "https://ТВОЙ-СЕРВЕР";       // ← ЗАМЕНИ
const ADSGRAM_BLOCK_ID = "ТВОЙ_BLOCK_ID";      // ← ЗАМЕНИ
const ADSGRAM_TASK_ID = "task-20549";

// =====================================================
// ЭКОНОМИКА
// =====================================================
const GRK_PER_TON = 100000;
const CONTRACT_DAYS = 15;
const GRK_PER_AD = 15;
const ADS_LIMIT = 20;

// =====================================================
// ADSGRAM INIT
// =====================================================
let adsgram = null;

document.addEventListener("DOMContentLoaded", () => {
  if (window.Adsgram && tg) {
    adsgram = new Adsgram({
      blockId: ADSGRAM_BLOCK_ID,
      tg: tg
    });
  }
});

// =====================================================
// СОСТОЯНИЕ
// =====================================================
let state = JSON.parse(localStorage.getItem("grok_final")) || {
  balance: 0,
  contracts: [],
  adsToday: 0,
  lastAdDay: null,
  referralId: Math.random().toString(36).slice(2, 10)
};

function save() {
  localStorage.setItem("grok_final", JSON.stringify(state));
}

// =====================================================
// ПОЛЬЗОВАТЕЛЬ
// =====================================================
const user = tg?.initDataUnsafe?.user || {};
document.getElementById("username").innerText =
  user.username || user.first_name || "Player";

// =====================================================
// МАГАЗИН
// =====================================================
const shopItems = [
  { name: "GTX 1050", priceTon: 0.1, percent: 0.20 },
  { name: "GTX 1660", priceTon: 0.3, percent: 0.15 },
  { name: "RTX 3060", priceTon: 1.0, percent: 0.10 },
  { name: "RTX 4090", priceTon: 3.0, percent: 0.05 }
];

// =====================================================
// ДОХОД В СЕКУНДУ
// =====================================================
setInterval(() => {
  const now = Date.now();
  let income = 0;

  state.contracts = state.contracts.filter(c => {
    if (now >= c.end) return false;
    income += c.incomePerSec;
    return true;
  });

  if (income > 0) {
    state.balance += income;
    save();
    renderHeader();
  }
}, 1000);

// =====================================================
// HEADER
// =====================================================
function renderHeader() {
  const income = state.contracts.reduce((s, c) => s + c.incomePerSec, 0);
  document.getElementById("balance").innerText = state.balance.toFixed(2);
  document.getElementById("income").innerText = income.toFixed(4);
}

// =====================================================
// НАВИГАЦИЯ
// =====================================================
function openScreen(screen, btn) {
  document.querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));
  btn?.classList.add("active");

  const s = document.getElementById("screen");
  s.innerHTML = "";

  if (screen === "home") renderHome();
  if (screen === "shop") renderShop();
  if (screen === "tasks") renderTasks();
  if (screen === "refs") renderRefs();
}

// =====================================================
// HOME
// =====================================================
function renderHome() {
  const income = state.contracts.reduce((s, c) => s + c.incomePerSec, 0);
  document.getElementById("screen").innerHTML = `
    <div class="main-card">
      <div class="balance-display">${state.balance.toFixed(2)} GRK</div>
      <div class="income-display">${income.toFixed(4)} GRK/сек</div>
      <div class="actions">
        <button onclick="deposit()">Пополнить</button>
        <button class="secondary" onclick="withdraw()">Вывести</button>
      </div>
    </div>
  `;
}

// =====================================================
// SHOP
// =====================================================
function renderShop() {
  let html = `<h3>Магазин</h3>`;

  shopItems.forEach((i, idx) => {
    const priceGRK = i.priceTon * GRK_PER_TON;
    const profit = Math.round(priceGRK * i.percent);

    html += `
      <div class="shop-card">
        <h4>${i.name}</h4>
        <p>Цена: ${priceGRK} GRK</p>
        <p>Прибыль: +${profit} GRK</p>
        <button onclick="buy(${idx})">Купить</button>
      </div>
    `;
  });

  document.getElementById("screen").innerHTML = html;
}

// =====================================================
// TASKS — 🔴 ВОТ ТУТ ADSGRAM + СЕРВЕР
// =====================================================
function renderTasks() {
  checkAdDay();

  document.getElementById("screen").innerHTML = `
    <div style="text-align:center">
      <h3>Задания</h3>
      <div class="shop-card">
        <h4>Реклама</h4>
        <p>${state.adsToday}/${ADS_LIMIT}</p>
        <button onclick="watchAd()" ${state.adsToday >= ADS_LIMIT ? 'disabled' : ''}>
          Смотреть рекламу (+${GRK_PER_AD} GRK)
        </button>
      </div>
    </div>
  `;
}

// =====================================================
// WATCH AD — РЕАЛЬНАЯ РЕКЛАМА
// =====================================================
function watchAd() {
  if (!adsgram) return alert("AdsGram не готов");

  if (state.adsToday >= ADS_LIMIT) return;

  adsgram.show({ taskId: ADSGRAM_TASK_ID })
    .then(() => {
      fetch(`${SERVER_URL}/ad-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          taskId: ADSGRAM_TASK_ID
        })
      })
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;

        state.balance = data.balance;
        state.adsToday = data.adsToday;
        save();
        renderHeader();
        renderTasks();
        showParticleEffect(`+${GRK_PER_AD} GRK`);
      });
    });
}

// =====================================================
// ПРОЧЕЕ
// =====================================================
function checkAdDay() {
  const d = new Date().toDateString();
  if (state.lastAdDay !== d) {
    state.lastAdDay = d;
    state.adsToday = 0;
  }
}

function buy(i) {
  const item = shopItems[i];
  const price = item.priceTon * GRK_PER_TON;
  if (state.balance < price) return;

  const profit = Math.round(price * item.percent);
  state.balance -= price;

  state.contracts.push({
    name: item.name,
    end: Date.now() + CONTRACT_DAYS * 86400000,
    incomePerSec: profit / (CONTRACT_DAYS * 86400)
  });

  save();
  renderHeader();
}

function deposit() {
  alert("Пополнение позже");
}

function withdraw() {
  alert("Вывод позже");
}

function showParticleEffect(text) {
  const el = document.createElement("div");
  el.className = "particle";
  el.innerText = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// =====================================================
// START
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  openScreen("home", document.querySelector(".bottom-nav button"));
});

const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

/* ========= CONSTANTS ========= */
const GRK_PER_AD = 15;
const ADS_LIMIT = 20;
const AD_WATCH_TIME = 10;
const AD_COOLDOWN = 10;
const CONTRACT_DAYS = 15;

/* ========= STATE ========= */
let state = JSON.parse(localStorage.getItem("grokGame_v4")) || {
  balance: 0,
  contracts: [],
  adsToday: 0,
  lastAdDay: null,
  referralId: Math.random().toString(36).slice(2, 10)
};

let adInProgress = false;
let adValid = true;

/* ========= USER ========= */
const user = tg?.initDataUnsafe?.user || {};
document.getElementById("username").innerText =
  user.username || user.first_name || "Player";

/* ========= SHOP ========= */
const shopItems = [
  { name: "GTX 1050", price: 1000, percent: 0.20 },
  { name: "GTX 1660", price: 3000, percent: 0.25 },
  { name: "RTX 3060", price: 8000, percent: 0.30 },
  { name: "RTX 4090", price: 30000, percent: 0.35 }
];

/* ========= MAIN LOOP ========= */
setInterval(() => {
  const now = Date.now();
  let income = 0;

  state.contracts = state.contracts.filter(c => {
    if (now >= c.end) return false;
    income += c.income;
    return true;
  });

  if (income > 0) {
    state.balance += income;
    save();
    renderHeader();
    renderHome();
  }
}, 1000);

/* ========= ANTIBOT ========= */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") adValid = false;
});
window.addEventListener("blur", () => adValid = false);

/* ========= SAVE ========= */
function save() {
  localStorage.setItem("grokGame_v4", JSON.stringify(state));
}

/* ========= HEADER ========= */
function renderHeader() {
  const income = state.contracts.reduce((s, c) => s + c.income, 0);
  document.getElementById("balance").innerText = state.balance.toFixed(2);
  document.getElementById("income").innerText = income.toFixed(4);
}

/* ========= NAV ========= */
function openScreen(screen, btn) {
  document.querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const s = document.getElementById("screen");
  s.innerHTML = "";

  if (screen === "home") renderHome();
  if (screen === "shop") renderShop();
  if (screen === "tasks") renderTasks();
  if (screen === "refs") renderRefs();
}

/* ========= SCREENS ========= */
function renderHome() {
  const s = document.getElementById("screen");
  const income = state.contracts.reduce((s, c) => s + c.income, 0);

  s.innerHTML = `
    <div class="main-card">
      <h2>${state.balance.toFixed(2)} GRK</h2>
      <p>Доход: ${income.toFixed(4)} GRK / сек</p>
    </div>
  `;
}

function renderShop() {
  const s = document.getElementById("screen");
  s.innerHTML = `<h3>🛒 Магазин</h3>` +
    shopItems.map((i, idx) => `
      <div class="shop-card">
        <h4>${i.name}</h4>
        <p>Цена: ${i.price} GRK</p>
        <p>Прибыль: +${(i.price * i.percent).toFixed(0)} GRK за 15 дней</p>
        <button onclick="buy(${idx})">Купить</button>
      </div>
    `).join("");
}

function renderTasks() {
  checkAdDay();
  const s = document.getElementById("screen");

  s.innerHTML = `
    <h3>📋 Задания</h3>
    <p>📺 Смотреть рекламу (${state.adsToday}/${ADS_LIMIT})</p>

    <div class="ad-timer">
      <svg width="120" height="120">
        <circle cx="60" cy="60" r="54" stroke="#222" stroke-width="8" fill="none"/>
        <circle id="adCircle"
          cx="60" cy="60" r="54"
          stroke="#4fd1ff" stroke-width="8"
          fill="none"
          stroke-dasharray="339"
          stroke-dashoffset="339"/>
      </svg>
      <div id="adText">Готово</div>
    </div>

    <button id="adBtn" onclick="watchAd()">Смотреть рекламу</button>
    <div id="adLog" style="margin-top:10px;opacity:.7"></div>
  `;
}

function renderRefs() {
  const s = document.getElementById("screen");
  s.innerHTML = `
    <h3>👥 Рефералы</h3>
    <p>Приглашай друзей и зарабатывай</p>
    <code>https://t.me/yourbot?start=${state.referralId}</code>
  `;
}

/* ========= ACTIONS ========= */
function buy(i) {
  const it = shopItems[i];
  if (state.balance < it.price) return alert("Недостаточно GRK");

  const profit = it.price * it.percent;
  const income = (profit / CONTRACT_DAYS) / 86400;

  state.balance -= it.price;
  state.contracts.push({
    name: it.name,
    start: Date.now(),
    end: Date.now() + CONTRACT_DAYS * 86400000,
    income
  });

  save();
  renderHeader();
  openScreen("home", document.querySelectorAll(".bottom-nav button")[0]);
}

/* ========= ADS ========= */
function watchAd() {
  if (adInProgress) return;
  if (state.adsToday >= ADS_LIMIT) return alert("Лимит рекламы");

  adInProgress = true;
  adValid = true;

  const btn = document.getElementById("adBtn");
  const text = document.getElementById("adText");
  const circle = document.getElementById("adCircle");
  const log = document.getElementById("adLog");

  btn.disabled = true;
  let time = AD_WATCH_TIME;
  let dash = 339;

  const timer = setInterval(() => {
    text.innerText = `${time}s`;
    dash -= 339 / AD_WATCH_TIME;
    circle.style.strokeDashoffset = dash;
    time--;

    if (time < 0) {
      clearInterval(timer);

      if (!adValid) {
        log.innerText = "❌ Реклама не засчитана";
        resetAd(btn, text, circle);
        return;
      }

      state.adsToday++;
      state.balance += GRK_PER_AD;
      save();
      renderHeader();

      log.innerText = "✅ Спасибо за просмотр рекламы!";
      startCooldown(btn, text, circle);
    }
  }, 1000);
}

function startCooldown(btn, text, circle) {
  let cd = AD_COOLDOWN;
  text.innerText = `⏳ ${cd}s`;

  const timer = setInterval(() => {
    cd--;
    text.innerText = `⏳ ${cd}s`;
    if (cd <= 0) {
      clearInterval(timer);
      resetAd(btn, text, circle);
    }
  }, 1000);
}

function resetAd(btn, text, circle) {
  adInProgress = false;
  btn.disabled = false;
  text.innerText = "Готово";
  circle.style.strokeDashoffset = 339;
}

function checkAdDay() {
  const today = new Date().toDateString();
  if (state.lastAdDay !== today) {
    state.lastAdDay = today;
    state.adsToday = 0;
  }
}

/* ========= START ========= */
renderHeader();
openScreen("home", document.querySelectorAll(".bottom-nav button")[0]);

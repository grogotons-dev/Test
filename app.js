const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

/* ========= ЭКОНОМИКА ========= */
const GRK_PER_TON = 100000; // 1 TON = 100 000 GRK
const CONTRACT_DAYS = 15;
const GRK_PER_AD = 15;
const ADS_LIMIT = 20;

/* ========= СОСТОЯНИЕ ========= */
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

/* ========= ПОЛЬЗОВАТЕЛЬ ========= */
const user = tg?.initDataUnsafe?.user || {};
document.getElementById("username").innerText =
  user.username || user.first_name || "Player";

/* ========= МАГАЗИН ========= */
const shopItems = [
  { name: "GTX 1050", priceTon: 0.1, percent: 0.20 },
  { name: "GTX 1660", priceTon: 0.3, percent: 0.15 },
  { name: "RTX 3060", priceTon: 1.0, percent: 0.10 },
  { name: "RTX 4090", priceTon: 3.0, percent: 0.05 }
];

/* ========= ДОХОД В СЕКУНДУ ========= */
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
    renderHome();
  }
}, 1000);

/* ========= ХЕДЕР ========= */
function renderHeader() {
  const income = state.contracts.reduce((s, c) => s + c.incomePerSec, 0);
  document.getElementById("balance").innerText = state.balance.toFixed(2);
  document.getElementById("income").innerText = income.toFixed(4);
}

/* ========= НАВИГАЦИЯ ========= */
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

/* ========= ЭКРАНЫ ========= */
function renderHome() {
  const income = state.contracts.reduce((s, c) => s + c.incomePerSec, 0);
  document.getElementById("screen").innerHTML = `
    <div class="main-card">
      <h2>${state.balance.toFixed(2)} GRK</h2>
      <p>Доход: ${income.toFixed(4)} GRK / сек</p>

      <div class="actions">
        <button onclick="deposit()">⬆️ Пополнить</button>
        <button class="secondary" onclick="withdraw()">⬇️ Вывести</button>
      </div>
    </div>
  `;
}

function renderShop() {
  let html = `<h3>🛒 Магазин</h3>`;

  /* === МОИ КОНТРАКТЫ === */
  if (state.contracts.length > 0) {
    html += `<h4>Мои контракты</h4>`;

    state.contracts.forEach(c => {
      const timeLeft = formatTime(c.end - Date.now());
      html += `
        <div class="shop-card">
          <strong>${c.name}</strong>
          <p>Доход: ${c.totalProfit} GRK</p>
          <p>Осталось: ${timeLeft}</p>
        </div>
      `;
    });
  }

  /* === МАГАЗИН === */
  html += `<h4>Доступные видеокарты</h4>`;

  shopItems.forEach((i, idx) => {
    const priceGRK = i.priceTon * GRK_PER_TON;
    const totalGRK = Math.round(priceGRK * (1 + i.percent));

    html += `
      <div class="shop-card">
        <h4>${i.name}</h4>
        <p>Цена: ${i.priceTon} TON (${priceGRK} GRK)</p>
        <p>Доход за 15 дней: ${totalGRK} GRK</p>
        <button onclick="buy(${idx})">Купить</button>
      </div>
    `;
  });

  document.getElementById("screen").innerHTML = html;
}

function renderTasks() {
  checkAdDay();
  document.getElementById("screen").innerHTML = `
    <h3>📋 Задания</h3>
    <p>Реклама: ${state.adsToday}/${ADS_LIMIT}</p>
    <button onclick="watchAd()">Смотреть рекламу (+${GRK_PER_AD} GRK)</button>
  `;
}

function renderRefs() {
  document.getElementById("screen").innerHTML = `
    <h3>👥 Рефералы</h3>
    <p>5% с вывода рефералов</p>
    <code>https://t.me/yourbot?start=${state.referralId}</code>
  `;
}

/* ========= ДЕЙСТВИЯ ========= */
function buy(i) {
  const item = shopItems[i];
  const priceGRK = item.priceTon * GRK_PER_TON;

  if (state.balance < priceGRK) {
    alert("Недостаточно GRK");
    return;
  }

  const profitGRK = Math.round(priceGRK * item.percent);
  const incomePerSec = profitGRK / (CONTRACT_DAYS * 86400);

  state.balance -= priceGRK;
  state.contracts.push({
    name: item.name,
    start: Date.now(),
    end: Date.now() + CONTRACT_DAYS * 86400000,
    incomePerSec,
    totalProfit: profitGRK
  });

  save();
  renderHeader();
  openScreen("shop", document.querySelectorAll(".bottom-nav button")[1]);
}

function watchAd() {
  if (state.adsToday >= ADS_LIMIT) return alert("Лимит рекламы");

  state.adsToday++;
  state.balance += GRK_PER_AD;
  save();
  renderHeader();
}

function checkAdDay() {
  const today = new Date().toDateString();
  if (state.lastAdDay !== today) {
    state.lastAdDay = today;
    state.adsToday = 0;
  }
}

/* ========= ВСПОМОГАТЕЛЬНОЕ ========= */
function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${d}д ${h}ч ${m}м`;
}

/* ========= ЗАГЛУШКИ ========= */
function deposit() {
  alert("Пополнение будет подключено позже");
}

function withdraw() {
  alert("Вывод будет подключён позже");
}

/* ========= СТАРТ ========= */
renderHeader();
openScreen("home", document.querySelector(".bottom-nav button"));

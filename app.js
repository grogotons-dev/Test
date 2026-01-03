const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

/* ========= CONSTANTS ========= */
const GRK_PER_AD = 15;
const ADS_LIMIT = 20;
const AD_COOLDOWN = 20;
const CONTRACT_DAYS = 15;

/* ========= STATE ========= */
let state = JSON.parse(localStorage.getItem("grokGame")) || {
  balance: 0,
  contracts: [],
  adsToday: 0,
  lastAdDay: null,
  lastAdTime: 0,
  referralId: Math.random().toString(36).slice(2, 10)
};

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

/* ========= LOOP ========= */
setInterval(() => {
  const now = Date.now();
  let income = 0;

  state.contracts = state.contracts.filter(c => {
    if (now >= c.end) return false;
    income += c.income;
    return true;
  });

  state.balance += income;
  save();
  renderStats();
}, 1000);

/* ========= SAVE / RENDER ========= */
function save() {
  localStorage.setItem("grokGame", JSON.stringify(state));
}

function renderStats() {
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

  if (screen === "balance") {
    s.innerHTML = `<h3>💰 Баланс</h3>
      <p><b>${state.balance.toFixed(2)} GRK</b></p>`;
  }

  if (screen === "shop") {
    s.innerHTML = `<h3>🛒 Инвестиции</h3>` +
      shopItems.map((i, idx) => `
        <div class="shop-card">
          <h4>${i.name}</h4>
          <p>Цена: ${i.price} GRK</p>
          <p>Доход: +${(i.price * i.percent).toFixed(0)} GRK</p>
          <p>Срок: 15 дней</p>
          <button onclick="buy(${idx})">Инвестировать</button>
        </div>
      `).join("");
  }

  if (screen === "ads") {
    checkAdDay();
    const cd = Math.max(0, AD_COOLDOWN - Math.floor((Date.now() - state.lastAdTime) / 1000));

    s.innerHTML = `
      <h3>📺 Реклама</h3>
      <p>${state.adsToday} / ${ADS_LIMIT}</p>
      <button ${cd > 0 ? "disabled" : ""} onclick="watchAd()">Смотреть рекламу</button>
      <div class="progress">
        <div class="progress-bar" id="adBar"></div>
      </div>
    `;

    startAdBar(cd);
  }

  if (screen === "portfolio") {
    s.innerHTML = `
      <h3>👥 Мои инвестиции</h3>
      ${state.contracts.length === 0 ? "<p>Нет активных контрактов</p>" : ""}
      ${state.contracts.map(c => {
        const progress = Math.min(100, ((Date.now() - c.start) / (c.end - c.start)) * 100);
        return `
          <div class="contract-card">
            <b>${c.name}</b>
            <p>Доход: ${c.income.toFixed(4)} GRK / сек</p>
            <div class="progress">
              <div class="progress-bar" style="width:${progress}%"></div>
            </div>
          </div>
        `;
      }).join("")}

      <h4>🔗 Реферальная ссылка</h4>
      <code>https://t.me/yourbot?start=${state.referralId}</code>
    `;
  }
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
  renderStats();
  openScreen("portfolio", document.querySelectorAll(".bottom-nav button")[3]);
}

function checkAdDay() {
  const today = new Date().toDateString();
  if (state.lastAdDay !== today) {
    state.lastAdDay = today;
    state.adsToday = 0;
  }
}

function watchAd() {
  if (state.adsToday >= ADS_LIMIT) return alert("Лимит рекламы");

  state.adsToday++;
  state.lastAdTime = Date.now();
  state.balance += GRK_PER_AD;

  save();
  renderStats();
  openScreen("ads", document.querySelectorAll(".bottom-nav button")[2]);
}

function startAdBar(cd) {
  const bar = document.getElementById("adBar");
  if (!bar) return;

  let left = cd;
  bar.style.width = "0%";

  const timer = setInterval(() => {
    left--;
    bar.style.width = ((AD_COOLDOWN - left) / AD_COOLDOWN) * 100 + "%";
    if (left <= 0) clearInterval(timer);
  }, 1000);
}

/* ========= START ========= */
renderStats();
openScreen("balance", document.querySelector(".bottom-nav button"));

const tg = window.Telegram.WebApp;
tg.expand();

let state = JSON.parse(localStorage.getItem("game")) || {
  balance: 0,
  hash: 0
};

document.getElementById("username").innerText =
  tg.initDataUnsafe?.user?.username || "Guest Miner";

const HASH_COEF = 0.1;

// Game loop
setInterval(() => {
  state.balance += state.hash * HASH_COEF;
  save();
  render();
}, 1000);

function save() {
  localStorage.setItem("game", JSON.stringify(state));
}

function render() {
  document.getElementById("balance").innerText = state.balance.toFixed(2);
  document.getElementById("hash").innerText = state.hash.toFixed(3);
  document.getElementById("income").innerText =
    (state.hash * HASH_COEF).toFixed(3);
}

function setActive(btn) {
  document.querySelectorAll(".bottom-nav button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function openScreen(screen) {
  const s = document.getElementById("screen");

  document.querySelectorAll(".bottom-nav button").forEach(b => {
    if (b.innerText.includes(screen === 'main' ? 'Баланс' :
        screen === 'shop' ? 'Магазин' :
        screen === 'ads' ? 'Реклама' : 'Профиль')) {
      setActive(b);
    }
  });

  if (screen === "main") {
    s.innerHTML = `<p>Твой майнинг работает 24/7. Улучшай оборудование 🚀</p>`;
  }

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

  if (screen === "ads") {
    s.innerHTML = `
      <h3>📺 Реклама</h3>
      <button onclick="watchAd()">Смотреть рекламу</button>
    `;
  }

  if (screen === "profile") {
    s.innerHTML = `
      <h3>⚙️ Профиль</h3>
      <p>Hash Power: ${state.hash.toFixed(3)}</p>
      <button onclick="reset()">Сброс прогресса</button>
    `;
  }
}

function buy(price, hash) {
  if (state.balance >= price) {
    state.balance -= price;
    state.hash += hash;
    save();
    render();
  } else {
    alert("Недостаточно средств");
  }
}

function watchAd() {
  state.hash += 0.02;
  save();
  render();
}

function reset() {
  if (confirm("Сбросить прогресс?")) {
    localStorage.removeItem("game");
    location.reload();
  }
}

render();
openScreen("main");

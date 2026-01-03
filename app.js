const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

/* ========= НАСТРОЙКИ ЯЗЫКА ========= */
const translations = {
  ru: {
    title: "Grok Invest",
    soundTitle: "Звук",
    langTitle: "Язык",
    volumeLabel: "Громкость",
    settingsInfo: "💡 Настройки сохраняются автоматически",
    
    currency: "GRK",
    perSecond: "GRK / сек",
    
    navHome: "Главная",
    navShop: "Магазин",
    navTasks: "Задания",
    navRefs: "Рефералы",
    
    balanceTitle: "Баланс",
    incomeTitle: "Доход",
    depositBtn: "⬆️ Пополнить",
    withdrawBtn: "⬇️ Вывести",
    
    shopTitle: "🛒 Магазин",
    myContracts: "Мои контракты",
    availableCards: "Доступные видеокарты",
    contractIncome: "Доход",
    timeLeft: "Осталось",
    priceLabel: "Цена",
    profitLabel: "Доход за 15 дней",
    buyBtn: "Купить",
    insufficientFunds: "Недостаточно GRK",
    
    tasksTitle: "📋 Задания",
    adsLabel: "Реклама",
    watchAdBtn: "Смотреть рекламу (+{GRK_PER_AD} GRK)",
    limitReached: "Лимит исчерпан",
    
    refsTitle: "👥 Рефералы",
    refsDesc: "5% с вывода рефералов",
    copyBtn: "📋 Скопировать ссылку",
    copied: "Скопировано!",
    
    contractCompleted: "✅ Контракт завершён!",
    purchased: "🎉 Куплено!",
    limitReachedMsg: "⚠️ Лимит",
    depositComing: "Пополнение будет подключено позже",
    withdrawComing: "Вывод будет подключён позже",
    insufficientMsg: "❌ Недостаточно GRK"
  },
  
  en: {
    title: "Grok Invest",
    soundTitle: "Sound",
    langTitle: "Language",
    volumeLabel: "Volume",
    settingsInfo: "💡 Settings are saved automatically",
    
    currency: "GRK",
    perSecond: "GRK / sec",
    
    navHome: "Home",
    navShop: "Shop",
    navTasks: "Tasks",
    navRefs: "Referrals",
    
    balanceTitle: "Balance",
    incomeTitle: "Income",
    depositBtn: "⬆️ Deposit",
    withdrawBtn: "⬇️ Withdraw",
    
    shopTitle: "🛒 Shop",
    myContracts: "My Contracts",
    availableCards: "Available GPUs",
    contractIncome: "Income",
    timeLeft: "Time left",
    priceLabel: "Price",
    profitLabel: "Profit for 15 days",
    buyBtn: "Buy",
    insufficientFunds: "Insufficient GRK",
    
    tasksTitle: "📋 Tasks",
    adsLabel: "Ads",
    watchAdBtn: "Watch ad (+{GRK_PER_AD} GRK)",
    limitReached: "Limit reached",
    
    refsTitle: "👥 Referrals",
    refsDesc: "5% from referrals' withdrawals",
    copyBtn: "📋 Copy link",
    copied: "Copied!",
    
    contractCompleted: "✅ Contract completed!",
    purchased: "🎉 Purchased!",
    limitReachedMsg: "⚠️ Limit",
    depositComing: "Deposit will be connected later",
    withdrawComing: "Withdrawal will be connected later",
    insufficientMsg: "❌ Insufficient GRK"
  }
};

/* ========= ЭКОНОМИКА ========= */
const GRK_PER_TON = 100000;
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

// Текущий язык
let currentLang = localStorage.getItem('grok_lang') || 'ru';

/* ========= АУДИО-МЕНЕДЖЕР ========= */
const AudioManager = {
  ctx: null,
  masterVolume: parseFloat(localStorage.getItem('master_volume') || '0.5'),
  enabled: localStorage.getItem('sound_enabled') !== 'false',
  
  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.updateVolume();
    
    // Разрешаем автоплей при первом клике
    document.addEventListener('click', () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }, { once: true });
  },
  
  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || this.masterVolume === 0 || !this.ctx) return;
    
    try {
      const oscillator = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      const finalVolume = this.masterVolume * volume;
      gainNode.gain.setValueAtTime(finalVolume, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.log("Audio error:", e);
    }
  },
  
  playClick() {
    this.playTone(600, 0.1, 'sine', 0.2);
  },
  
  playCoin() {
    this.playTone(800, 0.15, 'sine', 0.25);
    setTimeout(() => this.playTone(1200, 0.1, 'sine', 0.2), 100);
  },
  
  playBuy() {
    this.playTone(500, 0.2, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(700, 0.15, 'sawtooth', 0.25), 150);
  },
  
  playError() {
    this.playTone(300, 0.3, 'sine', 0.4);
  },
  
  playNotification() {
    this.playTone(800, 0.2, 'square', 0.25);
    setTimeout(() => this.playTone(600, 0.2, 'square', 0.2), 200);
  },
  
  setVolume(value) {
    this.masterVolume = value / 100;
    localStorage.setItem('master_volume', this.masterVolume);
    this.updateVolume();
  },
  
  updateVolume() {
    const volumeElement = document.getElementById('volumeValue');
    const sliderElement = document.getElementById('volumeSlider');
    
    if (volumeElement) {
      volumeElement.textContent = `${Math.round(this.masterVolume * 100)}%`;
    }
    
    if (sliderElement) {
      sliderElement.value = this.masterVolume * 100;
    }
  },
  
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('sound_enabled', this.enabled);
    
    if (this.enabled) {
      this.playClick();
    }
    
    return this.enabled;
  }
};

// Инициализация аудио
AudioManager.init();

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
    if (now >= c.end) {
      AudioManager.playNotification();
      showParticleEffect(t('contractCompleted'));
      return false;
    }
    income += c.incomePerSec;
    return true;
  });

  if (income > 0) {
    state.balance += income;
    save();
    renderHeader();
    
    // Обновляем прогресс бар если есть активные контракты
    updateProgressBar();
    
    // Обновляем главный экран если он активен
    if (document.querySelector('.bottom-nav .active span')?.textContent === t('navHome')) {
      renderHome();
    }
  }
}, 1000);

/* ========= ПРОГРЕСС БАР ========= */
function updateProgressBar() {
  const totalIncome = state.contracts.reduce((s, c) => s + c.incomePerSec, 0);
  const progressBar = document.querySelector('.progress-bar');
  
  if (progressBar) {
    // Прогресс от 0 до 100% в зависимости от дохода
    const progress = Math.min(100, (totalIncome * 1000) * 20); // Масштабирование
    progressBar.style.width = `${progress}%`;
  }
}

/* ========= ЯЗЫКОВЫЕ ФУНКЦИИ ========= */
function t(key, params = {}) {
  let text = translations[currentLang][key] || translations['ru'][key] || key;
  
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
}

function updateLanguage() {
  document.title = t('title');
  
  // Обновляем UI элементы
  const elements = {
    'settingsSoundTitle': t('soundTitle'),
    'settingsLangTitle': t('langTitle'),
    'volumeLabel': t('volumeLabel'),
    'settingsInfo': t('settingsInfo'),
    'currency': t('currency'),
    'perSecond': t('perSecond'),
    'navHome': t('navHome'),
    'navShop': t('navShop'),
    'navTasks': t('navTasks'),
    'navRefs': t('navRefs')
  };
  
  Object.keys(elements).forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = elements[id];
  });
  
  // Обновляем кнопки языка
  document.getElementById('langRu').classList.toggle('active', currentLang === 'ru');
  document.getElementById('langEn').classList.toggle('active', currentLang === 'en');
  
  // Обновляем активный экран
  const activeBtn = document.querySelector('.bottom-nav .active');
  if (activeBtn) {
    const screen = Array.from(document.querySelectorAll('.bottom-nav button')).indexOf(activeBtn);
    const screens = ['home', 'shop', 'tasks', 'refs'];
    openScreen(screens[screen], activeBtn);
  }
}

function setLanguage(lang) {
  if (currentLang === lang) return;
  
  currentLang = lang;
  localStorage.setItem('grok_lang', lang);
  
  AudioManager.playClick();
  updateLanguage();
}

/* ========= ХЕДЕР ========= */
function renderHeader() {
  const income = state.contracts.reduce((s, c) => s + c.incomePerSec, 0);
  document.getElementById("balance").innerText = state.balance.toFixed(2);
  document.getElementById("income").innerText = income.toFixed(4);
}

/* ========= НАВИГАЦИЯ ========= */
function openScreen(screen, btn) {
  AudioManager.playClick();
  
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
  const hasIncome = income > 0;
  
  const progressBar = hasIncome ? `
    <div class="progress-container">
      <div class="progress-bar" style="width: ${Math.min(100, income * 1000 * 20)}%"></div>
    </div>
  ` : '';
  
  document.getElementById("screen").innerHTML = `
    <div class="main-card">
      <div class="balance-display">${state.balance.toFixed(2)} ${t('currency')}</div>
      
      <div class="income-display ${hasIncome ? 'active' : ''}">
        ${t('incomeTitle')}: ${income.toFixed(4)} ${t('perSecond')}
      </div>
      
      ${progressBar}
      
      <div class="actions">
        <button onclick="deposit()">${t('depositBtn')}</button>
        <button class="secondary" onclick="withdraw()">${t('withdrawBtn')}</button>
      </div>
    </div>
  `;
}

function renderShop() {
  let html = `<h3>${t('shopTitle')}</h3>`;

  /* === МОИ КОНТРАКТЫ === */
  if (state.contracts.length > 0) {
    html += `<h4 style="margin-top: 20px; color: #22c55e;">${t('myContracts')}</h4>`;

    state.contracts.forEach((c, idx) => {
      const timeLeft = formatTime(c.end - Date.now());
      const progress = Math.max(0, 100 - ((c.end - Date.now()) / (CONTRACT_DAYS * 86400000) * 100));
      
      html += `
        <div class="shop-card">
          <h4>${c.name}</h4>
          <p>${t('contractIncome')}: <strong>${c.totalProfit} ${t('currency')}</strong></p>
          <div style="background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin: 12px 0; overflow: hidden;">
            <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #22c55e, #3b82f6); border-radius: 3px;"></div>
          </div>
          <p>${t('timeLeft')}: <strong>${timeLeft}</strong></p>
        </div>
      `;
    });
  }

  /* === МАГАЗИН === */
  html += `<h4 style="margin-top: 25px; color: #22c55e;">${t('availableCards')}</h4>`;

  shopItems.forEach((i, idx) => {
    const priceGRK = i.priceTon * GRK_PER_TON;
    const totalGRK = Math.round(priceGRK * (1 + i.percent));
    const canBuy = state.balance >= priceGRK;
    const profit = totalGRK - priceGRK;
    
    html += `
      <div class="shop-card" style="border-color: ${canBuy ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)'};">
        <h4>${i.name}</h4>
        <p>${t('priceLabel')}: <strong>${i.priceTon} TON (${priceGRK} ${t('currency')})</strong></p>
        <p>${t('profitLabel')}: <strong style="color: #22c55e;">+${profit} ${t('currency')}</strong></p>
        <button style="margin-top: 12px;" ${!canBuy ? 'disabled' : ''} onclick="buy(${idx})">
          ${canBuy ? t('buyBtn') : t('insufficientFunds')}
        </button>
      </div>
    `;
  });

  document.getElementById("screen").innerHTML = html;
}

function renderTasks() {
  checkAdDay();
  const adText = state.adsToday >= ADS_LIMIT 
    ? t('limitReached')
    : t('watchAdBtn', { GRK_PER_AD });
  
  document.getElementById("screen").innerHTML = `
    <div style="text-align: center;">
      <h3>${t('tasksTitle')}</h3>
      
      <div class="shop-card" style="max-width: 300px; margin: 20px auto;">
        <h4 style="color: #facc15;">🎁 Ежедневные награды</h4>
        <p>${t('adsLabel')}: <strong>${state.adsToday}/${ADS_LIMIT}</strong></p>
        <p style="font-size: 14px; opacity: 0.8; margin: 15px 0;">Смотрите рекламу и получайте GRK</p>
        <button onclick="watchAd()" ${state.adsToday >= ADS_LIMIT ? 'disabled' : ''} style="width: 100%;">
          ${adText}
        </button>
      </div>
    </div>
  `;
}

function renderRefs() {
  document.getElementById("screen").innerHTML = `
    <div style="text-align: center;">
      <h3>${t('refsTitle')}</h3>
      
      <div class="shop-card" style="max-width: 350px; margin: 20px auto;">
        <p style="font-size: 16px; margin-bottom: 20px;">${t('refsDesc')}</p>
        
        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; margin: 15px 0; font-family: monospace; word-break: break-all; font-size: 13px; border: 1px solid rgba(34,197,94,0.2);">
          https://t.me/yourbot?start=${state.referralId}
        </div>
        
        <button onclick="copyRefLink()" style="width: 100%; margin-top: 10px;">
          ${t('copyBtn')}
        </button>
      </div>
      
      <p style="font-size: 14px; opacity: 0.7; margin-top: 25px;">
         Приглашайте друзей и получайте бонусы!
      </p>
    </div>
  `;
}

/* ========= ДЕЙСТВИЯ ========= */
function buy(i) {
  const item = shopItems[i];
  const priceGRK = item.priceTon * GRK_PER_TON;

  if (state.balance < priceGRK) {
    AudioManager.playError();
    showParticleEffect(t('insufficientMsg'));
    return;
  }

  AudioManager.playBuy();
  
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
  
  showParticleEffect(t('purchased'));
  
  setTimeout(() => {
    openScreen('shop', document.querySelectorAll('.bottom-nav button')[1]);
  }, 800);
}

function watchAd() {
  if (state.adsToday >= ADS_LIMIT) {
    AudioManager.playError();
    showParticleEffect(t('limitReachedMsg'));
    return;
  }

  AudioManager.playClick();
  AudioManager.playCoin();
  
  state.adsToday++;
  state.balance += GRK_PER_AD;
  save();
  renderHeader();
  
  showParticleEffect(`+${GRK_PER_AD} ${t('currency')}`);
  renderTasks();
}

function checkAdDay() {
  const today = new Date().toDateString();
  if (state.lastAdDay !== today) {
    state.lastAdDay = today;
    state.adsToday = 0;
  }
}

function copyRefLink() {
  const link = `https://t.me/yourbot?start=${state.referralId}`;
  navigator.clipboard.writeText(link).then(() => {
    AudioManager.playNotification();
    showParticleEffect(t('copied'));
  });
}

/* ========= УПРАВЛЕНИЕ НАСТРОЙКАМИ ========= */
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('show');
  AudioManager.playClick();
}

// Слайдер громкости
document.getElementById('volumeSlider').addEventListener('input', (e) => {
  const value = e.target.value;
  AudioManager.setVolume(value);
});

// Закрытие настроек при клике вне панели
document.addEventListener('click', (e) => {
  const panel = document.getElementById('settingsPanel');
  const btn = document.getElementById('settingsBtn');
  
  if (panel && panel.classList.contains('show') && 
      !panel.contains(e.target) && 
      !btn.contains(e.target)) {
    panel.classList.remove('show');
  }
});

/* ========= ВСПОМОГАТЕЛЬНОЕ ========= */
function showParticleEffect(text) {
  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.textContent = text;
  particle.style.cssText = `
    top: ${50 + (Math.random() * 20 - 10)}%;
    left: ${50 + (Math.random() * 20 - 10)}%;
    color: ${text.includes('+') ? '#22c55e' : text.includes('❌') ? '#ef4444' : '#facc15'};
    font-size: ${text.length > 10 ? '18px' : '26px'};
  `;
  
  document.body.appendChild(particle);
  
  setTimeout(() => {
    particle.remove();
  }, 1500);
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  
  if (currentLang === 'ru') {
    return d > 0 ? `${d}д ${h}ч` : h > 0 ? `${h}ч ${m}м` : `${m}м ${s}с`;
  } else {
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  }
}

/* ========= ЗАГЛУШКИ ========= */
function deposit() {
  AudioManager.playClick();
  alert(t('depositComing'));
}

function withdraw() {
  AudioManager.playClick();
  alert(t('withdrawComing'));
}

/* ========= СТАРТ ========= */
// Загружаем язык и обновляем интерфейс
updateLanguage();
renderHeader();
openScreen("home", document.querySelector(".bottom-nav button"));

// Инициализация прогресс бара
updateProgressBar();

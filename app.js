const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

/* ========= НАСТРОЙКИ ЯЗЫКА ========= */
const translations = {
  ru: {
    title: "Grok Invest",
    soundTitle: "Звук",
    langTitle: "Язык",
    musicToggleLabel: "Фоновая музыка",
    musicToggleOn: "Вкл",
    musicToggleOff: "Выкл",
    sfxLabel: "Звуки эффектов",
    musicLabel: "Громкость музыки",
    settingsInfo: "Настройки сохраняются",
    
    currency: "GRK",
    perSecond: "GRK/сек",
    
    navHome: "Главная",
    navShop: "Магазин",
    navTasks: "Задания",
    navRefs: "Рефералы",
    
    balanceTitle: "Баланс",
    incomeTitle: "Доход",
    depositBtn: "Пополнить",
    withdrawBtn: "Вывести",
    
    shopTitle: "Магазин",
    myContracts: "Мои контракты",
    availableCards: "Доступные видеокарты",
    contractIncome: "Доход",
    timeLeft: "Осталось",
    priceLabel: "Цена",
    profitLabel: "Доход за 15 дней",
    buyBtn: "Купить",
    insufficientFunds: "Недостаточно GRK",
    
    tasksTitle: "Задания",
    adsLabel: "Реклама",
    watchAdBtn: "Смотреть рекламу",
    limitReached: "Лимит исчерпан",
    
    refsTitle: "Рефералы",
    refsDesc: "5% с вывода рефералов",
    copyBtn: "Скопировать ссылку",
    copied: "Скопировано",
    
    contractCompleted: "Контракт завершён",
    purchased: "Куплено",
    limitReachedMsg: "Лимит",
    depositComing: "Пополнение позже",
    withdrawComing: "Вывод позже",
    insufficientMsg: "Недостаточно GRK"
  },
  
  en: {
    title: "Grok Invest",
    soundTitle: "Sound",
    langTitle: "Language",
    musicToggleLabel: "Background Music",
    musicToggleOn: "On",
    musicToggleOff: "Off",
    sfxLabel: "Sound Effects",
    musicLabel: "Music Volume",
    settingsInfo: "Settings saved",
    
    currency: "GRK",
    perSecond: "GRK/sec",
    
    navHome: "Home",
    navShop: "Shop",
    navTasks: "Tasks",
    navRefs: "Referrals",
    
    balanceTitle: "Balance",
    incomeTitle: "Income",
    depositBtn: "Deposit",
    withdrawBtn: "Withdraw",
    
    shopTitle: "Shop",
    myContracts: "My Contracts",
    availableCards: "Available GPUs",
    contractIncome: "Income",
    timeLeft: "Time left",
    priceLabel: "Price",
    profitLabel: "Profit for 15 days",
    buyBtn: "Buy",
    insufficientFunds: "Insufficient GRK",
    
    tasksTitle: "Tasks",
    adsLabel: "Ads",
    watchAdBtn: "Watch ad",
    limitReached: "Limit reached",
    
    refsTitle: "Referrals",
    refsDesc: "5% from referrals",
    copyBtn: "Copy link",
    copied: "Copied",
    
    contractCompleted: "Contract completed",
    purchased: "Purchased",
    limitReachedMsg: "Limit",
    depositComing: "Deposit later",
    withdrawComing: "Withdrawal later",
    insufficientMsg: "Insufficient GRK"
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

/* ========= УПРОЩЁННЫЙ АУДИО-МЕНЕДЖЕР ========= */
const AudioManager = {
  ctx: null,
  musicEnabled: localStorage.getItem('music_enabled') === 'true',
  sfxEnabled: localStorage.getItem('sfx_enabled') !== 'false',
  sfxVolume: parseFloat(localStorage.getItem('sfx_volume') || '0.5'),
  musicVolume: parseFloat(localStorage.getItem('music_volume') || '0.3'),
  
  musicInterval: null,
  
  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    document.addEventListener('click', () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }, { once: true });
    
    this.updateUI();
  },
  
  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.sfxEnabled || this.sfxVolume === 0 || !this.ctx) return;
    
    try {
      const oscillator = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gainNode.gain.setValueAtTime(this.sfxVolume * volume, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  
  playClick() {
    this.playTone(600, 0.1, 'sine', 0.2);
  },
  
  playCoin() {
    this.playTone(800, 0.1, 'sine', 0.2);
  },
  
  playBuy() {
    this.playTone(500, 0.15, 'sawtooth', 0.25);
  },
  
  playError() {
    this.playTone(300, 0.2, 'sine', 0.3);
  },
  
  playNotification() {
    this.playTone(800, 0.15, 'square', 0.2);
  },
  
  setSFXVolume(value) {
    this.sfxVolume = value / 100;
    localStorage.setItem('sfx_volume', this.sfxVolume);
    this.updateUI();
  },
  
  setMusicVolume(value) {
    this.musicVolume = value / 100;
    localStorage.setItem('music_volume', this.musicVolume);
    this.updateUI();
  },
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('music_enabled', this.musicEnabled);
    this.updateUI();
    this.playClick();
  },
  
  updateUI() {
    const sfxValue = document.getElementById('sfxValue');
    const musicValue = document.getElementById('musicValue');
    const sfxSlider = document.getElementById('sfxSlider');
    const musicSlider = document.getElementById('musicSlider');
    const musicToggleBtn = document.getElementById('musicToggleBtn');
    const musicToggleText = document.getElementById('musicToggleText');
    
    if (sfxValue) sfxValue.textContent = `${Math.round(this.sfxVolume * 100)}%`;
    if (musicValue) musicValue.textContent = `${Math.round(this.musicVolume * 100)}%`;
    
    if (sfxSlider) sfxSlider.value = this.sfxVolume * 100;
    if (musicSlider) musicSlider.value = this.musicVolume * 100;
    
    if (musicToggleBtn && musicToggleText) {
      if (this.musicEnabled) {
        musicToggleBtn.classList.remove('off');
        musicToggleText.textContent = t('musicToggleOn');
      } else {
        musicToggleBtn.classList.add('off');
        musicToggleText.textContent = t('musicToggleOff');
      }
    }
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
    
    updateProgressBar();
    
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
    const progress = Math.min(100, (totalIncome * 1000) * 20);
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
  
  const elements = {
    'settingsSoundTitle': t('soundTitle'),
    'settingsLangTitle': t('langTitle'),
    'musicToggleLabel': t('musicToggleLabel'),
    'musicToggleText': t(AudioManager.musicEnabled ? 'musicToggleOn' : 'musicToggleOff'),
    'sfxLabel': t('sfxLabel'),
    'musicLabel': t('musicLabel'),
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
  
  document.getElementById('langRu').classList.toggle('active', currentLang === 'ru');
  document.getElementById('langEn').classList.toggle('active', currentLang === 'en');
  
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  if (musicToggleBtn) {
    musicToggleBtn.classList.toggle('off', !AudioManager.musicEnabled);
  }
  
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
      
      <div class="income-display">
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

  if (state.contracts.length > 0) {
    html += `<h4 style="margin-top: 16px; color: #22c55e;">${t('myContracts')}</h4>`;

    state.contracts.forEach((c, idx) => {
      const timeLeft = formatTime(c.end - Date.now());
      const progress = Math.max(0, 100 - ((c.end - Date.now()) / (CONTRACT_DAYS * 86400000) * 100));
      
      html += `
        <div class="shop-card">
          <h4>${c.name}</h4>
          <p>${t('contractIncome')}: <strong>${c.totalProfit} ${t('currency')}</strong></p>
          <div style="background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; margin: 10px 0; overflow: hidden;">
            <div style="width: ${progress}%; height: 100%; background: #22c55e; border-radius: 2px;"></div>
          </div>
          <p>${t('timeLeft')}: <strong>${timeLeft}</strong></p>
        </div>
      `;
    });
  }

  html += `<h4 style="margin-top: 20px; color: #22c55e;">${t('availableCards')}</h4>`;

  shopItems.forEach((i, idx) => {
    const priceGRK = i.priceTon * GRK_PER_TON;
    const totalGRK = Math.round(priceGRK * (1 + i.percent));
    const canBuy = state.balance >= priceGRK;
    const profit = totalGRK - priceGRK;
    
    html += `
      <div class="shop-card">
        <h4>${i.name}</h4>
        <p>${t('priceLabel')}: <strong>${i.priceTon} TON (${priceGRK} ${t('currency')})</strong></p>
        <p>${t('profitLabel')}: <strong style="color: #22c55e;">+${profit} ${t('currency')}</strong></p>
        <button style="margin-top: 10px;" ${!canBuy ? 'disabled' : ''} onclick="buy(${idx})">
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
    : `${t('watchAdBtn')} (+${GRK_PER_AD} ${t('currency')})`;
  
  document.getElementById("screen").innerHTML = `
    <div style="text-align: center;">
      <h3>${t('tasksTitle')}</h3>
      
      <div class="shop-card" style="max-width: 280px; margin: 16px auto;">
        <h4 style="color: #facc15;">${t('adsLabel')}</h4>
        <p>${t('adsLabel')}: <strong>${state.adsToday}/${ADS_LIMIT}</strong></p>
        <p style="font-size: 13px; margin: 12px 0;">Смотрите рекламу и получайте GRK</p>
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
      
      <div class="shop-card" style="max-width: 300px; margin: 16px auto;">
        <p style="margin-bottom: 16px;">${t('refsDesc')}</p>
        
        <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin: 12px 0; font-family: monospace; word-break: break-all; font-size: 12px; border: 1px solid rgba(34,197,94,0.2);">
          https://t.me/yourbot?start=${state.referralId}
        </div>
        
        <button onclick="copyRefLink()" style="width: 100%; margin-top: 8px;">
          ${t('copyBtn')}
        </button>
      </div>
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

function toggleMusic() {
  AudioManager.toggleMusic();
  updateLanguage();
}

// Слайдер громкости звуков
document.getElementById('sfxSlider').addEventListener('input', (e) => {
  const value = e.target.value;
  AudioManager.setSFXVolume(value);
});

// Слайдер громкости музыки
document.getElementById('musicSlider').addEventListener('input', (e) => {
  const value = e.target.value;
  AudioManager.setMusicVolume(value);
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

/* ========= УПРОЩЁННЫЕ ЧАСТИЦЫ ========= */
function showParticleEffect(text) {
  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.textContent = text;
  
  let color = '#22c55e';
  if (text.includes('❌')) color = '#ef4444';
  if (text.includes(t('purchased')) || text.includes(t('contractCompleted'))) color = '#facc15';
  
  particle.style.cssText = `
    top: ${50 + (Math.random() * 20 - 10)}%;
    left: ${50 + (Math.random() * 20 - 10)}%;
    color: ${color};
    font-size: 18px;
  `;
  
  document.body.appendChild(particle);
  
  setTimeout(() => {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  }, 1000);
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  
  if (currentLang === 'ru') {
    return d > 0 ? `${d}д ${h}ч` : h > 0 ? `${h}ч ${m}м` : `${m}м`;
  } else {
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
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
updateLanguage();
renderHeader();
openScreen("home", document.querySelector(".bottom-nav button"));
updateProgressBar();

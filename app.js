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

/* ========= АУДИО-МЕНЕДЖЕР ========= */
const AudioManager = {
  ctx: null,
  sounds: {},
  music: {},
  ambient: {},
  enabled: {
    sfx: localStorage.getItem('sfx_enabled') !== 'false',
    music: localStorage.getItem('music_enabled') !== 'true',
    ambient: localStorage.getItem('ambient_enabled') !== 'false'
  },
  volumes: {
    sfx: parseFloat(localStorage.getItem('sfx_volume') || '0.5'),
    music: parseFloat(localStorage.getItem('music_volume') || '0.4'),
    ambient: parseFloat(localStorage.getItem('ambient_volume') || '0.3')
  },
  currentMusic: null,
  currentAmbient: null,
  
  init() {
    // Создаём AudioContext
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Инициализируем генераторы звуков
    this.initGenerators();
    
    // Загружаем настройки
    this.updateUI();
    
    // Запускаем фоновую музыку
    if (this.enabled.music) {
      this.playMusic('main');
    }
    
    // Запускаем атмосферные звуки
    if (this.enabled.ambient) {
      this.updateAmbient();
    }
  },
  
  initGenerators() {
    // Генераторы для UI звуков
    this.sounds = {
      click: () => this.playTone(600, 0.1, 'sine'),
      coin: () => this.playCoinSound(),
      buy: () => this.playBuySound(),
      error: () => this.playErrorSound(),
      upgrade: () => this.playUpgradeSound(),
      notification: () => this.playNotificationSound()
    };
    
    // Генераторы для музыки (осцилляторы с фильтрами)
    this.music = {
      main: () => this.playMusicLoop(0.2, 0.4),
      shop: () => this.playShopMusic(),
      chill: () => this.playChillMusic()
    };
    
    // Генераторы для атмосферных звуков
    this.ambient = {
      mining: () => this.playMiningSound(),
      fans: () => this.playFanSound(),
      electricity: () => this.playElectricitySound(),
      server: () => this.playServerSound()
    };
  },
  
  // === UI ЗВУКИ ===
  playTone(freq, duration, type = 'sine') {
    if (!this.enabled.sfx) return;
    
    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.volumes.sfx * 0.3, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    oscillator.start();
    oscillator.stop(this.ctx.currentTime + duration);
  },
  
  playCoinSound() {
    if (!this.enabled.sfx) return;
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.frequency.setValueAtTime(800 + i * 200, this.ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(this.volumes.sfx * 0.2, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(this.ctx.currentTime + 0.2);
      }, i * 50);
    }
  },
  
  playBuySound() {
    if (!this.enabled.sfx) return;
    
    const freqs = [300, 500, 700, 500, 300];
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'sine');
      }, i * 80);
    });
  },
  
  playErrorSound() {
    if (!this.enabled.sfx) return;
    
    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    oscillator.frequency.setValueAtTime(400, this.ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(this.volumes.sfx * 0.3, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(this.ctx.currentTime + 0.4);
  },
  
  playUpgradeSound() {
    if (!this.enabled.sfx) return;
    
    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    oscillator.frequency.setValueAtTime(200, this.ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(this.volumes.sfx * 0.2, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    
    oscillator.start();
    oscillator.stop(this.ctx.currentTime + 0.6);
  },
  
  playNotificationSound() {
    if (!this.enabled.sfx) return;
    
    this.playTone(800, 0.15, 'square');
    setTimeout(() => this.playTone(600, 0.15, 'square'), 150);
  },
  
  // === МУЗЫКА ===
  playMusic(type = 'main') {
    if (!this.enabled.music) return;
    
    // Останавливаем текущую музыку
    if (this.currentMusic) {
      this.stopMusic();
    }
    
    if (this.music[type]) {
      this.currentMusic = this.music[type]();
    }
  },
  
  playMusicLoop(baseFreq = 0.2, vol = 0.4) {
    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.volumes.music * vol, this.ctx.currentTime);
    
    oscillator.start();
    
    // Анимация фильтра для создания "пульсации"
    const animateFilter = () => {
      const now = this.ctx.currentTime;
      filter.frequency.setValueAtTime(800 + Math.sin(now * 2) * 200, now);
      this.filterAnimation = requestAnimationFrame(animateFilter);
    };
    
    animateFilter();
    
    return { oscillator, gainNode, filter, animate: this.filterAnimation };
  },
  
  playShopMusic() {
    // Более энергичная музыка для магазина
    return this.playMusicLoop(0.3, 0.3);
  },
  
  playChillMusic() {
    // Расслабляющая музыка
    return this.playMusicLoop(0.15, 0.25);
  },
  
  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.oscillator.stop();
      cancelAnimationFrame(this.currentMusic.animate);
      this.currentMusic = null;
    }
  },
  
  // === АТМОСФЕРНЫЕ ЗВУКИ ===
  updateAmbient() {
    if (!this.enabled.ambient) return;
    
    // Останавливаем текущие атмосферные звуки
    if (this.currentAmbient) {
      this.stopAmbient();
    }
    
    // Определяем какие звуки проигрывать на основе дохода
    const income = state.contracts.reduce((s, c) => s + c.incomePerSec, 0);
    
    if (income > 0.01) {
      // Если есть доход - играем звуки майнинга
      this.currentAmbient = this.ambient.mining();
      
      // Добавляем вентиляторы если доход высокий
      if (income > 0.1) {
        setTimeout(() => {
          this.ambient.fans();
        }, 1000);
      }
    } else {
      // Иначе играем фоновый шум серверной
      this.currentAmbient = this.ambient.server();
    }
  },
  
  playMiningSound() {
    const noise = this.createBrownNoise();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    filter.Q.setValueAtTime(1, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.volumes.ambient * 0.2, this.ctx.currentTime);
    
    // Периодические щелчки
    setInterval(() => {
      if (this.enabled.ambient) {
        this.playTone(100 + Math.random() * 50, 0.05, 'sawtooth');
      }
    }, 800 + Math.random() * 1000);
    
    return { noise, gainNode, filter };
  },
  
  playFanSound() {
    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(120, this.ctx.currentTime);
    
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(10, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.volumes.ambient * 0.15, this.ctx.currentTime);
    
    oscillator.start();
    lfo.start();
    
    return { oscillator, gainNode, lfo };
  },
  
  playElectricitySound() {
    const interval = setInterval(() => {
      if (!this.enabled.ambient) return;
      
      const duration = 0.1 + Math.random() * 0.2;
      const oscillator = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1000 + Math.random() * 2000, this.ctx.currentTime);
      
      gainNode.gain.setValueAtTime(this.volumes.ambient * 0.1, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(this.ctx.currentTime + duration);
    }, 3000 + Math.random() * 5000);
    
    return { interval };
  },
  
  playServerSound() {
    const noise = this.createPinkNoise();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.volumes.ambient * 0.1, this.ctx.currentTime);
    
    return { noise, gainNode, filter };
  },
  
  createBrownNoise() {
    const bufferSize = 4096;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    
    return source;
  },
  
  createPinkNoise() {
    const bufferSize = 4096;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    
    return source;
  },
  
  stopAmbient() {
    if (this.currentAmbient) {
      if (this.currentAmbient.oscillator) this.currentAmbient.oscillator.stop();
      if (this.currentAmbient.noise) this.currentAmbient.noise.stop();
      if (this.currentAmbient.lfo) this.currentAmbient.lfo.stop();
      if (this.currentAmbient.interval) clearInterval(this.currentAmbient.interval);
      this.currentAmbient = null;
    }
  },
  
  // === УПРАВЛЕНИЕ ===
  play(name) {
    if (this.sounds[name]) {
      this.sounds[name]();
    }
  },
  
  toggleSFX() {
    this.enabled.sfx = !this.enabled.sfx;
    localStorage.setItem('sfx_enabled', this.enabled.sfx);
    this.updateUI();
    
    if (this.enabled.sfx) {
      this.play('click');
    }
  },
  
  toggleMusic() {
    this.enabled.music = !this.enabled.music;
    localStorage.setItem('music_enabled', this.enabled.music);
    
    if (this.enabled.music) {
      this.playMusic('main');
    } else {
      this.stopMusic();
    }
    
    this.updateUI();
  },
  
  toggleAmbient() {
    this.enabled.ambient = !this.enabled.ambient;
    localStorage.setItem('ambient_enabled', this.enabled.ambient);
    
    if (this.enabled.ambient) {
      this.updateAmbient();
    } else {
      this.stopAmbient();
    }
    
    this.updateUI();
  },
  
  setVolume(type, value) {
    const vol = value / 100;
    this.volumes[type] = vol;
    localStorage.setItem(`${type}_volume`, vol);
    
    // Обновляем громкость активных звуков
    if (type === 'music' && this.currentMusic) {
      this.currentMusic.gainNode.gain.setValueAtTime(vol * 0.4, this.ctx.currentTime);
    }
    
    this.updateUI();
  },
  
  updateUI() {
    // Обновляем иконки
    const sfxIcon = document.getElementById('sfxIcon');
    const musicIcon = document.getElementById('musicIcon');
    const ambientIcon = document.getElementById('ambientIcon');
    
    if (sfxIcon) {
      sfxIcon.innerHTML = this.enabled.sfx ? 
        `<path d="M12 2L9 5H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3l3 3v-16Z"/>
         <path d="M17 9a5 5 0 0 1 0 6"/>
         <path d="M19 7a9 9 0 0 1 0 10"/>` :
        `<path d="M12 2L9 5H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3l3 3v-16Z"/>
         <line x1="2" y1="2" x2="22" y2="22"/>
         <path d="M18 9a5 5 0 0 1 0 6"/>
         <path d="M20 7a9 9 0 0 1 0 10"/>`;
      
      document.getElementById('sfxBtn').classList.toggle('muted', !this.enabled.sfx);
    }
    
    if (musicIcon) {
      musicIcon.innerHTML = this.enabled.music ? 
        `<path d="M9 18V5l12-2v13"/>
         <circle cx="6" cy="18" r="3"/>
         <circle cx="18" cy="16" r="3"/>` :
        `<path d="M9 18V5l12-2v13"/>
         <circle cx="6" cy="18" r="3"/>
         <circle cx="18" cy="16" r="3"/>
         <line x1="9" y1="5" x2="9" y2="18" stroke-width="2"/>`;
      
      document.getElementById('musicBtn').classList.toggle('muted', !this.enabled.music);
    }
    
    if (ambientIcon) {
      ambientIcon.innerHTML = this.enabled.ambient ? 
        `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
         <path d="M13.73 21a2 2 0 0 1-3.46 0"/>` :
        `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
         <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
         <line x1="2" y1="2" x2="22" y2="22"/>`;
      
      document.getElementById('ambientBtn').classList.toggle('muted', !this.enabled.ambient);
      document.getElementById('ambientIndicator').style.display = this.enabled.ambient ? 'flex' : 'none';
    }
    
    // Обновляем значения слайдеров
    document.getElementById('sfxValue').textContent = `${Math.round(this.volumes.sfx * 100)}%`;
    document.getElementById('musicValue').textContent = `${Math.round(this.volumes.music * 100)}%`;
    document.getElementById('ambientValue').textContent = `${Math.round(this.volumes.ambient * 100)}%`;
    
    document.getElementById('sfxSlider').value = this.volumes.sfx * 100;
    document.getElementById('musicSlider').value = this.volumes.music * 100;
    document.getElementById('ambientSlider').value = this.volumes.ambient * 100;
  }
};

// Инициализация аудио
AudioManager.init();

// Разрешаем автоплей при первом клике
document.addEventListener('click', function initAudio() {
  if (AudioManager.ctx && AudioManager.ctx.state === 'suspended') {
    AudioManager.ctx.resume();
  }
  document.removeEventListener('click', initAudio);
});

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
      // Контракт завершился - проигрываем звук
      AudioManager.play('notification');
      showParticleEffect('✅ Контракт завершён!');
      return false;
    }
    income += c.incomePerSec;
    return true;
  });

  if (income > 0) {
    state.balance += income;
    save();
    renderHeader();
    renderHome();
    
    // Обновляем атмосферные звуки если доход изменился
    AudioManager.updateAmbient();
    
    // Визуальный эффект для активных контрактов
    document.querySelectorAll('.shop-card').forEach((card, index) => {
      if (index < state.contracts.length) {
        card.classList.add('contract-active');
        setTimeout(() => card.classList.remove('contract-active'), 300);
      }
    });
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
  AudioManager.play('click');
  
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
      <p style="font-size: 12px; opacity: 0.7; margin-top: 10px;">
        🎵 Атмосферные звуки: ${income > 0.01 ? '⛏️ Майнинг' : '🌀 Серверная'}
      </p>

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

    state.contracts.forEach((c, idx) => {
      const timeLeft = formatTime(c.end - Date.now());
      const progress = Math.max(0, 100 - ((c.end - Date.now()) / (CONTRACT_DAYS * 86400000) * 100));
      
      html += `
        <div class="shop-card" id="contract-${idx}">
          <strong>${c.name}</strong>
          <p>Доход: ${c.totalProfit} GRK</p>
          <div style="background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin: 8px 0; overflow: hidden;">
            <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #22c55e, #3b82f6);"></div>
          </div>
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
    const canBuy = state.balance >= priceGRK;
    
    html += `
      <div class="shop-card" style="border-color: ${canBuy ? 'rgba(34,197,94,0.5)' : 'rgba(255,0,0,0.3)'}">
        <h4>${i.name}</h4>
        <p>Цена: ${i.priceTon} TON (${priceGRK} GRK)</p>
        <p>Доход за 15 дней: +${totalGRK - priceGRK} GRK</p>
        <button ${!canBuy ? 'disabled' : ''} onclick="buy(${idx})">
          ${canBuy ? 'Купить' : 'Недостаточно GRK'}
        </button>
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
    <button onclick="watchAd()" ${state.adsToday >= ADS_LIMIT ? 'disabled' : ''}>
      ${state.adsToday >= ADS_LIMIT ? 'Лимит исчерпан' : `Смотреть рекламу (+${GRK_PER_AD} GRK)`}
    </button>
  `;
}

function renderRefs() {
  document.getElementById("screen").innerHTML = `
    <h3>👥 Рефералы</h3>
    <p>5% с вывода рефералов</p>
    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; margin: 10px 0; font-family: monospace; word-break: break-all;">
      https://t.me/yourbot?start=${state.referralId}
    </div>
    <button onclick="copyRefLink()" style="margin-top: 10px;">📋 Скопировать ссылку</button>
  `;
}

/* ========= ДЕЙСТВИЯ ========= */
function buy(i) {
  const item = shopItems[i];
  const priceGRK = item.priceTon * GRK_PER_TON;

  if (state.balance < priceGRK) {
    AudioManager.play('error');
    showParticleEffect('❌ Недостаточно GRK');
    return;
  }

  AudioManager.play('buy');
  AudioManager.play('upgrade');
  
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
  
  showParticleEffect('🎉 Куплено!');
  
  // Обновляем атмосферные звуки
  AudioManager.updateAmbient();
  
  // Переходим в магазин с задержкой
  setTimeout(() => {
    openScreen('shop', document.querySelectorAll('.bottom-nav button')[1]);
  }, 800);
}

function watchAd() {
  if (state.adsToday >= ADS_LIMIT) {
    AudioManager.play('error');
    showParticleEffect('⚠️ Лимит');
    return;
  }

  AudioManager.play('click');
  AudioManager.play('coin');
  
  state.adsToday++;
  state.balance += GRK_PER_AD;
  save();
  renderHeader();
  
  showParticleEffect(`+${GRK_PER_AD} GRK`);
  
  // Обновляем экран задач
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
    AudioManager.play('notification');
    showParticleEffect('📋 Скопировано!');
  });
}

/* ========= УПРАВЛЕНИЕ АУДИО ========= */
function toggleSFX() {
  AudioManager.toggleSFX();
}

function toggleMusic() {
  AudioManager.toggleMusic();
}

function toggleAmbient() {
  AudioManager.toggleAmbient();
}

function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('show');
  AudioManager.play('click');
}

// Настройки слайдеров
document.getElementById('sfxSlider').addEventListener('input', (e) => {
  const value = e.target.value;
  document.getElementById('sfxValue').textContent = `${value}%`;
  AudioManager.setVolume('sfx', value);
});

document.getElementById('musicSlider').addEventListener('input', (e) => {
  const value = e.target.value;
  document.getElementById('musicValue').textContent = `${value}%`;
  AudioManager.setVolume('music', value);
});

document.getElementById('ambientSlider').addEventListener('input', (e) => {
  const value = e.target.value;
  document.getElementById('ambientValue').textContent = `${value}%`;
  AudioManager.setVolume('ambient', value);
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
    font-size: ${text.length > 10 ? '16px' : '24px'};
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
  return d > 0 ? `${d}д ${h}ч` : h > 0 ? `${h}ч ${m}м` : `${m}м ${s}с`;
}

/* ========= ЗАГЛУШКИ ========= */
function deposit() {
  AudioManager.play('click');
  alert("Пополнение будет подключено позже");
}

function withdraw() {
  AudioManager.play('click');
  alert("Вывод будет подключён позже");
}

/* ========= СТАРТ ========= */
renderHeader();
openScreen("home", document.querySelector(".bottom-nav button"));

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

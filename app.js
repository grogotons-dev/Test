// ========== ОРИГИНАЛЬНЫЙ КОД ПРИЛОЖЕНИЯ ==========
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

/* ========= ВАША ФОНОВАЯ МУЗЫКА ========= */
const BackgroundMusic = {
    audioElement: null,
    isEnabled: localStorage.getItem('music_enabled') !== 'false',
    volume: parseFloat(localStorage.getItem('music_volume') || '0.3'),
    sfxEnabled: localStorage.getItem('sfx_enabled') !== 'false',
    sfxVolume: parseFloat(localStorage.getItem('sfx_volume') || '0.5'),
    
    init() {
        this.audioElement = document.getElementById('backgroundMusic');
        
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
            this.audioElement.loop = true;
            
            // Запускаем музыку сразу после инициализации
            console.log("🎵 Инициализация музыки...");
            this.autoPlay();
            
            this.updateSettingsUI();
        }
        
        this.initSFX();
    },
    
    autoPlay() {
        if (!this.isEnabled || !this.audioElement) return;
        
        console.log("🎵 Пытаемся запустить музыку...");
        const playPromise = this.audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("🎵 Музыка запущена успешно");
            }).catch(error => {
                console.log("Автозапуск заблокирован:", error);
                // Автозапуск на клик пользователя
                const playOnClick = () => {
                    this.play();
                    document.removeEventListener('click', playOnClick);
                };
                document.addEventListener('click', playOnClick);
            });
        }
    },
    
    play() {
        if (!this.isEnabled || !this.audioElement) return;
        
        this.audioElement.play()
            .then(() => {
                console.log("🎵 Музыка играет");
            })
            .catch(error => {
                console.log("Ошибка воспроизведения:", error);
            });
    },
    
    pause() {
        if (this.audioElement) {
            this.audioElement.pause();
        }
    },
    
    setVolume(value) {
        this.volume = value / 100;
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
        localStorage.setItem('music_volume', this.volume);
        this.updateSettingsUI();
    },
    
    setSFXVolume(value) {
        this.sfxVolume = value / 100;
        localStorage.setItem('sfx_volume', this.sfxVolume);
        this.updateSettingsUI();
    },
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('music_enabled', this.isEnabled);
        
        if (this.isEnabled) {
            this.play();
        } else {
            this.pause();
        }
        
        this.updateSettingsUI();
        this.playClickSound();
        return this.isEnabled;
    },
    
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        localStorage.setItem('sfx_enabled', this.sfxEnabled);
        this.playClickSound();
        return this.sfxEnabled;
    },
    
    updateSettingsUI() {
        const sfxValue = document.getElementById('sfxValue');
        const musicValue = document.getElementById('musicValue');
        const sfxSlider = document.getElementById('sfxSlider');
        const musicSlider = document.getElementById('musicSlider');
        const musicToggleBtn = document.getElementById('musicToggleBtn');
        
        if (sfxValue) sfxValue.textContent = `${Math.round(this.sfxVolume * 100)}%`;
        if (musicValue) musicValue.textContent = `${Math.round(this.volume * 100)}%`;
        
        if (sfxSlider) sfxSlider.value = this.sfxVolume * 100;
        if (musicSlider) musicSlider.value = this.volume * 100;
        
        if (musicToggleBtn) {
            if (this.isEnabled) {
                musicToggleBtn.classList.remove('off');
                musicToggleBtn.textContent = 'Вкл';
            } else {
                musicToggleBtn.classList.add('off');
                musicToggleBtn.textContent = 'Выкл';
            }
        }
    },
    
    initSFX() {
        this.audioContext = null;
    },
    
    playClickSound() {
        if (!this.sfxEnabled || this.sfxVolume === 0) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {}
    },
    
    playCoinSound() {
        if (!this.sfxEnabled || this.sfxVolume === 0) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(this.sfxVolume * 0.25, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {}
    }
};

/* ========= ADSGRAM ИНТЕГРАЦИЯ (БЕЗ СЕРВЕРА) ========= */
const AdsGramManager = {
    isInitialized: false,
    videoAdReward: 45,
    unitId: 'task-20549',
    
    init() {
        console.log("🎬 Инициализация AdsGram (без сервера)...");
        
        // Ждем загрузки AdsGram SDK
        if (typeof window.AdsGram === 'undefined') {
            console.log("⏳ Ждем загрузки AdsGram SDK...");
            this.waitForAdsGram();
            return;
        }
        
        this.initializeAdsGram();
    },
    
    waitForAdsGram() {
        // Проверяем каждые 500ms
        const checkInterval = setInterval(() => {
            if (typeof window.AdsGram !== 'undefined') {
                clearInterval(checkInterval);
                console.log("✅ AdsGram SDK загружен!");
                this.initializeAdsGram();
            }
        }, 500);
        
        // Таймаут 10 секунд
        setTimeout(() => {
            clearInterval(checkInterval);
            if (typeof window.AdsGram === 'undefined') {
                console.error("❌ AdsGram SDK не загрузился за 10 секунд");
                this.setupFallbackMode();
            }
        }, 10000);
    },
    
    initializeAdsGram() {
        try {
            const userId = this.getUserId();
            console.log("👤 User ID для AdsGram:", userId);
            
            // Инициализация AdsGram БЕЗ rewardCallbackUrl
            window.AdsGram.init({
                userId: userId,
                unitId: this.unitId,
                platform: 'telegram',
                onReady: () => {
                    console.log("✅ AdsGram SDK успешно инициализирован");
                    this.isInitialized = true;
                    
                    // Настраиваем обработчики рекламы
                    this.setupAdHandlers();
                    
                    // Проверяем доступность рекламы
                    this.checkAdAvailability();
                    
                    // Обновляем кнопку
                    this.updateAdButtonState(true);
                },
                onError: (error) => {
                    console.error("❌ Ошибка инициализации AdsGram:", error);
                    this.isInitialized = false;
                    this.setupFallbackMode();
                }
            });
            
        } catch (error) {
            console.error("Ошибка при инициализации AdsGram:", error);
            this.setupFallbackMode();
        }
    },
    
    setupAdHandlers() {
        if (typeof window.AdsGram === 'undefined') return;
        
        console.log("⚙️ Настройка обработчиков рекламы...");
        
        window.AdsGram.setupRewardedAd({
            onRewarded: (reward) => {
                console.log("🎉 Пользователь получил награду:", reward);
                this.handleAdReward();
            },
            onAdClosed: () => {
                console.log("📺 Реклама закрыта");
                this.updateAdButtonState();
            },
            onAdFailed: (error) => {
                console.error("❌ Ошибка загрузки рекламы:", error);
                this.showAdError("Не удалось загрузить рекламу. Попробуйте позже.");
                this.updateAdButtonState();
            },
            onAdLoaded: () => {
                console.log("✅ Реклама загружена и готова к показу");
                this.updateAdButtonState(true);
            },
            onAdOpened: () => {
                console.log("📱 Реклама открыта");
            }
        });
    },
    
    setupFallbackMode() {
        console.log("🔄 Включение fallback режима (без AdsGram)...");
        this.isInitialized = true; // Все равно считаем инициализированным
        
        // Обновляем кнопку для fallback режима
        this.updateAdButtonState(true);
        
        // Показываем уведомление в консоли
        console.log("ℹ️ Используется fallback режим. Реклама будет имитироваться.");
    },
    
    getUserId() {
        // Используем Telegram user ID или наш referral ID
        if (tg?.initDataUnsafe?.user?.id) {
            return tg.initDataUnsafe.user.id.toString();
        }
        return state.referralId;
    },
    
    async checkAdAvailability() {
        if (!this.isInitialized || typeof window.AdsGram === 'undefined') {
            console.log("🔍 AdsGram не доступен, используем fallback");
            this.updateAdButtonState(true); // Все равно показываем кнопку
            return true;
        }
        
        try {
            const isAvailable = await window.AdsGram.isAdAvailable(this.unitId);
            console.log("🔍 Реклама доступна:", isAvailable);
            this.updateAdButtonState(isAvailable);
            return isAvailable;
        } catch (error) {
            console.warn("⚠️ Ошибка проверки доступности:", error);
            this.updateAdButtonState(true); // При ошибке все равно показываем
            return true;
        }
    },
    
    updateAdButtonState(isAvailable = false) {
        const adButton = document.getElementById('watchVideoAdBtn');
        if (!adButton) return;
        
        if (!this.isInitialized) {
            adButton.disabled = true;
            adButton.textContent = '🎬 Инициализация...';
            adButton.style.opacity = '0.7';
            return;
        }
        
        // Всегда разрешаем нажать (даже если реклама "не доступна")
        adButton.disabled = false;
        
        if (typeof window.AdsGram === 'undefined') {
            // Fallback режим
            adButton.textContent = `🎬 Смотреть видео (+${this.videoAdReward} ${t('currency')})`;
            adButton.style.opacity = '1';
            adButton.title = "Имитация рекламы (AdsGram не загружен)";
        } else if (!isAvailable) {
            // AdsGram есть, но рекламы нет
            adButton.textContent = `🎬 Попробовать (+${this.videoAdReward} ${t('currency')})`;
            adButton.style.opacity = '0.9';
            adButton.title = "Реклама может быть недоступна";
        } else {
            // Все ок
            adButton.textContent = `🎬 Смотреть видео (+${this.videoAdReward} ${t('currency')})`;
            adButton.style.opacity = '1';
            adButton.title = "";
        }
    },
    
    async showRewardedAd() {
        console.log("🎬 Запрос на показ рекламы...");
        
        // Всегда разрешаем (даже если AdsGram не инициализирован)
        if (!this.isInitialized) {
            console.log("⚠️ AdsGram не инициализирован, но показываем fallback");
        }
        
        // Блокируем кнопку
        const adButton = document.getElementById('watchVideoAdBtn');
        if (adButton) {
            adButton.disabled = true;
            adButton.textContent = '🌀 Загрузка...';
        }
        
        try {
            // Пытаемся через AdsGram если доступен
            if (typeof window.AdsGram !== 'undefined' && window.AdsGram.showRewardedAd) {
                console.log("🎬 Показ через AdsGram...");
                
                const result = await window.AdsGram.showRewardedAd(this.unitId);
                
                if (result?.success) {
                    console.log("✅ Реклама показана через AdsGram");
                    // Награду начислит onRewarded callback
                    return true;
                } else {
                    console.log("⚠️ AdsGram не смог показать, используем fallback");
                    return this.showFallbackAd();
                }
            } else {
                // AdsGram не доступен - используем fallback
                console.log("🎬 Используем fallback рекламу");
                return this.showFallbackAd();
            }
            
        } catch (error) {
            console.error("❌ Ошибка:", error);
            return this.showFallbackAd();
        } finally {
            // Восстанавливаем кнопку через 3 секунды
            setTimeout(() => {
                this.updateAdButtonState();
            }, 3000);
        }
    },
    
    async showFallbackAd() {
        console.log("🎬 Показ fallback рекламы (имитация)...");
        
        // Показываем "имитацию" рекламы
        showParticleEffect("🎬 Загрузка рекламы...");
        
        // Имитируем задержку просмотра рекламы (3 секунды)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Начисляем награду
        this.handleAdReward();
        
        return true;
    },
    
    handleAdReward() {
        console.log("💰 Начисление награды за рекламу");
        
        BackgroundMusic.playCoinSound();
        state.balance += this.videoAdReward;
        save();
        renderHeader();
        
        showParticleEffect(`🎬 +${this.videoAdReward} ${t('currency')}`);
        
        // Обновляем экран заданий
        setTimeout(() => {
            renderTasks();
        }, 500);
    },
    
    showAdError(message) {
        console.warn("⚠️ Ошибка рекламы:", message);
        showParticleEffect("❌ " + message);
        BackgroundMusic.playCoinSound();
    }
};

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
        settingsInfo: "💡 Настройки сохраняются автоматически",
        
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
        adsLabel: "Видео реклама",
        videoAdLabel: "Видео реклама",
        watchAdBtn: "Смотреть видео",
        watchVideoAdBtn: "Смотреть видео",
        adLoading: "Загрузка рекламы...",
        adNotAvailable: "Реклама не доступна",
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
        settingsInfo: "💡 Settings are saved automatically",
        
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
        adsLabel: "Video Ads",
        videoAdLabel: "Video Ad",
        watchAdBtn: "Watch video",
        watchVideoAdBtn: "Watch video",
        adLoading: "Loading ad...",
        adNotAvailable: "Ad not available",
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

/* ========= СОСТОЯНИЕ ========= */
let state = JSON.parse(localStorage.getItem("grok_final")) || {
    balance: 0,
    contracts: [],
    referralId: Math.random().toString(36).slice(2, 10)
};

let currentLang = localStorage.getItem('grok_lang') || 'ru';

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
            BackgroundMusic.playCoinSound();
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
        'musicToggleText': t(BackgroundMusic.isEnabled ? 'musicToggleOn' : 'musicToggleOff'),
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
    
    // Обновляем элементы с ID
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = elements[id];
    });
    
    // Обновляем навигацию
    const navButtons = document.querySelectorAll('.bottom-nav button');
    if (navButtons.length >= 4) {
        navButtons[0].textContent = t('navHome');
        navButtons[1].textContent = t('navShop');
        navButtons[2].textContent = t('navTasks');
        navButtons[3].textContent = t('navRefs');
    }
    
    document.getElementById('langRu').classList.toggle('active', currentLang === 'ru');
    document.getElementById('langEn').classList.toggle('active', currentLang === 'en');
    
    const musicToggleBtn = document.getElementById('musicToggleBtn');
    if (musicToggleBtn) {
        musicToggleBtn.classList.toggle('off', !BackgroundMusic.isEnabled);
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
    
    BackgroundMusic.playClickSound();
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
    BackgroundMusic.playClickSound();
    
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
    document.getElementById("screen").innerHTML = `
        <div style="text-align: center;">
            <h3>${t('tasksTitle')}</h3>
            
            <div class="shop-card" style="max-width: 280px; margin: 16px auto; background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3);">
                <h4 style="color: #3b82f6;">🎬 ${t('videoAdLabel')}</h4>
                <p style="font-size: 13px; margin: 12px 0;">Посмотрите видео рекламу и получите ${AdsGramManager.videoAdReward} ${t('currency')}</p>
                <p style="font-size: 12px; margin: 8px 0; color: #3b82f6; font-weight: 600;">
                    Без лимита! Смотрите сколько угодно раз
                </p>
                <button id="watchVideoAdBtn" onclick="watchVideoAd()" style="width: 100%; background: linear-gradient(135deg, #3b82f6, #8b5cf6);">
                    🎬 Загрузка...
                </button>
                <p style="font-size: 11px; margin-top: 8px; opacity: 0.7;">Powered by AdsGram</p>
            </div>
            
            <!-- Информация о статусе -->
            <div id="adStatus" style="margin-top: 20px; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 10px; font-size: 12px;">
                <div>📊 Статус: <span id="statusText">Проверка...</span></div>
                <div id="statusDetails" style="margin-top: 5px; font-size: 11px; opacity: 0.8;"></div>
            </div>
        </div>
    `;
    
    // Обновляем статус
    setTimeout(() => {
        this.updateAdStatus();
    }, 100);
}

function updateAdStatus() {
    const statusText = document.getElementById('statusText');
    const statusDetails = document.getElementById('statusDetails');
    
    if (!statusText || !statusDetails) return;
    
    if (typeof window.AdsGram === 'undefined') {
        statusText.innerHTML = '<span style="color: #facc15;">⚠️ AdsGram SDK не загружен</span>';
        statusDetails.textContent = 'Используется fallback режим (имитация рекламы)';
    } else if (!AdsGramManager.isInitialized) {
        statusText.innerHTML = '<span style="color: #facc15;">🔄 Инициализация...</span>';
        statusDetails.textContent = 'Подключение к рекламному сервису';
    } else {
        statusText.innerHTML = '<span style="color: #22c55e;">✅ Реклама доступна</span>';
        statusDetails.textContent = 'Нажмите кнопку для просмотра рекламы';
    }
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
        BackgroundMusic.playCoinSound();
        showParticleEffect(t('insufficientMsg'));
        return;
    }

    BackgroundMusic.playCoinSound();
    
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

async function watchVideoAd() {
    console.log("🎬 Нажата кнопка видео рекламы");
    
    const success = await AdsGramManager.showRewardedAd();
    
    if (!success) {
        showParticleEffect("🎬 Попробуйте позже");
    }
}

function copyRefLink() {
    const link = `https://t.me/yourbot?start=${state.referralId}`;
    navigator.clipboard.writeText(link).then(() => {
        BackgroundMusic.playCoinSound();
        showParticleEffect(t('copied'));
    });
}

/* ========= УПРАВЛЕНИЕ НАСТРОЙКАМИ ========= */
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('show');
    BackgroundMusic.playClickSound();
}

function toggleMusic() {
    BackgroundMusic.toggle();
    updateLanguage();
}

// Инициализация слайдеров громкости
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOM загружен, инициализация приложения...");
    
    // Инициализируем музыку СРАЗУ
    BackgroundMusic.init();
    
    const sfxSlider = document.getElementById('sfxSlider');
    const musicSlider = document.getElementById('musicSlider');
    
    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            BackgroundMusic.setSFXVolume(value);
        });
    }
    
    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            BackgroundMusic.setVolume(value);
        });
    }
    
    // Закрытие настроек при клике вне панели
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('settingsPanel');
        const btn = document.querySelector('.settings-btn');
        
        if (panel && panel.classList.contains('show') && 
            btn && !panel.contains(e.target) && 
            !btn.contains(e.target)) {
            panel.classList.remove('show');
        }
    });
});

/* ========= УПРОЩЁННЫЕ ЧАСТИЦЫ ========= */
function showParticleEffect(text) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = text;
    
    let color = '#22c55e';
    if (text.includes('❌') || text.includes('Недостаточно') || text.includes('Insufficient') || text.includes('Ошибка') || text.includes('Error')) color = '#ef4444';
    if (text.includes(t('purchased')) || text.includes(t('contractCompleted')) || text.includes('Куплено')) color = '#facc15';
    if (text.includes(t('copied')) || text.includes('Copied')) color = '#3b82f6';
    if (text.includes('+') && text.includes('GRK')) color = '#22c55e';
    if (text.includes('🎬')) color = '#3b82f6';
    
    particle.style.cssText = `
        color: ${color};
        font-size: 18px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
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
    BackgroundMusic.playClickSound();
    alert(t('depositComing'));
}

function withdraw() {
    BackgroundMusic.playClickSound();
    alert(t('withdrawComing'));
}

/* ========= ЗАПУСК ПРИЛОЖЕНИЯ ========= */
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Запуск приложения Grok Invest...");
    
    // Основная инициализация
    setTimeout(() => {
        updateLanguage();
        renderHeader();
        
        // Открываем экран "Главная" с активной кнопкой
        const homeButton = document.querySelector('.bottom-nav button');
        if (homeButton) {
            homeButton.classList.add('active');
            openScreen("home", homeButton);
        }
        
        updateProgressBar();
        
        // Инициализируем AdsGram с задержкой
        setTimeout(() => {
            AdsGramManager.init();
        }, 2000);
        
        console.log("✅ Приложение инициализировано");
        
    }, 1000);
});

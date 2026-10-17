// game/main.js
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
    document.body.classList.add('is-mobile');
}

const gameCanvas = document.getElementById('gameCanvas');
let lastTime = 0;
window.totalPlayTime = 0;

function saveTotalTime() {
    if (window.Cloud && window.Cloud.playerData) {
        window.Cloud.playerData.stats.timePlayed = totalPlayTime;
        window.Cloud.saveData(window.Cloud.playerData);
    }
}

window.syncTimeFromCloud = function(cloudTime) {
    window.totalPlayTime = cloudTime || 0; 
    updateTotalTimeUI(); 
    console.log("Time synced from cloud:", totalPlayTime);
}

// AUDIO
const audioMenu = document.getElementById('audio-menu');
const audioGame = document.getElementById('audio-game'); 

let savedVol = localStorage.getItem('bonebound_volume');
let musicVolume = savedVol !== null ? parseFloat(savedVol) : 0.3;

let musicPlaylist = [1, 2, 3, 4, 5, 6, 7, 8];
let currentTrackIndex = 0;

function playNextGameTrack() {
    if (currentTrackIndex >= musicPlaylist.length) {
        shuffleArray(musicPlaylist);
        currentTrackIndex = 0;
    }
    let trackNum = musicPlaylist[currentTrackIndex];
    currentTrackIndex++;
    
    audioGame.src = `songs/song${trackNum}.mp3`;
    audioGame.volume = musicVolume;
    audioGame.play().catch(e => console.log("Audio autoplay blocked:", e));
}
audioGame.onended = () => playNextGameTrack();

document.getElementById('vol-slider').value = Math.floor(musicVolume * 100);
document.getElementById('vol-val').innerText = Math.floor(musicVolume * 100) + '%';
audioMenu.volume = musicVolume;

window.addEventListener('click', () => { 
    if (gameState === 'MENU' && audioMenu.paused) audioMenu.play().catch(()=>{}); 
}, {once:true});

// INPUT
window.keys = {};
window.addEventListener('keydown', e => { 
    keys[e.code] = true; 
    if (e.code === "Escape" && gameState !== 'MENU' && gameState !== 'SETTINGS') togglePause(); 
});
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousedown', () => { if(gameState === 'PLAYING') gameCanvas.focus(); });
window.addEventListener('blur', () => { for (let k in keys) keys[k] = false; });

// START GAME
function startGame(hero) {
    // --- FIX: СКРЫВАЕМ ВСЕ МЕНЮ ПРИНУДИТЕЛЬНО ---
    const menusToHide = [
        'start-screen', 'pvp-menu-screen', 'matchmaking-screen', 
        'pvp-lobby-screen', 'pvp-ranked-hub', 'char-select-screen', 
        'pvp-results-screen', 'pvp-wait-screen', 'gameover-screen'
    ];
    menusToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    // ---------------------------------------------
    document.getElementById('gameCanvas').classList.remove('game-hidden');
    document.getElementById('ui-layer').classList.remove('game-hidden');
    if (isMobile && window.initMobileControls) window.initMobileControls();

    player.hp = player.maxHp; 
    document.getElementById('ui-layer').style.display = 'block';
    document.getElementById('gameCanvas').classList.remove('grayscale-filter');

    gameTime = 0;
    stageStartTime = 0;
    isEndlessMode = false;

    // --- СБРОС СОСТОЯНИЯ ПРЕДЫДУЩЕГО ЗАБЕГА ---
    pendingActions = [];
    soulStoneStage = 0; soulStoneStartKills = null;
    if (DB.items.soul_stone) DB.items.soul_stone.img = 'soulstone1.png';
    stopwatchTimer = 90; isTimeFrozen = false; freezeTimer = 0;
    const freezeOverlay = document.getElementById('freeze-overlay');
    if (freezeOverlay) freezeOverlay.classList.remove('active');
    bossPhase = 1;
    player.stunTimer = 0; player.fragileTimer = 0;
    
    const stTimer = document.getElementById('stage-timer');
    if(stTimer) { stTimer.innerText = "10:00"; stTimer.classList.remove('critical'); }
    const gTimer = document.getElementById('timer');
    if(gTimer) gTimer.innerText = "00:00";

    enemies = []; enemyProjectiles = []; enemyGroundEffects = []; visualEffects = [];
    drops = []; chests = []; portals = []; anvils = []; traders = []; projectiles = [];
    damageNumbers = []; firePools = [];
    
    gameState = 'PLAYING';
    kills = 0; currentChestCost = 20; monumentReq = 5;
    banishCount = 3; 
    if (!window.RTDB || !window.RTDB.currentBattleId) {
        banishedList = [];
    }
    
    rerollsLeft = 3; statRerollsLeft = 3;
    
    currentStage = 1; stageTime = 600;
    bossesSpawned = { mini1: false, mini2: false, boss: false, bossDead: false, waitingForBoss: false, waitTimer: 0, anvil: false };
    merchantSpawned = false;

    enemies = []; drops = []; chests = []; projectiles = []; firePools = []; monuments = [];
    player.weapons = []; player.items = {}; 
    player.cursedItems = {};
    player.merchantItems = [];
    
    generateMap(1);

    player.stats = { 
        might: 1.0, cooldown: 0, moveSpeed: 1.0, projSpeed: 1.0, 
        area: 0, magnet: 50, luck: 0, amount: 0, curse: 0, 
        vampChance: 0, vampPower: 0, growth: 0, greed: 0, 
        duration: 1.0, size: 1.0, critChance: 0, critDamage: 1.0,
        hpRegen: 0, evasion: 0, 
        thorns: 0, shopDefense: 0       
    };

    if (DB.characters && DB.characters[hero]) {
        let charData = DB.characters[hero];
        if (charData.stats) {
            for (let key in charData.stats) {
                if (key === 'maxHp') { /* ... */ } 
                else if (player.stats.hasOwnProperty(key)) {
                    player.stats[key] += charData.stats[key];
                }
            }
        }
        player.width = charData.hitboxWidth || 20;
        player.height = charData.hitboxHeight || 50;
    } else {
        player.width = 20; 
        player.height = 50;
    }
    
    player.regenTimer = 0;
    player.type = hero;

    if (hero === 'knight') {
        player.maxHp = 100; player.speed = 4;
        player.maxItems = 5; player.maxWeapons = 2; 
        addWeapon('sword');
    } 
    else if (hero === 'mage') {
        player.maxHp = 100; player.speed = 5;
        player.maxItems = 5; player.maxWeapons = 2;
        addWeapon('wand');
    } 
    else if (hero === 'thief') {
        player.maxHp = 80; player.speed = 5.5; 
        player.maxItems = 6; player.maxWeapons = 2;
        addWeapon('knife');
    } 
    else if (hero === 'butcher') {
        player.maxHp = 100; player.speed = 3.2; 
        player.maxItems = 4; player.maxWeapons = 3;
        addWeapon('axe');
    }
    else if (hero === 'alchemist') { 
        player.maxHp = 100; player.speed = 4.0;
        player.maxWeapons = 2; player.maxItems = 5;
        addWeapon('garlic');
        player.items['plesen'] = 1; applyItemPassive('plesen'); 
    }
    else if (hero === 'spartan') { 
        player.maxHp = 120; player.speed = 4.2;
        player.maxWeapons = 2; player.maxItems = 5;
        addWeapon('spear');
    }
    else if (hero === 'nun') { 
        player.maxHp = 100; player.speed = 3.6; 
        player.maxWeapons = 2; player.maxItems = 5;
        addWeapon('holywater');
    }
    else if (hero === 'exorcist') { 
        player.maxHp = 100; player.speed = 4.5;
        player.maxWeapons = 3; player.maxItems = 3;   
        addWeapon('cross');
    }
    else if (hero === 'preacher') { 
        player.maxHp = 100; player.speed = 4.0;
        player.maxWeapons = 2; player.maxItems = 5; 
        addWeapon('bible');
    }

    if (DB.characters && DB.characters[hero] && DB.characters[hero].stats && DB.characters[hero].stats.maxHp) {
        player.maxHp += DB.characters[hero].stats.maxHp;
    }

// --- FIX: СБРАСЫВАЕМ ПОРОГ ОПЫТА ---
    player.hp = player.maxHp; player.level = 1; player.exp = 0; 
    player.nextLevelExp = 50; // <--- ДОБАВИТЬ ЭТУ СТРОКУ
    player.gold = 0;
    // ----------------------------------
    player.x = WORLD_SIZE/2; player.y = WORLD_SIZE/2; 
    player.healFlashTimer = 0;
    
    for(let i=0; i<8; i++) spawnMonument();
    
    for(let i=0; i<8; i++) { 
        let rx = TILE_SIZE + Math.random() * (WORLD_SIZE - 2 * TILE_SIZE); 
        let ry = TILE_SIZE + Math.random() * (WORLD_SIZE - 2 * TILE_SIZE); 
        spawnChest(rx, ry, 'normal'); 
    }

    updateUI(); 
    updateInventoryUI(); 

    const am = document.getElementById('audio-menu');
    if (am) am.pause(); // Останавливаем тему меню
    playNextGameTrack(); // Запускаем боевую музыку
    
    gameCanvas.focus();
    // loop() сам себя перезапускает, поэтому стартуем его только один раз за сессию
    if (!window.gameLoopStarted) {
        window.gameLoopStarted = true;
        requestAnimationFrame(loop);
    }
}

// game/main.js -> Замени функцию sendSyncData

window.sendSyncData = () => {
    if (!window.RTDB || !window.RTDB.currentBattleId || !window.Cloud.user) return;

    // ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ СБОРЩИК (с ID и TYPE)
    let myBuild = window.getLastSyncBuild ? window.getLastSyncBuild() : [];

    // Шлем данные
    window.RTDB.set(`battles/${window.RTDB.currentBattleId}/sync/${window.Cloud.user.uid}`, {
        hp: player.hp, 
        maxHp: player.maxHp, 
        lvl: player.level, 
        kills: kills,
        gold: Math.floor(player.gold),
        gameTime: gameTime, 
        items: myBuild, // <-- Теперь тут полный массив с типами
        merchantItems: player.merchantItems || [],
        
        // Полная статистика
        stats: { ...player.stats },

        isDead: false,
        isPaused: (gameState === 'PAUSED' || gameState === 'UPGRADE')
    });
};

// Обёртка цикла: следующий кадр планируется ДО выполнения кадра, а ошибка внутри кадра
// не убивает цикл (раньше одна ошибка отрисовки = навсегда чёрный экран).
let loopErrorCount = 0;
function loop(timestamp) {
    requestAnimationFrame(loop);
    try {
        loopFrame(timestamp);
    } catch (e) {
        if (loopErrorCount < 5) { loopErrorCount++; console.error('Game loop error (frame skipped):', e); }
    }
}

function loopFrame(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

// --- FIX: Разрешаем работу сети в ПАУЗЕ и в АПГРЕЙДАХ (Магазин/Сундук) ---
    const isPvpPause = ((gameState === 'PAUSED' || gameState === 'UPGRADE') && window.RTDB && window.RTDB.currentBattleId);

    // 1. Логика обновляется если ИГРАЕМ или если это PVP-ПАУЗА (технически)
    if (gameState === 'PLAYING' || isPvpPause) {
        
        // ВАЖНО: Если пауза, мы НЕ вызываем update(deltaTime), чтобы время (gameTime) стояло!
        // Но мы вызываем отрисовку и сетевой код.
        if (gameState === 'PLAYING') {
            update(deltaTime); 
            window.totalPlayTime += (deltaTime / 1000);
        }

        // Обновляем визуальные таймеры (Spy/Wait) независимо от пауз
        if (window.PvpUI && window.PvpUI.updateVisualTimers) {
            window.PvpUI.updateVisualTimers();
        }

        // --- PVP LOGIC ---
        if (window.RTDB && window.RTDB.currentBattleId && window.Cloud.user) {
            
            // Проверка победы
            if (window.PvpUI.targetWinTime !== null) {
                // Сравниваем с gameTime (который стоит на паузе, если пауза)
                if (gameTime > window.PvpUI.targetWinTime) {
                    window.PvpUI.declareVictory(); 
                }
            }

            // Проверка смерти
            if (player.hp <= 0) {
                window.RTDB.set(`battles/${window.RTDB.currentBattleId}/sync/${window.Cloud.user.uid}`, {
                    hp: 0, maxHp: 100, isDead: true, deathTime: gameTime
                });
                
                if (window.PvpUI.onMyDeath) window.PvpUI.onMyDeath(gameTime);
            }

            if (!window.syncTimer) window.syncTimer = 0;
            window.syncTimer++;

            // Синхронизация (+ статус паузы)
            if (window.syncTimer >= 60) {
                window.syncTimer = 0;
                window.sendSyncData();
                
                // Собираем билды с уровнями (для Spy Menu)
                let myBuild = [];
                player.weapons.forEach(w => myBuild.push({ img: w.img, lvl: w.level }));
                for(let k in player.items) { 
                    if (DB.items[k]) myBuild.push({ img: DB.items[k].img, lvl: player.items[k] }); 
                }

                // Шлем данные
                window.RTDB.set(`battles/${window.RTDB.currentBattleId}/sync/${window.Cloud.user.uid}`, {
                    hp: player.hp, 
                    maxHp: player.maxHp, 
                    lvl: player.level, 
                    kills: kills,
                    gold: Math.floor(player.gold),
                    gameTime: gameTime, 
                    stage: currentStage,
                    stageTime: stageTime,
                    items: myBuild,
                    merchantItems: player.merchantItems || [],
                         
                    // Статы для сравнения
                    stats: { ...player.stats },

                    isDead: false,
                    isPaused: (gameState === 'PAUSED' || gameState === 'UPGRADE')
                });
            }
        }
    }

    // 2. Отрисовка работает ВСЕГДА
    draw();
}

window.getLastSyncBuild = function() {
    // FIX: Обращаемся к player напрямую, а не через window
    if (typeof player === 'undefined') return [];

    let build = [];
    
    // 1. Оружие
    if (player.weapons) {
        player.weapons.forEach(w => {
            build.push({ 
                id: w.id, 
                img: w.img, 
                lvl: w.level, 
                type: 'weapon' 
            });
        });
    }

    // 2. Предметы
    if (player.items) {
        for(let k in player.items) { 
            // FIX: Обращаемся к DB напрямую
            if (typeof DB !== 'undefined' && DB.items[k]) {
                build.push({ 
                    id: k, 
                    img: DB.items[k].img, 
                    lvl: player.items[k], 
                    type: 'item' 
                }); 
            }
        }
    }

    // 3. Торговец
    if (player.merchantItems) {
        player.merchantItems.forEach(mid => {
            let mItem = (typeof DB !== 'undefined') ? DB.shopItems.find(i => i.id === mid) : null;
            if (mItem) {
                build.push({
                    id: mid,
                    img: mItem.img,
                    lvl: 1,
                    type: 'merchant'
                });
            }
        });
    }

    return build;
};

updateTexts();
document.getElementById('lang-btn').innerText = currentLang.toUpperCase();
updateTotalTimeUI();
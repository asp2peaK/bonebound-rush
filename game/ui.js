window.UI = window.UI || {};
// 1. СНАЧАЛА ОБЪЯВЛЯЕМ ВСЕ ПЕРЕМЕННЫЕ
const introScreen = document.getElementById('intro-screen');
const startScreen = document.getElementById('start-screen');

// Создаем элемент времени
const totalTimeEl = document.createElement('div');
totalTimeEl.id = 'total-playtime-display';
totalTimeEl.style.position = 'absolute';
totalTimeEl.style.top = '20px';
totalTimeEl.style.left = '20px';
totalTimeEl.style.color = 'rgba(255,255,255,0.5)';
totalTimeEl.style.fontSize = '18px';
totalTimeEl.style.fontFamily = 'monospace';
totalTimeEl.style.pointerEvents = 'none';

// Безопасное добавление (проверка, существует ли экран)
if (startScreen) {
    startScreen.appendChild(totalTimeEl);
}

// Настройка Интро
if (introScreen) {
    introScreen.style.display = 'flex';
    introScreen.style.opacity = '1';
    introScreen.style.zIndex = '9999';
}

let introSkipped = false;
let loginMessageShown = false;

// 2. ГЛОБАЛЬНЫЕ ФУНКЦИИ
window.finishIntro = function() {
    if(introSkipped) return;
    introSkipped = true;
    if(introScreen) {
        introScreen.style.transition = 'opacity 1s';
        introScreen.style.opacity = '0';
        setTimeout(() => { introScreen.style.display = 'none'; }, 1000);
    }
}

// Запуск таймера интро
setTimeout(window.finishIntro, 4500);
window.addEventListener('keydown', window.finishIntro);
window.addEventListener('click', () => { if(!introSkipped) window.finishIntro(); });

window.formatTotalTime = function(seconds) {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// БЕЗОПАСНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ (Fix твоей ошибки)
window.updateTotalTimeUI = function() {
    // Проверяем, существует ли элемент, прежде чем менять текст
    if (totalTimeEl) {
        totalTimeEl.innerText = 'TOTAL TIME: ' + formatTotalTime(totalPlayTime);
    }
}

function triggerHitFlash() {
    const flash = document.getElementById('hit-flash-overlay');
    if (flash) {
        // 1. Возвращаем элемент из скрытия (после exitToMenu)
        flash.style.display = 'block'; 
        
        // 2. Запускаем анимацию
        flash.classList.add('active');
        
        // 3. Убираем класс, но display оставляем (он прозрачный сам по себе)
        setTimeout(() => { 
            flash.classList.remove('active'); 
        }, 250); 
    }
}

function updateTexts() { 
    document.querySelectorAll('[data-key]').forEach(el => { 
        el.innerText = t(el.getAttribute('data-key')); 
    }); 
}

function toggleLanguage() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    document.getElementById('lang-btn').innerText = currentLang.toUpperCase();
    updateTexts();
    if(typeof selectedHero !== 'undefined') selectChar(selectedHero);
}

// --- МЕНЮ И НАСТРОЙКИ ---
let previousState = 'MENU';

function togglePause() {
    if (document.activeElement) document.activeElement.blur();
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        document.getElementById('pause-menu').style.display = 'flex';
        renderStats('pause-stats');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        document.getElementById('pause-menu').style.display = 'none';
        canvas.focus();
    }
}

function openSettings() { 
    previousState = gameState; 
    gameState = 'SETTINGS'; 
    document.getElementById('start-screen').style.display = 'none'; 
    document.getElementById('pause-menu').style.display = 'none'; 
    document.getElementById('settings-menu').style.display = 'flex'; 
}

function closeSettings() { 
    gameState = previousState; 
    document.getElementById('settings-menu').style.display = 'none'; 
    if (gameState === 'MENU') document.getElementById('start-screen').style.display = 'flex'; 
    else if (gameState === 'PAUSED') document.getElementById('pause-menu').style.display = 'flex'; 
    if(gameState === 'PLAYING') canvas.focus(); 
}

// --- МУЗЫКА (UI ЧАСТЬ) ---
function updateVolume(val) {
    musicVolume = val / 100;
    document.getElementById('vol-val').innerText = val + '%';
    localStorage.setItem('bonebound_volume', musicVolume);
    const am = document.getElementById('audio-menu');
    const ag = document.getElementById('audio-game');
    if(am) am.volume = musicVolume;
    if(ag) ag.volume = musicVolume;
}

// --- ОТОБРАЖЕНИЕ БОССА ---
window.showBossWarning = function(textKey) {
    const el = document.getElementById('boss-warning');
    if(el) { 
        let txt = t(textKey);
        el.innerText = txt; 
        
        if (textKey === 'cursed_anvil_title') {
            el.style.color = '#39ff14'; el.style.fontSize = '40px'; el.style.textShadow = '0 0 15px rgba(57, 255, 20, 0.5)';
        } else {
            el.style.color = '#c0392b'; el.style.fontSize = '60px'; el.style.textShadow = '0 0 20px #000';
        }

        el.style.display = 'block'; 
        el.style.zIndex = '9999'; 
        el.style.animation = 'none';
        el.offsetHeight; 
        el.style.animation = 'pulse 0.5s infinite alternate';
        
        setTimeout(() => el.style.display = 'none', 4000); 
    }
}

// --- ИНВЕНТАРЬ И СТАТЫ ---
function getItemDynamicDesc(id, level) {
    let baseDesc = tDB(id, 'desc');
    let bonusText = "";
    if (id === 'spinach') bonusText = ` (+${(level * 2.5).toFixed(1)}%)`;
    if (id === 'armor') bonusText = ` (+${(level * 2.5).toFixed(1)}%)`;
    if (id === 'candle') bonusText = ` (+${(level * 2.5).toFixed(1)}%)`;
    if (id === 'boots') bonusText = ` (+${(level * 2.5).toFixed(1)}%)`;
    if (id === 'gloves') bonusText = ` (+${level * 5}%)`;
    if (id === 'crown') bonusText = ` (+${level * 3})`;
    if (id === 'clover') bonusText = ` (+${level * 2})`;
    if (id === 'magnet') bonusText = ` (+${level * 70})`;
    if (id === 'ring') bonusText = ` (+${level})`;
    if (id === 'hollow_heart') bonusText = ` (+${level * 10} HP)`;
    if (id === 'bracer') bonusText = ` (+${level * 5}%)`;
    if (id === 'plesen') bonusText = ` (max +${(5 + level * 2) * 10}%)`;
    if (id === 'skull_ring') bonusText = ` (${t('stat_critChance')} +${level * 5}%, ${t('stat_curse')} +${level * 10}%)`;
    if (id === 'wings') bonusText = ` (+${level * 10}% Spd, +${(level * 2.5).toFixed(1)}% Eva)`;
    if (id === 'thornmail') { let reflect = level * 10; bonusText = ` (${reflect}%)`; }
    if (id === 'stopwatch') { let cd = 90 - (level * 5); bonusText = ` (${cd}s CD)`; }
    // --- НОВЫЕ ПРЕДМЕТЫ (Вставить в getItemDynamicDesc) ---
    if (id === 'whetstone') bonusText = ` (+${level}%)`;
    if (id === 'mist_cloak') bonusText = ` (+${level}%)`;
    if (id === 'scope') bonusText = ` (+${(level * 2.5).toFixed(1)}%)`;
    if (id === 'light_feather') bonusText = ` (+${(level * 2.5).toFixed(1)}%)`;
    if (id === 'empty_bottle') bonusText = ` (+${level})`;
    if (id === 'coffee') bonusText = ` (+${(level * 1.5).toFixed(1)}% Spd, +${level}% Rate)`;
    if (id === 'heavy_stone') bonusText = ` (+${level * 4}% Dmg, -${(level * 1.5).toFixed(1)}% Spd)`;
    if (id === 'coin_purse') bonusText = ` (+${level * 4})`;
    // --- RARE ITEMS ---
    if (id === 'spiked_pauldrons') bonusText = ` (+${(level * 5)}%)`;
    if (id === 'ninja_headband') bonusText = ` (+${(level * 3)}% Rate, +${(level * 2)}% Crit)`;
    if (id === 'magnet_boots') bonusText = ` (+${(level * 2.5).toFixed(1)}% Spd, +${level * 20} Mag)`;
    if (id === 'ruby_ring') bonusText = ` (+${(level * 2.5).toFixed(1)}% Dmg, +${(level * 2.5).toFixed(1)}% Area)`;
    if (id === 'sapphire_amulet') bonusText = ` (+${(level * 2.5).toFixed(1)}% Rate, +${(level * 2.5).toFixed(1)}% Spd)`;
    if (id === 'sniper_lens') bonusText = ` (+${(level * 3.5).toFixed(1)}% Spd, +${(level * 1.5).toFixed(1)}% Crit)`;
    if (id === 'explosive_powder') bonusText = ` (+${(level * 5)}%)`;
    // --- EPIC ITEMS ---
    if (id === 'berserker_blood') {
        let multi = (0.375 + (level * 0.125)).toFixed(2);
        // Считаем текущий бонус для отображения
        let missing = (1 - (player.hp / player.maxHp)) * 100;
        let cur = (missing * multi).toFixed(1);
        bonusText = ` (+${multi}% per 1% HP lost. Curr: +${cur}%)`;
    }
    if (id === 'golden_idol') {
        let step = 225 - (level * 25);
        if (player.cursedItems && player.cursedItems['golden_idol']) step = 50;
        let cur = (Math.floor(player.gold / step)).toFixed(0);
        bonusText = ` (+1% per ${step}G. Curr: +${cur}%)`;
    }
    if (id === 'glass_cannon') bonusText = ` (+${(level * 12.5).toFixed(1)}% Dmg, -${(level * 2.5).toFixed(1)}% HP)`;
    if (id === 'adrenaline_shot') bonusText = ` (+${(level * 5)}% Spd. Run: +${(level * 10)}% Rate)`;
    if (id === 'mana_crystal') bonusText = ` (+${(level * 5)}% Rate/Dur)`;
    // --- LEGENDARY ---
    if (id === 'pandora_box') {
        bonusText = ` (All Stats +10%, Amount +1, Luck +20)`;
    }
    return baseDesc + `<span style="color:#00ff00; font-weight:bold;">${bonusText}</span>`;
}

window.updateInventoryUI = function() {
    const bar = document.getElementById('inventory-bar'); 
    bar.innerHTML = '';
    
    let wDiv = document.createElement('div'); wDiv.className='inv-section';
    player.weapons.forEach(w => {
        let r = w.rarity || 'common';
        let rColor = '#bdc3c7'; 
        if (r === 'rare') rColor = '#3498db'; if (r === 'epic') rColor = '#9b59b6'; if (r === 'legendary') rColor = '#f1c40f';
        let d = document.createElement('div'); d.className = `inv-slot border-${r}`;
        if (w.isCursed) { d.style.background = `linear-gradient(135deg, ${rColor} 50%, #c0392b 50%)`; d.style.padding = '3px'; d.style.border = 'none'; d.style.boxShadow = '0 0 5px #c0392b'; }
        let name = tDB(w.id, 'name'); 
        let curseInfo = "";
        if (w.isCursed) { name = `${name} <span style="color:#e74c3c; font-weight:900;">(CURSED)</span>`; if(DB.curses[w.id]) curseInfo = `<br><span style="color:#e74c3c; font-size:12px;">☠ ${t(DB.curses[w.id].descKey)}</span>`; }
        let desc = tDB(w.id, 'desc');
        let realDmg = Math.floor(w.damage * player.stats.might);
        let imgStyle = w.isCursed ? 'style="background:#222; width:100%; height:100%; object-fit:contain; border-radius:3px;"' : '';
        d.innerHTML = `<img src="sprites/weapons/${w.img}" ${imgStyle}><div class="inv-lvl">${w.level}</div><span class="tooltip"><b>${name}</b> (Lvl ${w.level})<br>${desc}${curseInfo}<br>Dmg: ${realDmg}</span>`;
        wDiv.appendChild(d);
    });
    let maxWeaponsLimit = player.maxWeapons || MAX_WEAPONS;
    for(let i=player.weapons.length; i<maxWeaponsLimit; i++) {
        let d=document.createElement('div'); d.className='inv-slot'; d.style.borderColor='#552'; d.innerHTML='<span style="color:#555;font-size:10px">Empty</span>'; wDiv.appendChild(d);
    }
    bar.appendChild(wDiv);
    
    let div = document.createElement('div'); div.className='inv-divider'; bar.appendChild(div);
    
    let iDiv = document.createElement('div'); iDiv.className='inv-section';
    for(let id in player.items) {
        let i = DB.items[id];
        let lvl = player.items[id];
        let isCursed = player.cursedItems && player.cursedItems[id];
        let rColor = '#bdc3c7';
        if (i.rarity === 'rare') rColor = '#3498db'; if (i.rarity === 'epic') rColor = '#9b59b6'; if (i.rarity === 'legendary') rColor = '#f1c40f';
        let d = document.createElement('div'); d.className = `inv-slot border-${i.rarity}`;
        if(isCursed) { d.style.background = `linear-gradient(135deg, ${rColor} 50%, #c0392b 50%)`; d.style.padding = '3px'; d.style.border = 'none'; d.style.boxShadow = '0 0 5px #c0392b'; }
        let name = tDB(id, 'name'); 
        let curseInfo = "";
        if (isCursed) { name = `${name} <span style="color:#e74c3c; font-weight:900;">(CURSED)</span>`; if(DB.curses[id]) curseInfo = `<br><span style="color:#e74c3c; font-size:12px;">☠ ${t(DB.curses[id].descKey)}</span>`; }
        let desc = getItemDynamicDesc(id, lvl);
// game/ui.js -> внутри window.updateInventoryUI

        if (id === 'soul_stone') {
             let startK = (typeof soulStoneStartKills !== 'undefined' && soulStoneStartKills !== null) ? soulStoneStartKills : kills;
             let currentSoulKills = kills - startK;
             if (currentSoulKills < 0) currentSoulKills = 0;
             
             let visual_lvl = 1; 
             let nextT = 1500;
             let currentBonus = "";
             
             let tMight = t('stat_might');
             let tRate = t('stat_cooldown');
             let tSpeed = t('stat_projSpeed');
             let tAmount = t('stat_amount');
             
             // ЛОГИКА ОТОБРАЖЕНИЯ (НАКОПИТЕЛЬНАЯ)
             
             // Уровень 5 (MAX)
             if (currentSoulKills >= 12500) { 
                 visual_lvl = 5; nextT = "MAX"; 
                 currentBonus = `<span style='color:#e74c3c'>ULTIMATE FORM:</span><br>${tMight} +40%<br>${tRate} +40%<br>${tSpeed} +40%<br>${tAmount} +2`; 
             }
             // Уровень 4 (7000+)
             else if (currentSoulKills >= 7000) { 
                 visual_lvl = 4; nextT = 12500; 
                 // Might 20, Rate 20, Speed 20, Amount 1
                 currentBonus = `${tMight} +20%<br>${tRate} +20%<br>${tSpeed} +20%<br>${tAmount} +1`; 
             }
             // Уровень 3 (3500+)
             else if (currentSoulKills >= 3500) { 
                 visual_lvl = 3; nextT = 7000; 
                 // Might 20, Rate 20, Speed 20
                 currentBonus = `${tMight} +20%<br>${tRate} +20%<br>${tSpeed} +20%`; 
             }
             // Уровень 2 (1500+)
             else if (currentSoulKills >= 1500) { 
                 visual_lvl = 2; nextT = 3500; 
                 // Might 20, Rate 20
                 currentBonus = `${tMight} +20%<br>${tRate} +20%`; 
             }
             // Уровень 1 (База)
             else {
                 visual_lvl = 1; nextT = 1500;
                 // Только Might 20
                 currentBonus = `${tMight} +20%`;
             }
             
             // Обновляем картинку в базе, чтобы при перерисовке была актуальная
             if(DB.items.soul_stone) DB.items.soul_stone.img = `soulstone${visual_lvl}.png`;
             i.img = `soulstone${visual_lvl}.png`;
             
             if (nextT !== "MAX") desc = `${currentBonus}<br><br><span style="color:#9b59b6">Next Lvl: ${currentSoulKills} / ${nextT} Kills</span>`; 
             else desc = `${currentBonus}<br><br><span style="color:#f1c40f">MAX POWER REACHED</span>`;
             
             lvl = visual_lvl;
        }
        let imgStyle = isCursed ? 'style="background:#222; width:100%; height:100%; object-fit:contain; border-radius:3px;"' : '';
        d.innerHTML=`<img src="sprites/items/${i.img}" ${imgStyle}><div class="inv-lvl">${lvl}</div><span class="tooltip"><b>${name}</b> (Lvl ${lvl})<br>${desc}${curseInfo}</span>`;
        iDiv.appendChild(d);
    }
    let itemCount = Object.keys(player.items).length;
    let maxItemsLimit = player.maxItems || MAX_ITEMS; 
    for(let i=itemCount; i<maxItemsLimit; i++) {
         let d=document.createElement('div'); d.className='inv-slot'; d.style.borderColor='#333'; d.innerHTML='<span style="color:#555;font-size:10px">Empty</span>'; iDiv.appendChild(d);
    }
    bar.appendChild(iDiv);
}

window.updateUI = function() {
    document.getElementById('hp-disp').innerText = Math.floor(player.hp);
    document.getElementById('lvl-disp').innerText = player.level;
    document.getElementById('gold-disp').innerText = Math.floor(player.gold);
    document.getElementById('kill-disp').innerText = kills;
    document.getElementById('exp-bar').style.width = (player.exp/player.nextLevelExp*100)+'%';
}

// game/ui.js

function renderStats(containerId) {
    const el = document.getElementById(containerId);
    if(!el) return;

    const fmt = (val, isPercent = true) => {
        let n = isPercent ? (val * 100).toFixed(0) : val.toFixed(0);
        let sign = val > 0 ? '+' : ''; 
        return `${sign}${n}${isPercent ? '%' : ''}`;
    };
    const fmtF = (val) => {
        let n = (val * 100).toFixed(1);
        return `${n}%`;
    };

// 1. ОСНОВНЫЕ СТАТЫ (С ВИЗУАЛЬНЫМ ОГРАНИЧЕНИЕМ)
    
    // Считаем красивые цифры для отображения (обрезаем лишнее)
    let dispCrit = Math.min(player.stats.critChance, 1.0);
    let dispEva  = Math.min(player.stats.evasion, 0.3);
    let dispVamp = Math.min(player.stats.vampChance, 0.3);

    let statsHtml = `
        <div>${t('stat_might')}: ${(player.stats.might*100).toFixed(1)}%</div>
        <div>${t('stat_moveSpeed')}: ${(player.stats.moveSpeed*100).toFixed(1)}%</div>
        <div>${t('stat_projSpeed')}: ${(player.stats.projSpeed*100).toFixed(1)}%</div>
        <div>${t('stat_cooldown')}: ${(player.stats.cooldown*100).toFixed(1)}%</div>
        <div>${t('stat_area')}: ${(player.stats.area*100).toFixed(1)}%</div>
        <div>${t('stat_duration')}: ${(player.stats.duration*100).toFixed(1)}%</div>
        
        <div style="color:#e74c3c; font-weight:bold;">${t('stat_critChance')}: ${(dispCrit*100).toFixed(1)}%</div>
        <div style="color:#e74c3c;">${t('stat_critDamage')}: x${(player.stats.critDamage || 1.0).toFixed(3)}</div>
        
        <div>${t('stat_luck')}: ${fmt(player.stats.luck, false)}</div>
        <div>${t('stat_amount')}: +${player.stats.amount}</div>
        <div>${t('stat_curse')}: ${(player.stats.curse*100).toFixed(1)}%</div>
        <div>${t('stat_growth')}: ${fmt(player.stats.growth, false)}</div>
        <div>${t('stat_greed')}: ${fmt(player.stats.greed, false)}</div>
        
<div style="color:#ffff00; font-weight:bold;">${t('stat_evasion')}: ${(dispEva*100).toFixed(1)}% <span style="font-size:10px; color:#777;">(MAX 30%)</span></div>
        <div style="color:#e74c3c; grid-column: span 2;">${t('stat_vampChance')}: ${(dispVamp*100).toFixed(1)}% <span style="font-size:10px; color:#777;">(MAX 30%)</span> | ${t('stat_vampPower')}: ${player.stats.vampPower} HP</div>
    `;

    // 2. СУМКА ТОРГОВЦА (MERCHANT BAG)
    if (player.merchantItems && player.merchantItems.length > 0) {
        // Группируем предметы
        let counts = {};
        player.merchantItems.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

        let itemsHtml = '';
        for (let id in counts) {
            let count = counts[id];
            let itemDB = DB.shopItems.find(i => i.id === id);
            if (!itemDB) continue;

            // Расчет общего бонуса для тултипа
            let bonusText = "";
            if (itemDB.stats) {
                let bonuses = [];
                for (let k in itemDB.stats) {
                    let val = itemDB.stats[k] * count;
                    let name = t('stat_' + k) || k;
                    // Форматирование значений
                    let valStr = "";
                    if (['might','moveSpeed','projSpeed','cooldown','area','duration','critChance','evasion','thorns','shopDefense'].includes(k)) {
                        valStr = `+${(val*100).toFixed(0)}%`;
                    } else {
                        valStr = `+${val}`;
                    }
                    if (k === 'shopDefense') name = "Damage Reduction"; // Ручной перевод для скрытого стата
                    bonuses.push(`${name}: ${valStr}`);
                }
                bonusText = bonuses.join('<br>');
            } else if (itemDB.effect === 'heal_full_maxhp_10') {
                bonusText = `Max HP: +${10 * count}`;
            }

            let itemName = t(itemDB.nameKey);
            let img = `sprites/merchant/${itemDB.img}`;
            
            itemsHtml += `
                <div class="merch-slot border-${itemDB.rarity || 'common'}">
                    <img src="${img}">
                    <div class="merch-count">${count}</div>
                    <span class="tooltip"><b>${itemName} x${count}</b><br><span style="color:#2ecc71">${bonusText}</span></span>
                </div>
            `;
        }

        statsHtml += `
            <div style="grid-column: span 2; margin-top: 15px; border-top: 1px solid #555; padding-top: 10px;">
                <div style="color: #f1c40f; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Merchant Bag</div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    el.innerHTML = statsHtml;
}

// --- СИСТЕМА КАРТОЧЕК И АПГРЕЙДОВ ---
let currentChoices = [];

function getRandomCardOption(excludeIds = [], isChest = false) {
    let openWeaponSlots = (player.maxWeapons || MAX_WEAPONS) - player.weapons.length;
    let openItemSlots = (player.maxItems || MAX_ITEMS) - Object.keys(player.items).length; 
    const R_CAPS = { common: 10, rare: 7, epic: 5, legendary: 3 };
    let pool = [];
    
    // 1. НОВОЕ ОРУЖИЕ (Без изменений)
    if(openWeaponSlots > 0) {
        for(let k in DB.weapons) {
            if(!player.weapons.find(w=>w.id===k) && !banishedList.includes(k) && !excludeIds.includes(k)) {
                pool.push({id:k, type:'new_weapon', ...DB.weapons[k], rarity: 'common'});
            }
        }
    }
    
    // 2. НОВЫЕ ПРЕДМЕТЫ (Без изменений)
    if(openItemSlots > 0) {
        for(let k in DB.items) {
            let item = DB.items[k];
            if (isChest && item.noChest) continue;
            if(!player.items[k] && !banishedList.includes(k) && !excludeIds.includes(k)) {
                pool.push({id:k, type:'new_item', ...item});
            }
        }
    }
    
    // 3. АПГРЕЙД ОРУЖИЯ (ДОБАВЛЕНА ПРОВЕРКА !w.isCursed)
    player.weapons.forEach(w => {
        if (!excludeIds.includes(w.id)) {
            // Если оружие ПРОКЛЯТО, оно не попадает в пул (Заморозка)
            if (w.isCursed) return; 

            let r = w.rarity || 'common';
            let cap = R_CAPS[r] || 10; 
            if (w.level < cap) pool.push({id:w.id, type:'upg_weapon', ...w, rarity: 'common'});
        }
    });

    // 4. АПГРЕЙД ПРЕДМЕТОВ (ДОБАВЛЕНА ПРОВЕРКА !player.cursedItems[k])
    for(let k in player.items) {
        if (!excludeIds.includes(k)) {
            // Если предмет ПРОКЛЯТ, он не попадает в пул (Заморозка)
            if (player.cursedItems && player.cursedItems[k]) continue;

            let itemData = DB.items[k];
            let cap = itemData.maxLevel;
            if (!cap) { let r = itemData.rarity || 'common'; cap = R_CAPS[r] || 10; }
            if (player.items[k] < cap) pool.push({id:k, type:'upg_item', ...itemData});
        }
    }

    if (pool.length === 0) {
        let goldReward = Math.max(10, Math.floor(currentChestCost * 0.3)); // Минимум 10 монет
        return {
            name: t('upg_title_gold'), rarity:'common', img:'gold', desc:"", 
            diff: `+${goldReward} G`, 
            func: () => player.gold += goldReward, 
            id: 'gold_fallback'
        };
    }

    let luck = player.stats.luck; 
    let wCommon = 60, wRare = 30, wEpic = 9, wLegendary = 1;
    let shift = luck;
    // Потолок Luck = 40: обычные предметы не падают ниже 20% (при Luck 40: 20/54/21/5 %)
    if (wCommon - shift < 20) shift = wCommon - 20;
    wCommon -= shift; wRare += shift * 0.6; wEpic += shift * 0.3; wLegendary += shift * 0.1;
    
    let total = wCommon + wRare + wEpic + wLegendary;
    let rnd = Math.random() * total;
    let targetRarity = 'common';
    if (rnd > wCommon) targetRarity = 'rare';
    if (rnd > wCommon + wRare) targetRarity = 'epic';
    if (rnd > wCommon + wRare + wEpic) targetRarity = 'legendary';

    let match = pool.filter(p => p.rarity === targetRarity);
    if(match.length === 0) {
        let goldReward = Math.max(10, Math.floor(currentChestCost * 0.3));
        return {
            name: t('upg_title_gold'), rarity:'common', img:'gold', desc:"", 
            diff: `+${goldReward} G`, 
            func: () => player.gold += goldReward, 
            id: 'gold_fallback_rarity'
        };
    }

    let p = match[Math.floor(Math.random() * match.length)];
    let diffText = ""; let func = null;

    if(p.type === 'new_weapon') { diffText = t('new_item'); func = () => addWeapon(p.id); } 
    else if (p.type === 'new_item') { diffText = t('new_item'); func = () => { player.items[p.id]=1; applyItemPassive(p.id); 
        if(window.Cloud && window.Cloud.unlockCodexItem) {
                window.Cloud.unlockCodexItem(p.id);
            }
    }; } 
        else if (p.type === 'upg_weapon') {
            let w = player.weapons.find(x=>x.id===p.id);
            let gain = weaponLevelDamageGain(w);
            diffText = `Dmg: ${Math.round(w.damage)} <span class="stat-arrow">-></span> ${Math.round(w.damage + gain)}`;
            func = () => { w.damage += gain; w.level++; };
        } else if (p.type === 'upg_item') {
            let lvl = player.items[p.id];
            diffText = `Lvl: ${lvl} <span class="stat-arrow">-></span> ${lvl+1}`;
            if(p.id === 'spinach') diffText = `${t('stat_might')}: +${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%`;
            if(p.id === 'armor') diffText = `Dmg Taken: -${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> -${((lvl+1)*2.5).toFixed(1)}%`;
            if(p.id === 'boots') diffText = `${t('stat_moveSpeed')}: +${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%`;
            if(p.id === 'gloves') diffText = `${t('stat_cooldown')}: +${lvl*5}% <span class="stat-arrow">-></span> +${(lvl+1)*5}%`;
            if(p.id === 'candle') diffText = `${t('stat_area')}: +${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%`;
            if(p.id === 'wings') {diffText = `${t('stat_moveSpeed')}: +${lvl*10}% <span class="stat-arrow">-></span> +${(lvl+1)*10}%<br>` + 
                        `${t('stat_evasion')}: +${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%`;}
            if(p.id === 'clover') diffText = `${t('stat_luck')}: +${lvl*2} <span class="stat-arrow">-></span> +${(lvl+1)*2}`;
            if(p.id === 'crown') diffText = `${t('stat_growth')}: +${lvl*3} <span class="stat-arrow">-></span> +${(lvl+1)*3}`;
            if(p.id === 'magnet') diffText = `Magnet: +${lvl*70} <span class="stat-arrow">-></span> +${(lvl+1)*70}`;
            if(p.id === 'ring') diffText = `${t('stat_amount')}: +${lvl} <span class="stat-arrow">-></span> +${lvl+1}`;
            if(p.id === 'hollow_heart') diffText = `HP: +${lvl*10} <span class="stat-arrow">-></span> +${(lvl+1)*10}`;
            if(p.id === 'mask') { let c = player.stats.vampPower; let n = c + 10; diffText = `Heal: ${c} HP <span class="stat-arrow">-></span> ${n} HP`; }
            // Внутри ui.js
            if(p.id === 'bracer') diffText = `${t('stat_projSpeed')}/${t('stat_duration')}: +${lvl*5}% <span class="stat-arrow">-></span> +${(lvl+1)*5}%`;
            if(p.id === 'skull_ring') diffText = `${t('stat_critChance')}: +${lvl*5}% <span class="stat-arrow">-></span> +${(lvl+1)*5}%<br>${t('stat_curse')}: +${lvl*10}% <span class="stat-arrow">-></span> +${(lvl+1)*10}%`;
            if(p.id === 'stopwatch') diffText = `CD: ${90-(lvl*5)}s <span class="stat-arrow">-></span> ${90-((lvl+1)*5)}s`;
            if(p.id === 'thornmail') diffText = `Reflect: ${lvl*10}% <span class="stat-arrow">-></span> ${(lvl+1)*10}%`;
            // --- НОВЫЕ ПРЕДМЕТЫ (Вставить в блок upg_item) ---
            if(p.id === 'whetstone') diffText = `${t('stat_critChance')}: +${lvl}% <span class="stat-arrow">-></span> +${lvl+1}%`;
            if(p.id === 'mist_cloak') diffText = `${t('stat_evasion')}: +${lvl}% <span class="stat-arrow">-></span> +${lvl+1}%`;
            if(p.id === 'scope') diffText = `${t('stat_critDamage')}: +${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%`;
            if(p.id === 'empty_bottle') diffText = `${t('stat_vampPower')}: +${lvl} <span class="stat-arrow">-></span> +${lvl+1}`;
            
            if(p.id === 'coffee') { diffText = `Spd/Rate: +${(lvl*1.5).toFixed(1)}%/${lvl}% <span class="stat-arrow">-></span> +${((lvl+1)*1.5).toFixed(1)}%/${lvl+1}%`; }
            if(p.id === 'heavy_stone') { diffText = `Dmg/Slow: +${lvl*4}%/-${(lvl*1.5).toFixed(1)}% <span class="stat-arrow">-></span> +${(lvl+1)*4}%/-${((lvl+1)*1.5).toFixed(1)}%`; }
            
            if(p.id === 'coin_purse') diffText = `${t('stat_greed')}: +${lvl*4} <span class="stat-arrow">-></span> +${(lvl+1)*4}`;
            if(p.id === 'light_feather') diffText = `${t('stat_moveSpeed')}: +${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%`;
                func = () => { player.items[p.id]++; applyItemPassive(p.id); };
            // --- RARE ITEMS ---
            if(p.id === 'spiked_pauldrons') diffText = `${t('stat_thorns')}: +${lvl*5}% <span class="stat-arrow">-></span> +${(lvl+1)*5}%`;
            
            if(p.id === 'ninja_headband') diffText = `Rate/Crit: +${lvl*3}%/+${lvl*2}% <span class="stat-arrow">-></span> +${(lvl+1)*3}%/+${(lvl+1)*2}%`;
            
            if(p.id === 'magnet_boots') diffText = `Spd/Mag: +${(lvl*2.5).toFixed(1)}%/${lvl*20} <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%/${(lvl+1)*20}`;
            
            if(p.id === 'ruby_ring') diffText = `Dmg/Area: +${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%`;
            
            if(p.id === 'sapphire_amulet') diffText = `Rate/Spd: +${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*2.5).toFixed(1)}%`;
            
            if(p.id === 'sniper_lens') diffText = `Spd/Crit: +${(lvl*3.5).toFixed(1)}%/${(lvl*1.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*3.5).toFixed(1)}%/${((lvl+1)*1.5).toFixed(1)}%`;
            
            if(p.id === 'explosive_powder') diffText = `${t('stat_area')}: +${lvl*5}% <span class="stat-arrow">-></span> +${(lvl+1)*5}%`;
            // --- EPIC ITEMS ---
            if(p.id === 'berserker_blood') {
                let v1 = (0.375 + (lvl * 0.125)).toFixed(2);
                let v2 = (0.375 + ((lvl+1) * 0.125)).toFixed(2);
                diffText = `Bonus per 1% HP: ${v1}% <span class="stat-arrow">-></span> ${v2}%`;
            }
            if(p.id === 'golden_idol') {
                let v1 = 225 - (lvl * 25);
                let v2 = 225 - ((lvl+1) * 25);
                diffText = `1% Dmg per: ${v1}G <span class="stat-arrow">-></span> ${v2}G`;
            }
            if(p.id === 'glass_cannon') diffText = `Might/HP: +${(lvl*12.5).toFixed(1)}%/-${(lvl*2.5).toFixed(1)}% <span class="stat-arrow">-></span> +${((lvl+1)*12.5).toFixed(1)}%/-${((lvl+1)*2.5).toFixed(1)}%`;
            if(p.id === 'adrenaline_shot') diffText = `Run Fire Rate: +${lvl*10}% <span class="stat-arrow">-></span> +${(lvl+1)*10}%`;
            if(p.id === 'mana_crystal') diffText = `Rate/Dur: +${lvl*5}% <span class="stat-arrow">-></span> +${(lvl+1)*5}%`;    
            } else return p;

        return { id: p.id, type: p.type.includes('weapon')?'weapon':'item', name: tDB(p.id, 'name'), img: p.img, rarity: p.rarity, desc: tDB(p.id, 'desc'), diff: diffText, func: func, tags: p.tags };
    }

function generateCards(poolType, chestType, isMonument = false) {
    const box = document.getElementById('cards-box');
    const title = document.getElementById('upgrade-title');
    const desc = document.getElementById('upgrade-desc');
    document.getElementById('upgrade-screen').style.display = 'flex';

    const goldCont = document.getElementById('gold-container');
    const goldVal = document.getElementById('upg-gold-val');

    if (goldCont && goldVal) {
        // Если это статы (уровень) или монумент -> СКРЫВАЕМ ВЕСЬ БЛОК
        if (poolType === 'stats' || isMonument) {
            goldCont.style.display = 'none';
        } else {
            // Иначе (магазин, сундук) -> ПОКАЗЫВАЕМ И ОБНОВЛЯЕМ ЦИФРУ
            goldCont.style.display = 'flex';
            goldVal.innerText = Math.floor(player.gold);
        }
    }

    title.style.color = '';
    box.innerHTML = '';
    currentChoices = [];
    let isChest = (chestType === 'normal' || chestType === 'gold');

    if (poolType === 'stats') {
        // ЛОГИКА ЗАГОЛОВКА МОНУМЕНТА
        if (isMonument) {
            title.innerText = "MONUMENT ACTIVATED"; 
            title.style.color = "#3498db"; 
            desc.innerText = "Choose a blessing";
        } else {
            title.innerText = t('upg_title_lvl'); 
            desc.innerText = t('upg_desc_lvl');
        }

        let opts = Object.keys(DB.stats);
        // Убираем забаненные статы
        opts = opts.filter(stat => !banishedList.includes(stat));

        // 2. УБИРАЕМ СТАТЫ, ДОСТИГШИЕ ЛИМИТА
        opts = opts.filter(stat => {
            // Статы с потолком (STAT_CAPS) не предлагаем, когда потолок достигнут
            if (STAT_CAPS[stat] !== undefined && (player.stats[stat] || 0) >= STAT_CAPS[stat]) return false;
            return true;
        });

        // Если забанили ВСЁ (редко, но бывает), вернем хотя бы Силу
        if (opts.length === 0) opts = ['might'];
        // ---------------------------------
        opts.sort(()=>Math.random()-0.5);
        opts.slice(0, 3).forEach(key => {
            let val = player.stats[key] || 0;
            let inc = 0.05; 
            if(key==='might' || key==='curse') inc=0.05; if(key==='amount') inc=1;
            if(key==='vampChance') inc=0.01; if(key==='vampPower') inc=1; 
            if(key==='greed' || key==='growth' || key==='luck') inc=2;
            if(key==='area') inc=0.05; if(key==='critChance') inc=0.025; if(key==='evasion') inc=0.025; if(key==='critDamage') inc=0.025;
            
            let nextVal = capStat(key, val + inc);
            let txtCurr = (val*100).toFixed(1)+'%'; let txtNext = (nextVal*100).toFixed(1)+'%';
            if(key==='amount' || key==='vampPower') { txtCurr=val; txtNext=nextVal; }
            if(key==='greed' || key==='luck' || key==='growth') { txtCurr=`+${val}`; txtNext=`+${nextVal}`; }
            if(key==='critChance'|| key==='evasion') { txtCurr = (val*100).toFixed(1) + '%'; txtNext = (nextVal*100).toFixed(1) + '%'; }
            if(key==='critDamage') { txtCurr = 'x' + val.toFixed(3); txtNext = 'x' + nextVal.toFixed(3); }

            currentChoices.push({
                name: t('stat_'+key), desc: t('stat_desc_'+key), rarity:'common', img: null,
                diff: `${txtCurr} <span class="stat-arrow">-></span> ${txtNext}`,
                func: () => {
                    // Потолки берутся из STAT_CAPS (уже набранное никогда не уменьшается)
                    addCappedStat(player.stats, key, inc);
                },
                type: 'stats'
            });
        });
        renderCards(box, false, false);

        if (statRerollsLeft > 0) {
            let rerollDiv = document.createElement('div');
            rerollDiv.style.width = '100%'; rerollDiv.style.marginTop = '20px';
            rerollDiv.style.display = 'flex'; rerollDiv.style.justifyContent = 'center';
            let btn = document.createElement('button');
            btn.className = 'reroll-btn'; btn.style.fontSize = '20px'; btn.style.padding = '10px 40px';
            btn.innerHTML = `♻ REROLL STATS (${statRerollsLeft})`;
            btn.onclick = () => { statRerollsLeft--; generateCards('stats', null, isMonument); }; // Сохраняем флаг при реролле
            rerollDiv.appendChild(btn); box.appendChild(rerollDiv);
        }
    } 
    else {
        // ЗАГОЛОВОК ДЛЯ ПРЕДМЕТА С МОНУМЕНТА
        if (isMonument) {
            title.innerText = "MONUMENT GIFT";
            title.style.color = "#3498db"; 
            desc.innerText = "A rare find from the monument!";
        } else {
            title.innerText = t(chestType === 'gold' ? 'upg_title_gold' : 'upg_title_chest');
            desc.innerText = t('upg_desc_chest', {cost: currentChestCost});
        }

// ГЕНЕРАЦИЯ КАРТОЧЕК С ЗАЩИТОЙ ОТ ПУСТОТЫ
        let c1 = getRandomCardOption([], isChest);
        
        // ЗАЩИТА 1: Если c1 не вернулся (пул пуст), даем Золото
        if (!c1 || !c1.id) {
            // Базовая награда: 30% от текущей цены сундука
            let baseReward = Math.floor(currentChestCost * 0.3);
            
            // Если сундук ЗОЛОТОЙ -> Умножаем награду на 5 (чтобы было жирно)
            if (chestType === 'gold') baseReward *= 5; 
            
            let goldReward = Math.max(10, baseReward);

            c1 = {
                name: t('upg_title_gold'), rarity:'common', img:'gold', desc:"", 
                diff: `+${goldReward} G`, 
                func: () => player.gold += goldReward, 
                id: 'gold_fallback_emergency_1'
            };
        }
        currentChoices.push(c1);

        // Генерируем вторую карту
        let c2 = getRandomCardOption([c1.id], isChest);
        
        // ЗАЩИТА 2: Пытаемся найти уникальную карту
        let attempts = 0;
        while ((!c2 || !c2.id || c2.id === c1.id) && attempts < 20) {
             c2 = getRandomCardOption([c1.id], isChest);
             attempts++;
        }

        // Если так и не нашли вторую уникальную карту -> даем Золото
        if (!c2 || !c2.id || (c2.id === c1.id && c1.id !== 'gold_fallback')) {
            // Та же логика награды
            let baseReward = Math.floor(currentChestCost * 0.3);
            if (chestType === 'gold') baseReward *= 5; 
            
            let goldReward = Math.max(10, baseReward);
            
            c2 = {
                name: t('upg_title_gold'), rarity:'common', img:'gold', desc:"", 
                diff: `+${goldReward} G`, 
                func: () => player.gold += goldReward, 
                id: 'gold_fallback_fix'
            };
        }
        
        currentChoices.push(c2);
        renderCards(box, true, isChest);
    }
}

function renderCards(box, allowReroll, isChest) {
    box.innerHTML = ''; 
    currentChoices.forEach((c, idx) => {
        let wrapper = document.createElement('div'); wrapper.className = 'card-wrapper';
        let card = document.createElement('div'); card.className = `card border-${c.rarity}`;
        let imgTag = '';
        if (c.type === 'weapon') imgTag = `<img src="sprites/weapons/${c.img}">`;
        else if (c.type === 'item') imgTag = `<img src="sprites/items/${c.img}">`;
        else if (c.img === 'gold') imgTag = `<img src="sprites/map/gold1.png">`;

        let scalesHtml = '';
        if (c.tags && c.tags.length > 0) {
            let tagNames = c.tags.map(tag => t('stat_' + tag)).join(', ');
            scalesHtml = `<div style="font-size:12px; color:#aaa; margin-top:5px;"><i>${t('scales_with')} ${tagNames}</i></div>`;
        }
        let divider = `<div style="width:100%; height:1px; background:rgba(255,255,255,0.2); margin: 8px 0;"></div>`;
        card.innerHTML = `${imgTag}<h3>${c.name}</h3><div style="font-size:14px;color:#bbb">${c.desc}</div>${scalesHtml}${divider}<div class="stat-change">${c.diff}</div>`;
        card.onclick = () => { c.func(); resumeGame(); };
        
        let isOwned = false;
        if (c.id) {
            if (player.weapons.some(w => w.id === c.id)) isOwned = true;
            if (player.items[c.id]) isOwned = true;
        }
        if (banishCount > 0 && c.type !== 'stats' && !c.id.includes('gold_fallback') && !isOwned) {
            let banBtn = document.createElement('button');
            banBtn.className = 'banish-btn';
            banBtn.innerHTML = `${t('btn_banish')} (${banishCount})`; 
            banBtn.onclick = (e) => { e.stopPropagation(); banish(c.id); };
            card.appendChild(banBtn); 
        }
        wrapper.appendChild(card);
        if (allowReroll) {
            let rerollBtn = document.createElement('button');
            rerollBtn.className = 'reroll-btn';
            rerollBtn.innerHTML = `♻ ${t('reroll_btn')} (${rerollsLeft})`;
            if (rerollsLeft <= 0) rerollBtn.disabled = true;
            rerollBtn.onclick = (e) => { e.stopPropagation(); rerollCard(idx, isChest); };
            wrapper.appendChild(rerollBtn);
        }
        box.appendChild(wrapper);
    });
}

function rerollCard(index, isChest) {
    if (rerollsLeft > 0) {
        rerollsLeft--;
        let excludeIds = [];
        currentChoices.forEach(c => { if (c.id) excludeIds.push(c.id); });
        let newCard = getRandomCardOption(excludeIds, isChest);
        let attempts = 0;
        while(excludeIds.includes(newCard.id) && attempts < 10) { newCard = getRandomCardOption(excludeIds, isChest); attempts++; }
        currentChoices[index] = newCard; 
        const box = document.getElementById('cards-box');
        renderCards(box, true, isChest); 
    }
}

function banish(id) {
    if (banishCount > 0) {
        banishCount--;
        banishedList.push(id);
        resumeGame();
    }
}

function openChest(type) {
    if (document.activeElement) document.activeElement.blur();
    gameState = 'UPGRADE';
    generateCards('item_weapon', type);
}

function resumeGame() {
    document.getElementById('upgrade-screen').style.display = 'none';
    if (document.activeElement) document.activeElement.blur();
    canvas.focus();
    gameState = 'PLAYING';
    updateUI(); updateInventoryUI();
}

// --- GAME OVER SCREEN ---
function formatDmg(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
}

function showGameOver() {
    gameState = 'GAMEOVER';
    const screen = document.getElementById('gameover-screen');
    const statsBox = document.getElementById('go-stats');
    screen.style.display = 'flex';
    
    saveTotalTime();
    if (window.Cloud && window.Cloud.playerData) {
        let p = window.Cloud.playerData;
        
        // Если это первый запуск с новой системой, создаем пустые объекты
        if (!p.records) p.records = { bestTime: 0, bestTimeChar: selectedHero, maxKills: 0, maxKillsChar: selectedHero };
        if (!p.stats) p.stats = { kills: 0, timePlayed: 0, runs: 0 };
        
        // Обновляем общую статистику (накапливаем убийства и забеги)
        p.stats.kills += kills;
        p.stats.runs += 1;

        // --- ПРОВЕРКА РЕКОРДА ВРЕМЕНИ ---
        if (gameTime > p.records.bestTime) {
            p.records.bestTime = Math.floor(gameTime);
            p.records.bestTimeChar = selectedHero; // Запоминаем кем поставили рекорд
        }

        // --- ПРОВЕРКА РЕКОРДА УБИЙСТВ ---
        if (kills > p.records.maxKills) {
            p.records.maxKills = kills;
            p.records.maxKillsChar = selectedHero;
        }

        // Сохраняем всё в облако
        window.Cloud.saveData(p);
    }
    let m = Math.floor(gameTime/60);
    let s = Math.floor(gameTime%60);
    let timeStr = (m<10?'0'+m:m)+":"+(s<10?'0'+s:s);

    let invHtml = '<div class="go-inv">';
    player.weapons.forEach(w => {
         let r = w.rarity || 'common';
         let name = tDB(w.id, 'name');
         if (w.isCursed) {
             name += ` <span style="color:#e74c3c; font-weight:bold;">(CURSED)</span>`;
             if(DB.curses[w.id]) name += `<br><span style="color:#e74c3c; font-size:12px;">${t(DB.curses[w.id].descKey)}</span>`;
         }
         invHtml += `<div class="inv-slot border-${r}"><img src="sprites/weapons/${w.img}"><div class="inv-lvl">${w.level}</div><span class="tooltip">${name} (Lvl ${w.level})</span></div>`;
    });
    for(let k in player.items) {
        let i = DB.items[k];
        let r = i.rarity || 'common';
        let name = tDB(k, 'name');
        let inv_lvl = player.items[k];
        if (k === 'soul_stone') {
             let startK = (typeof soulStoneStartKills !== 'undefined' && soulStoneStartKills !== null) ? soulStoneStartKills : kills;
             let curK = kills - startK;
             if (curK >= 12500) inv_lvl = 5;
             else if (curK >= 7000) inv_lvl = 4;
             else if (curK >= 3500) inv_lvl = 3;
             else if (curK >= 1500) inv_lvl = 2;
             else inv_lvl = 1;
             i.img = `soulstone${inv_lvl}.png`;
        }
        invHtml += `<div class="inv-slot border-${r}"><img src="sprites/items/${i.img}"><div class="inv-lvl">${inv_lvl}</div><span class="tooltip">${name} (Lvl ${inv_lvl})</span></div>`;
    }
    invHtml += '</div>';

    let sortedWeapons = [...player.weapons].sort((a, b) => (b.totalDamage || 0) - (a.totalDamage || 0));
    let dmgHtml = '<div style="display:flex; flex-direction:column; gap:6px; height:100%; overflow-y:auto;">';
    dmgHtml += `<h4 style="margin: 0 0 15px 0; color: #ddd; border-bottom:1px solid #555; padding-bottom:10px;">BATTLE REPORT</h4>`;
    if (sortedWeapons.length === 0) { dmgHtml += '<p style="color:#777; font-size: 14px;">No damage dealt</p>'; } 
    else {
        sortedWeapons.forEach(w => {
            let dmg = w.totalDamage || 0;
            let name = tDB(w.id, 'name');
            dmgHtml += `<div style="display: flex; align-items: center; justify-content: space-between; font-size: 15px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px;"><div style="display: flex; align-items: center; gap: 10px;"><img src="sprites/weapons/${w.img}" style="width: 28px; height: 28px; object-fit: contain;"><span style="color: #eee;">${name}</span></div><span style="color: #e74c3c; font-weight: bold;">${formatDmg(dmg)}</span></div>`;
        });
    }
    dmgHtml += '</div>';

    statsBox.innerHTML = `
        <div class="go-summary" style="width: 100%; display: flex; gap: 40px; align-items: flex-start;">
            <div style="flex: 1; min-width: 400px;">
                <h3 style="color:#f1c40f; margin-top:0">${t('gameover_title')}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                    <div><b>${t('time_survived')}:</b> ${timeStr}</div>
                    <div><b>${t('level_reached')}:</b> ${player.level}</div>
                    <div><b>${t('kill_count')}:</b> ${kills}</div>
                    <div><b>${t('gold_earned')}:</b> ${Math.floor(player.gold)}</div>
                </div>
                <p><b>${t('items_collected')}:</b></p>${invHtml}
                <div id="go-stats-content" class="stats-grid" style="margin-top: 20px; grid-template-columns: 1fr 1fr;"></div>
            </div>
            <div style="flex: 0.8; border-left: 2px solid #444; padding-left: 30px; min-height: 400px;">${dmgHtml}</div>
        </div>`;
    renderStats('go-stats-content');
}

// --- CHAR SELECT ---
let selectedHero = 'knight';

// game/ui.js -> openCharSelect

window.openCharSelect = function() {
    const pvpMenu = document.getElementById('pvp-menu-screen');
    if (pvpMenu) pvpMenu.style.display = 'none'; // Фикс наложения меню
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('char-select-screen').style.display = 'flex';
    
    let grid = document.querySelector('.char-grid');
    if (grid) {
        grid.innerHTML = ''; // Очищаем, чтобы не дублировать
        
        // Берем ключи прямо из базы данных (все герои)
        const allHeroes = Object.keys(DB.characters); 
        
        allHeroes.forEach(h => {
             let slot = document.createElement('div');
             slot.className = 'char-slot';
             slot.id = 'slot-' + h;
             slot.onclick = () => selectChar(h);
             // Используем папку /other/ для иконок, как ты просил
             slot.innerHTML = `<img src="sprites/other/${h}_s.png" onerror="this.src='sprites/characters/${h}/${h}1.png'">`;
             grid.appendChild(slot);
        });
    }
    // Выбираем первого по умолчанию
    selectChar('knight'); 
}

window.closeCharSelect = function() {
    document.getElementById('char-select-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    updateTotalTimeUI();
}

window.selectChar = function(hero) {
    selectedHero = hero;
    document.querySelectorAll('.char-slot').forEach(el => el.classList.remove('selected'));
    const slot = document.getElementById('slot-' + hero);
    if(slot) slot.classList.add('selected');

    document.getElementById('char-name-disp').innerText = t('char_' + hero);
    document.getElementById('char-desc-disp').innerText = t('desc_' + hero);
    const art = document.getElementById('char-art-big');
    art.src = `sprites/characters/${hero}/${hero}1.png`;

    let wId = 'sword';
    // ... (твой код выбора оружия для героев, оставь как был) ...
    if(hero === 'mage') wId = 'wand'; if(hero === 'thief') wId = 'knife'; if(hero === 'butcher') wId = 'axe';
    if(hero === 'alchemist') wId = 'garlic'; if(hero === 'spartan') wId = 'spear'; if(hero === 'nun') wId = 'holywater';
    if(hero === 'exorcist') wId = 'cross'; if(hero === 'preacher') wId = 'bible';
    document.getElementById('char-weapon-disp').innerText = tDB(wId, 'name');

    // --- УМНЫЕ ДИНАМИЧЕСКИЕ ПОЛОСКИ ---
    
    // 1. Получаем статы выбранного героя
    let s = { maxHp: 0, moveSpeed: 0, might: 0, luck: 0 };
    if (DB.characters[hero] && DB.characters[hero].stats) {
        s = { ...DB.characters[hero].stats };
    }
    
    // 2. Добавляем базу игрока (чтобы видеть реальные цифры)
    let myHp = 100 + (s.maxHp || 0);
    let mySpd = 1.0 + (s.moveSpeed || 0);
    let myMgt = 1.0 + (s.might || 0);
    let myLck = (s.luck || 0);

    // 3. Задаем границы (Мин и Макс) вручную для красивого контраста
    // Ты можешь поменять эти цифры, если добавишь супер-героя
    const RANGES = {
        hp:    { min: 60,  max: 200 }, // Вор (65) -> Мясник (150+)
        speed: { min: 0.8, max: 1.5 }, // Мясник -> Вор
        might: { min: 0.8, max: 1.6 }, // Алхимик -> Спартанец
        luck:  { min: 0,   max: 50 }   // Рыцарь -> Экзорцист
    };

    // 4. Функция перевода в проценты (растягиваем диапазон)
    function getPct(val, min, max) {
        let pct = (val - min) / (max - min); 
        pct = Math.max(0.1, Math.min(1.0, pct)); // Не меньше 10%, не больше 100%
        return pct * 100 + '%';
    }

    document.getElementById('bar-hp').style.width = getPct(myHp, RANGES.hp.min, RANGES.hp.max);
    document.getElementById('bar-speed').style.width = getPct(mySpd, RANGES.speed.min, RANGES.speed.max);
    document.getElementById('bar-might').style.width = getPct(myMgt, RANGES.might.min, RANGES.might.max);
    document.getElementById('bar-luck').style.width = getPct(myLck, RANGES.luck.min, RANGES.luck.max);
    
    // Окраска полосок (для красоты)
    document.getElementById('bar-hp').style.background = myHp > 130 ? '#2ecc71' : (myHp < 90 ? '#e74c3c' : '#f1c40f');
}

window.confirmStart = function() {
    document.getElementById('char-select-screen').style.display = 'none';
    startGame(selectedHero);
}

// --- МАГАЗИН И НАКОВАЛЬНЯ ---
window.openCursedAnvilMenu = function(anvilObj) {
    if(window.Cloud && window.Cloud.unlockCodexWorld) window.Cloud.unlockCodexWorld('anvil');
    if (document.activeElement) document.activeElement.blur();
    gameState = 'UPGRADE'; 
    const box = document.getElementById('cards-box');
    const title = document.getElementById('upgrade-title');
    const desc = document.getElementById('upgrade-desc');
    const screen = document.getElementById('upgrade-screen');
    
    screen.style.display = 'flex';
    title.innerText = t('cursed_anvil_title') || "CURSED ANVIL";
    title.style.color = '#39ff14'; title.style.textShadow = "0 0 10px #39ff14";
    desc.innerText = t('cursed_anvil_desc') || "Choose a weapon to CURSE";
    box.innerHTML = '';
    
    let candidates = [];
    if (anvilObj && anvilObj.savedCandidates) {
        candidates = anvilObj.savedCandidates;
    } else {
        let pool = [];
        player.weapons.forEach(w => {
            if (!w.isCursed && DB.curses && DB.curses[w.id]) {
                pool.push({ type: 'weapon', id: w.id, img: w.img, ...DB.curses[w.id] });
            }
        });
        for (let id in player.items) {
            if ((!player.cursedItems || !player.cursedItems[id]) && DB.curses && DB.curses[id]) {
                 let itemData = DB.items[id];
                 pool.push({ type: 'item', id: id, img: itemData.img, ...DB.curses[id] });
            }
        }
        if (pool.length === 0) {
            desc.innerText = "No suitable items found...";
            let btn = document.createElement('button');
            btn.className = 'btn'; btn.innerText = "BACK";
            btn.onclick = () => { title.style.color = ''; resumeGame(); };
            box.appendChild(btn);
            if(anvilObj) anvilObj.active = false;
            return;
        }
        pool.sort(() => Math.random() - 0.5);
        candidates = pool.slice(0, 2);
        if (anvilObj) anvilObj.savedCandidates = candidates;
    }
    
    candidates.forEach(c => {
        let wrapper = document.createElement('div'); wrapper.className = 'card-wrapper';
        let card = document.createElement('div'); card.className = `card`;
        card.style.borderColor = '#39ff14'; card.style.boxShadow = '0 0 15px #39ff14';
        
        let imgTag = c.type === 'weapon' ? `<img src="sprites/weapons/${c.img}">` : `<img src="sprites/items/${c.img}">`;
        let cName = t(c.nameKey) || tDB(c.id, 'name'); 
        cName = `<span style="color:#39ff14">${cName}</span>`; 
        let cDesc = t(c.descKey);
        
        let warnText = `
            <div style="
                color: #e74c3c; 
                font-family: 'Cinzel', serif; 
                font-size: 13px; 
                font-weight: 900; 
                text-shadow: 0 2px 4px #000; 
                letter-spacing: 1px; 
                text-transform: uppercase; 
                margin-top: 10px; 
                background: rgba(0, 0, 0, 0.4); 
                border: 1px solid #c0392b; 
                padding: 6px; 
                border-radius: 4px;
            ">
                ☠ ${t('anvil_warning')}
            </div>`;
        // ---------------------------------

        card.innerHTML = `${imgTag}<h3>${cName}</h3><div style="font-size:14px;color:#bbb">${cDesc}</div>${warnText}<div style="margin-top:10px; color:#e74c3c; font-weight:bold; font-size: 14px;">${t('cursed_prefix') || 'CURSED'}</div>`;
        
        let btn = document.createElement('button');
        btn.className = 'btn'; btn.style.background = '#27ae60'; btn.style.marginTop = '10px'; btn.style.fontSize = '16px'; btn.style.minWidth = '140px';
        btn.innerText = "CURSE IT"; 
        
        btn.onclick = () => {
            applyCurse(c.id); 
            title.style.color = ''; 
            if(anvilObj) anvilObj.active = false;
            resumeGame();
        };
        card.onclick = btn.onclick;
        wrapper.appendChild(card);
        wrapper.appendChild(btn);
        box.appendChild(wrapper);
    });
    
    let closeDiv = document.createElement('div');
    closeDiv.style.width = '100%'; closeDiv.style.textAlign = 'center'; closeDiv.style.marginTop = '30px';
    let closeBtn = document.createElement('button');
    closeBtn.className = 'btn'; closeBtn.style.background = '#555'; closeBtn.innerText = "LEAVE (LATER)";
    closeBtn.onclick = () => { title.style.color = ''; if(anvilObj) anvilObj.cooldown = 100; resumeGame(); };
    closeDiv.appendChild(closeBtn);
    box.appendChild(closeDiv);
}

// game/ui.js

// game/ui.js -> Замени window.openShopMenu целиком

window.openShopMenu = function(traderObj) {
    if(window.Cloud && window.Cloud.unlockCodexWorld) window.Cloud.unlockCodexWorld('merchant');
    if (document.activeElement) document.activeElement.blur();
    gameState = 'UPGRADE'; 
    const box = document.getElementById('cards-box');
    const title = document.getElementById('upgrade-title');
    const desc = document.getElementById('upgrade-desc');
    const screen = document.getElementById('upgrade-screen');

    screen.style.display = 'flex';
    title.innerText = t('shop_title');
    title.style.color = '#f1c40f'; title.style.textShadow = "0 0 15px #f39c12";
    let left = 3 - (traderObj.purchases || 0);
    desc.innerText = `${t('shop_desc')} (Left: ${left})`;
    desc.style.color = '#fff';
    box.innerHTML = ''; 

    // ГЕНЕРАЦИЯ (С ВЕСАМИ)
    if (!traderObj.shopInventory) {
        let exclusives = DB.shopItems.filter(i => i.stage === currentStage);
        let general = DB.shopItems.filter(i => !i.stage);
        let fullPool = [...general, ...exclusives]; 

        const pickWeighted = (pool) => {
            let rnd = Math.random() * 100;
            let targetRarity = 'common';
            if (rnd > 60) targetRarity = 'rare';
            if (rnd > 85) targetRarity = 'epic';
            if (rnd > 99) targetRarity = 'legendary';
            let candidates = pool.filter(i => i.rarity === targetRarity);
            if (candidates.length === 0) candidates = pool;
            return candidates[Math.floor(Math.random() * candidates.length)];
        };

        let inventory = [];
        // Слот 1: Эксклюзив (если есть) или Общий
        if (exclusives.length > 0) {
            inventory.push({ ...pickWeighted(exclusives), soldOut: false });
        } else {
            inventory.push({ ...pickWeighted(general), soldOut: false });
        }
        // Слоты 2-6: Рандом
        for(let i=0; i<5; i++) {
            inventory.push({ ...pickWeighted(fullPool), soldOut: false });
        }
        traderObj.shopInventory = inventory;
    }

    // ОТРИСОВКА
    traderObj.shopInventory.forEach((item, index) => {
        let wrapper = document.createElement('div'); wrapper.className = 'card-wrapper';
        let card = document.createElement('div'); 
        card.className = `card border-${item.rarity || 'common'}`;
        card.style.height = '340px'; // Чуть выше для плашки
        card.style.display = 'flex'; card.style.flexDirection = 'column'; card.style.justifyContent = 'space-between';
        
        let itemName = t(item.nameKey);
        
        // --- ЦВЕТНЫЕ ПЛАШКИ ЭКСКЛЮЗИВОВ ---
        let exclusiveLabel = "";
        if (item.stage) {
            let color = "#fff";
            let txt = "EXCLUSIVE";
            if (item.stage === 1) { color = "#2ecc71"; txt = "GRAVEYARD ONLY"; } // Зеленый
            if (item.stage === 2) { color = "#e67e22"; txt = "DESERT ONLY"; }    // Оранжевый
            if (item.stage === 3) { color = "#e74c3c"; txt = "VOLCANO ONLY"; }   // Красный
            if (item.stage === 4) { color = "#3498db"; txt = "CAVES ONLY"; }     // Голубой
            if (item.stage === 5) { color = "#1abc9c"; txt = "VOID ONLY"; }      // Темно-бирюзовый
            
            exclusiveLabel = `<div class="shop-exclusive-label" style="color:${color}; border-color:${color}">${txt}</div>`;
        }
        // ----------------------------------

        let imgPath = `sprites/merchant/${item.img}`;
        let imgTag = `<img src="${imgPath}" style="width:64px; height:64px; object-fit:contain; margin-bottom:10px; filter: drop-shadow(0 0 5px rgba(255,255,255,0.2));" onerror="this.src='sprites/map/gold1.png'">`;

        if (item.soldOut) {
            card.style.opacity = '0.6'; card.style.borderColor = '#555'; card.style.background = '#222'; card.style.boxShadow = 'none';
            card.innerHTML = `<div style="opacity:0.5; filter:grayscale(100%)">${imgTag}</div><h3 style="color:#7f8c8d; text-decoration: line-through;">${itemName}</h3><div style="color:#e74c3c; font-weight:bold; font-size:28px; border: 2px solid #e74c3c; transform: rotate(-10deg); padding: 5px; margin-top: 20px;">${t('shop_sold_out')}</div>`;
            wrapper.appendChild(card);
        } else {
            let itemDesc = t(item.descKey);
            // Добавляем exclusiveLabel в начало
            let topContent = `<div>${exclusiveLabel}${imgTag}<h3 style="color:#f1c40f; margin: 5px 0;">${itemName}</h3><div style="font-size:13px; color:#ddd;">${itemDesc}</div></div>`;
            
            let priceColor = (player.gold >= item.cost) ? '#2ecc71' : '#e74c3c';
            let bottomContent = `<div style="font-size:20px; font-weight:bold; color:${priceColor}; margin-bottom: 5px;">${item.cost} G</div>`;
            card.innerHTML = topContent + bottomContent;

            let btn = document.createElement('button');
            btn.className = 'btn'; btn.style.marginTop = '10px'; btn.style.background = '#f39c12';
            btn.innerText = t('btn_buy');
            btn.onclick = () => {
                if (player.gold >= item.cost) {
                    player.gold -= item.cost;
                    applyShopEffect(item);
                    item.soldOut = true;
                    traderObj.purchases = (traderObj.purchases || 0) + 1;
                    updateUI();
                    if (traderObj.purchases >= 3) { traderObj.active = false; resumeGame(); } else { window.openShopMenu(traderObj); }
                } else {
                    btn.style.background = '#e74c3c'; let oldText = btn.innerText;
                    btn.innerText = "NO GOLD!";
                    setTimeout(() => { btn.style.background = '#f39c12'; btn.innerText = oldText; }, 1000);
                }
            };
            wrapper.appendChild(card);
            wrapper.appendChild(btn);
        }
        box.appendChild(wrapper);
    });

    let bottomDiv = document.createElement('div');
    bottomDiv.style.width = '100%'; bottomDiv.style.textAlign = 'center'; bottomDiv.style.marginTop = '20px'; bottomDiv.style.display = 'flex'; bottomDiv.style.justifyContent = 'center'; bottomDiv.style.gap = '20px';

    // ЦЕНА УДАЛЕНИЯ 5000
    let removeBtn = document.createElement('button');
    removeBtn.className = 'btn'; removeBtn.style.background = '#c0392b'; removeBtn.innerText = t('btn_remove_item').replace('10000', '5000'); // Динамически меняем текст
    removeBtn.onclick = () => {
        if (player.gold >= 5000) { window.openRemoveItemMenu(traderObj); } 
        else {
            removeBtn.style.background = '#555'; let oldText = removeBtn.innerText;
            removeBtn.innerText = "NEED 5k GOLD!";
            setTimeout(() => { removeBtn.style.background = '#c0392b'; removeBtn.innerText = oldText; }, 1000);
        }
    };
    bottomDiv.appendChild(removeBtn);

    let closeBtn = document.createElement('button');
    closeBtn.className = 'btn'; closeBtn.style.background = '#555'; closeBtn.innerText = t('btn_leave_shop');
    closeBtn.onclick = () => { title.style.color = ''; resumeGame(); };
    bottomDiv.appendChild(closeBtn);
    box.appendChild(bottomDiv);
}

// game/ui.js -> Замени window.openRemoveItemMenu целиком

window.openRemoveItemMenu = function(traderObj) {
    const box = document.getElementById('cards-box');
    const title = document.getElementById('upgrade-title');
    const desc = document.getElementById('upgrade-desc');
    title.innerText = "REMOVE ITEM"; title.style.color = "#c0392b"; 
    desc.innerText = "Select an item to DESTROY (-5,000 G)"; // Текст 5000
    box.innerHTML = '';
    
    let allItems = [];
    player.weapons.forEach((w, idx) => { allItems.push({ type: 'weapon', data: w, index: idx }); });
    for (let id in player.items) { allItems.push({ type: 'item', id: id, level: player.items[id] }); }

    if (allItems.length === 0) desc.innerText = "Inventory is empty!";

    allItems.forEach(entry => {
        let wrapper = document.createElement('div'); wrapper.className = 'card-wrapper';
        let card = document.createElement('div'); card.className = 'card';
        card.style.borderColor = '#c0392b'; 
        
        let name = "", imgName = "";
        if (entry.type === 'weapon') { name = tDB(entry.data.id, 'name'); imgName = `sprites/weapons/${entry.data.img}`; } 
        else { name = tDB(entry.id, 'name'); let itemDb = DB.items[entry.id]; imgName = `sprites/items/${itemDb.img}`; }

        card.innerHTML = `<img src="${imgName}" style="width:64px; height:64px; object-fit:contain; margin-bottom:10px;"><h3>${name}</h3>`;
        let btn = document.createElement('button');
        btn.className = 'btn'; btn.innerText = "DESTROY"; btn.style.background = '#c0392b'; btn.style.marginTop = '10px';
        
        btn.onclick = () => {
            // ПРОВЕРКА НА 5000
            if (player.gold >= 5000) {
                player.gold -= 5000;
                if (entry.type === 'weapon') player.weapons.splice(entry.index, 1);
                else { delete player.items[entry.id]; if (player.cursedItems) delete player.cursedItems[entry.id]; }
                if(window.updateUI) window.updateUI(); if(window.updateInventoryUI) window.updateInventoryUI();
                window.openShopMenu(traderObj);
            } else {
                 btn.style.background = '#555'; let oldText = btn.innerText;
                 btn.innerText = "NEED 5k!";
                 setTimeout(() => { btn.style.background = '#c0392b'; btn.innerText = oldText; }, 1000);
            }
        };
        wrapper.appendChild(card); wrapper.appendChild(btn); box.appendChild(wrapper);
    });

    let backBtnDiv = document.createElement('div');
    backBtnDiv.style.width = '100%'; backBtnDiv.style.textAlign = 'center'; backBtnDiv.style.marginTop = '20px';
    let backBtn = document.createElement('button');
    backBtn.className = 'btn'; backBtn.innerText = "BACK TO SHOP";
    backBtn.onclick = () => { window.openShopMenu(traderObj); };
    backBtnDiv.appendChild(backBtn); box.appendChild(backBtnDiv);
};

// ЧИТ МЕНЮ (UI)
window.debugShowHitboxes = false;
window.toggleHitboxes = function() {
    window.debugShowHitboxes = !window.debugShowHitboxes;
};

// game/ui.js -> В самом низу файла

// Добавление кнопок чита (Хитбоксы и Спавн)
setTimeout(() => {
    const cheatMenu = document.getElementById('cheat-menu');
    if (cheatMenu) {
        const container = cheatMenu.querySelector('div'); 
        if (container) {
            // Hitbox Button
            const btn = document.createElement('button');
            btn.className = 'btn'; btn.innerText = "TOGGLE HITBOXES";
            btn.style.border = "1px solid red"; btn.style.marginTop = "10px";
            btn.onclick = () => window.toggleHitboxes();
            container.insertBefore(btn, container.lastElementChild);

            // Spawn Buttons
            const spawnDiv = document.createElement('div');
            spawnDiv.style.marginTop = "15px"; spawnDiv.style.borderTop = "1px solid #555"; spawnDiv.style.paddingTop = "10px";
            spawnDiv.style.display = "flex"; spawnDiv.style.flexDirection = "column"; spawnDiv.style.gap = "5px";
            spawnDiv.innerHTML = "<div style='color:#aaa; font-size:12px; text-align:center'>--- SPAWN ENEMY ---</div>";

            const btnM1 = document.createElement('button'); btnM1.className = 'btn'; btnM1.innerText = "SPAWN MINI-1"; btnM1.style.background = "#8e44ad"; 
            btnM1.onclick = () => window.forceSpawn('mini1');

            const btnM2 = document.createElement('button'); btnM2.className = 'btn'; btnM2.innerText = "SPAWN MINI-2"; btnM2.style.background = "#8e44ad";
            btnM2.onclick = () => window.forceSpawn('mini2');

            const btnBoss = document.createElement('button'); btnBoss.className = 'btn'; btnBoss.innerText = "SPAWN BOSS"; btnBoss.style.background = "#c0392b";
            btnBoss.onclick = () => window.forceSpawn('boss');

            // ВОТ ЧТО БЫЛО ПРОПУЩЕНО: Создание кнопки торговца
            const btnMerch = document.createElement('button'); 
            btnMerch.className = 'btn'; 
            btnMerch.innerText = "SPAWN MERCHANT"; 
            btnMerch.style.background = "#f1c40f"; 
            btnMerch.onclick = () => window.forceSpawn('merchant');

            const btnSoul = document.createElement('button'); 
            btnSoul.className = 'btn'; 
            btnSoul.innerText = "GIVE SOUL STONE"; 
            btnSoul.style.background = "#9b59b6"; // Фиолетовый цвет
            btnSoul.onclick = () => window.cheatGiveSoulStone();

            spawnDiv.appendChild(btnM1); 
            spawnDiv.appendChild(btnM2); 
            spawnDiv.appendChild(btnBoss);
            spawnDiv.appendChild(btnMerch); // Теперь ошибки не будет, так как btnMerch существует
            spawnDiv.appendChild(btnSoul);
            
            container.appendChild(spawnDiv);
        }
    }
}, 1500);

// --- ЧИТ-ФУНКЦИИ (Перенесены сюда для чистоты) ---
window.toggleGodMode = function() {
    isGodMode = !isGodMode;
    const btn = document.getElementById('btn-godmode');
    if(btn) btn.innerText = `GOD MODE: ${isGodMode?'ON':'OFF'}`;
}

window.toggleTimeSpeed = function() {
    if (timeScale === 1) timeScale = 2;
    else if (timeScale === 2) timeScale = 5;
    else if (timeScale === 5) timeScale = 10;
    else if (timeScale === 10) timeScale = 20;
    else timeScale = 1;
    
    const btn = document.getElementById('btn-speed');
    if(btn) btn.innerText = `SPEED: x${timeScale}`;
}

window.cheatAddMight = function() { player.stats.might += 0.5; }
window.cheatAddGold = function() { player.gold += 5000; updateUI(); }
window.cheatKillAll = function() { enemies.forEach(e => dealDamage(e, 99999)); }
window.cheatNextStage = function() { if(currentStage < 5) nextStage(currentStage+1); }

// Обработчик открытия меню
window.toggleCheatMenu = function() {
    const m = document.getElementById('cheat-menu');
    if (m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
}
// Слушатель F2 (оставляем глобальным)
window.addEventListener('keydown', e => { 
    if(e.code === 'F2') window.toggleCheatMenu(); 
});

// firebase
// game/ui.js -> ВСТАВИТЬ В САМЫЙ КОНЕЦ ФАЙЛА

// --- ЛОГИКА АВТОРИЗАЦИИ UI ---

// 1. Переключение между Входом и Регистрацией
window.showRegister = function() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    const err = document.getElementById('reg-error');
    if(err) err.innerText = '';
}

window.showLogin = function() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    const err = document.getElementById('login-error');
    if(err) err.innerText = '';
}

// 2. Обработка кнопки ВХОД
window.performLogin = async function() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const errDiv = document.getElementById('login-error');
    
    if (!email || !pass) { errDiv.innerText = "Fill all fields!"; return; }
    
    errDiv.innerText = "Logging in...";
    const res = await window.Cloud.login(email, pass);
    
    if (res.success) {
        console.log("Login success UI");
    } else {
        errDiv.innerText = res.msg; 
    }
}

// 3. Обработка кнопки РЕГИСТРАЦИЯ
window.performRegister = async function() {
    const nick = document.getElementById('reg-nick').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const errDiv = document.getElementById('reg-error');

    if (!nick || !email || !pass) { errDiv.innerText = "Fill all fields!"; return; }
    if (pass.length < 6) { errDiv.innerText = "Password too short (min 6)!"; return; }

    errDiv.innerText = "Creating account...";
    const res = await window.Cloud.register(email, pass, nick);

    if (res.success) {
        console.log("Reg success UI");
    } else {
        errDiv.innerText = res.msg;
    }
}

// 4. Главная функция обновления Меню (вызывается из firebasemanager)
window.updateMainMenuUI = function() {
// --- FIX: Добавил GAMEOVER в список исключений, чтобы меню не вылезало при смерти ---
    if (gameState === 'PLAYING' || gameState === 'LOBBY' || gameState === 'MATCHMAKING' || 
        gameState === 'PVP_MENU' || gameState === 'RANKED_HUB' || gameState === 'GAMEOVER') {
        return; 
    }
    // ----------------------------
    const cvs = document.getElementById('gameCanvas');
    const hud = document.getElementById('ui-layer');
    if(cvs) cvs.classList.add('game-hidden');
    if(hud) hud.classList.add('game-hidden');
    const user = window.Cloud.user;
    const data = window.Cloud.playerData;
    
    const authContainer = document.getElementById('auth-container');
    const menuButtons = document.getElementById('main-menu-buttons');
    const profileCorner = document.getElementById('user-profile-corner');
    const nickDisp = document.getElementById('user-nickname-disp');

    if (user) {
        // ЕСЛИ ВОШЕЛ: Скрываем формы, показываем кнопку PLAY и Профиль
        if(authContainer) authContainer.style.display = 'none';
        if(menuButtons) {
            menuButtons.style.display = 'flex';
            
// --- ИСПРАВЛЕННАЯ ЛОГИКА СООБЩЕНИЯ ---
            const successMsg = document.getElementById('login-success-msg');
            if (successMsg) {
                if (!loginMessageShown) {
                    // Если еще не показывали - показываем и запускаем таймер
                    successMsg.style.display = 'block';
                    successMsg.style.opacity = '1';
                    setTimeout(() => { 
                        successMsg.style.transition = 'opacity 1s'; 
                        successMsg.style.opacity = '0'; 
                    }, 3000);
                    loginMessageShown = true; // Запоминаем, что показали
                } else {
                    // Если уже видели - скрываем сразу и навсегда
                    successMsg.style.display = 'none';
                }
            }
        }
        
        if(profileCorner) {
            profileCorner.style.display = 'block';
            if(data && data.nickname) {
                nickDisp.innerText = data.nickname;
            } else if (user.email) {
                nickDisp.innerText = user.email.split('@')[0];
            }
        }
        
        // Синхронизация времени из облака (о чем мы говорили ранее)
        if (data && data.stats && typeof data.stats.timePlayed !== 'undefined') {
            if(window.syncTimeFromCloud) window.syncTimeFromCloud(data.stats.timePlayed);
        }

    } else {
        // ЕСЛИ НЕ ВОШЕЛ: Показываем формы, скрываем PLAY
        if(authContainer) authContainer.style.display = 'block';
        if(menuButtons) menuButtons.style.display = 'none';
        if(profileCorner) profileCorner.style.display = 'none';
    }
}

// 5. Выпадающее меню профиля
window.toggleProfileMenu = function() {
    const menu = document.getElementById('user-profile-dropdown');
    if(menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// Закрываем меню при клике вне его
window.addEventListener('click', function(e) {
    const header = document.getElementById('user-profile-header');
    const menu = document.getElementById('user-profile-dropdown');
    if (header && menu && !header.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// game/ui.js -> В самый конец

// --- ЛОГИКА ТАБЛИЦЫ ЛИДЕРОВ ---
window.isPvPLeaderboard = false;

window.openLeaderboard = function(fromPvP = false) {
    window.isPvPLeaderboard = fromPvP;
    
    // Скрываем нужное меню
    if (fromPvP) document.getElementById('pvp-ranked-hub').style.display = 'none';
    else document.getElementById('start-screen').style.display = 'none';
    
    document.getElementById('leaderboard-screen').style.display = 'flex';
    
    // Если из ПвП - сразу открываем ЭЛО, иначе Время
    if (fromPvP) window.loadLeaderboardUI('elo');
    else window.loadLeaderboardUI('time');
}

window.closeLeaderboard = function() {
    document.getElementById('leaderboard-screen').style.display = 'none';
    
    // Возвращаемся туда, откуда пришли
    if (window.isPvPLeaderboard) {
        document.getElementById('pvp-ranked-hub').style.display = 'flex';
    } else {
        document.getElementById('start-screen').style.display = 'flex';
    }
}

window.loadLeaderboardUI = async function(type) {
    const listDiv = document.getElementById('leaderboard-list');
    const btnTime = document.getElementById('lb-tab-time');
    const btnKills = document.getElementById('lb-tab-kills');
    const btnElo = document.getElementById('lb-tab-elo'); // Новая кнопка
    
    // Сброс стилей
    [btnTime, btnKills, btnElo].forEach(b => {
        if(b) { b.style.background = '#555'; b.style.color = 'white'; }
    });

    // Подсветка активной
    let activeBtn = (type === 'time') ? btnTime : (type === 'kills' ? btnKills : btnElo);
    if(activeBtn) {
        activeBtn.style.background = '#f39c12'; 
        activeBtn.style.color = 'black';
    }

    listDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#aaa;">Loading top players...</div>';

    // Запрос к Firebase
    const data = await window.Cloud.getLeaderboard(type);

    if (!data || data.length === 0) {
        listDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#e74c3c;">No records found yet. Be the first!</div>';
        return;
    }

    let html = '';
    data.forEach((p, index) => {
        let rank = index + 1;
        
        let val = 0;
        let char = 'knight';
        let valDisplay = '';

        if (type === 'elo') {
            val = p.elo || 1000;
            // Для ЭЛО берем аватарку из последнего рекорда или дефолт
            char = (p.records && p.records.bestTimeChar) ? p.records.bestTimeChar : 'knight';
            valDisplay = `<span style="color:#f1c40f">${val} MMR</span>`;
        } 
        else if (p.records) {
            if (type === 'time') {
                val = p.records.bestTime || 0;
                char = p.records.bestTimeChar || 'knight';
                let m = Math.floor(val / 60);
                let s = Math.floor(val % 60);
                valDisplay = (m<10?'0'+m:m) + ':' + (s<10?'0'+s:s);
            } else {
                val = p.records.maxKills || 0;
                char = p.records.maxKillsChar || 'knight';
                valDisplay = val + ' 💀';
            }
        }

        let iconPath = `sprites/other/${char}_s.png`;
        let fallbackPath = `sprites/characters/${char}/${char}1.png`;

        html += `
            <div class="lb-row">
                <div class="lb-rank">#${rank}</div>
                <img src="${iconPath}" class="lb-icon" onerror="this.src='${fallbackPath}'">
                <div class="lb-name">${p.nickname || 'Unknown'}</div>
                <div class="lb-val">${valDisplay}</div>
            </div>
        `;
    });

    listDiv.innerHTML = html;
}

// game/ui.js

window.returnToCharSelect = function() {
    // 1. Скрываем экран Game Over
    document.getElementById('gameover-screen').style.display = 'none';
    
    // 2. На всякий случай скрываем паузу и интерфейс, если они висят
    document.getElementById('pause-menu').style.display = 'none';
    
    // 3. Открываем выбор персонажа
    window.openCharSelect();
    
    // 4. (Опционально) Можно сбросить музыку на тему меню, если нужно
    const am = document.getElementById('audio-menu');
    const ag = document.getElementById('audio-game');
    if(ag) ag.pause();
    if(am && am.paused) am.play().catch(()=>{});
}

// game/ui.js -> В самый конец

// --- КОДЕКС (GRIMOIRE) ---

window.openCodex = function() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('codex-screen').style.display = 'flex';
    window.openCodexTab('enemies'); // По умолчанию
}

window.closeCodex = function() {
    document.getElementById('codex-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    document.getElementById('codex-details').style.display = 'none';
}

// game/ui.js -> ЗАМЕНИТЬ ВСЮ ФУНКЦИЮ openCodexTab

window.openCodexTab = function(tab) {
    document.getElementById('codex-tab-enemies').style.background = (tab === 'enemies' ? '#9b59b6' : '#555');
    document.getElementById('codex-tab-items').style.background = (tab === 'items' ? '#9b59b6' : '#555');
    document.getElementById('codex-tab-world').style.background = (tab === 'world' ? '#9b59b6' : '#555');
    
    const grid = document.getElementById('codex-grid');
    grid.innerHTML = '';
    
    let unlocked = { enemies: {}, items: {}, world: {} };
    if (window.Cloud && window.Cloud.playerData && window.Cloud.playerData.codex) {
        unlocked = window.Cloud.playerData.codex;
    }

    // --- ВРАГИ ---
    if (tab === 'enemies') {
        let processedBosses = [];

        for (let id in LORE.enemies) {
            // Группировка Боссов
            let bossGroup = null;
            if (id.startsWith('boss3')) bossGroup = 'boss3';
            if (id.startsWith('boss5')) bossGroup = 'boss5';

            if (bossGroup) {
                if (processedBosses.includes(bossGroup)) continue;
                processedBosses.push(bossGroup);
                
                let anySeen = false;
                if (bossGroup === 'boss3') anySeen = (unlocked.enemies['boss31']?.seen || unlocked.enemies['boss32']?.seen);
                if (bossGroup === 'boss5') anySeen = (unlocked.enemies['boss51']?.seen || unlocked.enemies['boss52']?.seen || unlocked.enemies['boss53']?.seen);
                
                let div = document.createElement('div');
                div.className = 'codex-slot';
                let iconId = bossGroup + '1'; 
                let imgPath = `sprites/enemy/${iconId}/${iconId}_down.png`;

                // Всегда рисуем картинку!
                div.innerHTML = `<img src="${imgPath}" onerror="this.onerror=null; this.src='sprites/map/gold1.png';">`;

                if (anySeen) {
                    div.onclick = () => showCodexDetails(bossGroup, 'boss_group', null, 0, null);
                } else {
                    div.classList.add('locked'); // CSS сделает силуэт
                }
                grid.appendChild(div);
                continue;
            }

            // Обычные враги
            let entry = LORE.enemies[id];
            let data = unlocked.enemies[id] || unlocked.enemies[id.replace('1', '')]; // Проверка старого ID
            let isSeen = data && data.seen;
            let kills = isSeen ? data.kills : 0;
            
            let div = document.createElement('div');
            div.className = 'codex-slot';
            
            let folderName = id;
            if (id === 'skeleton1') folderName = 'skeleton';
            if (id === 'zombie1') folderName = 'zombie';
            let imgPath = `sprites/enemy/${folderName}/${id}_down.png`;

            // Улучшенный поиск картинки: сначала _down, если нет - обычную (через onerror в HTML)
            // Но мы пока просто ставим _down
            div.innerHTML = `<img src="${imgPath}" onerror="this.src='sprites/enemy/${folderName}/${id}.png'; this.onerror=null;">`;

            if (isSeen) {
                div.onclick = () => showCodexDetails(id, 'enemy', entry, kills, imgPath);
            } else {
                div.classList.add('locked');
            }
            grid.appendChild(div);
        }
    } 
    // --- ПРЕДМЕТЫ ---
    else if (tab === 'items') {
        let allItems = { ...DB.weapons, ...DB.items };
        for (let id in allItems) {
            if (id === 'gold' || id === 'xp') continue;
            let isOwned = unlocked.items && unlocked.items[id];
            
            let div = document.createElement('div');
            div.className = 'codex-slot';
            
            let imgFolder = DB.weapons[id] ? 'weapons' : 'items';
            let imgPath = `sprites/${imgFolder}/${allItems[id].img}`;
            
            // Всегда рисуем картинку
            div.innerHTML = `<img src="${imgPath}">`;
            
            if (isOwned) {
                div.onclick = () => showCodexDetails(id, 'item', null, 0, imgPath);
            } else {
                div.classList.add('locked');
            }
            grid.appendChild(div);
        }
    }
    // --- МИР ---
    else if (tab === 'world') {
        if (!LORE.world) return;
        for (let id in LORE.world) {
            let isUnlocked = (unlocked.world && unlocked.world[id]);
            let div = document.createElement('div');
            div.className = 'codex-slot';
            
let imgPath = 'sprites/map/gold1.png'; // Заглушка
            
            if (id === 'merchant') imgPath = 'sprites/map/torgovec.png'; 
            
            // --- ВОТ ТУТ МЫ РАЗДЕЛЯЕМ СУНДУКИ ---
            if (id === 'chest_normal') imgPath = 'sprites/map/chest1.png';
            if (id === 'chest_gold') imgPath = 'sprites/map/goldenchest1.png'; // <--- Твой золотой сундук
            // ------------------------------------

            if (id === 'anvil') imgPath = 'sprites/map/cursedanvil.png';
            if (id === 'monument') imgPath = 'sprites/map/monument1.png';
            if (id === 'portal') imgPath = 'sprites/map/tp12.png';

            div.innerHTML = `<img src="${imgPath}" onerror="this.src='sprites/map/gold1.png'">`;

            if (isUnlocked) {
                div.onclick = () => showCodexDetails(id, 'world', LORE.world[id], 0, imgPath);
            } else {
                div.classList.add('locked');
            }
            grid.appendChild(div);
        }
    }
}

// game/ui.js -> ЗАМЕНИТЬ ВСЮ ФУНКЦИЮ showCodexDetails

function showCodexDetails(id, type, loreEntry, statVal, imgPath) {
    const details = document.getElementById('codex-details');
    const title = document.getElementById('cdx-title');
    const sub = document.getElementById('cdx-subtitle');
    const desc = document.getElementById('cdx-desc');
    const stat = document.getElementById('cdx-stat');
    const img = document.getElementById('cdx-img');
    
    details.style.display = 'flex';
    
    // Сброс контента
    let extraContainer = document.getElementById('cdx-extra');
    if(extraContainer) extraContainer.remove(); 
    extraContainer = document.createElement('div');
    extraContainer.id = 'cdx-extra';
    extraContainer.style.width = '100%';
    extraContainer.style.marginTop = '10px';
    
    let textBlock = details.querySelector('div[style="flex: 1;"]');
    if(textBlock) textBlock.appendChild(extraContainer);

    if (imgPath) {
        img.src = imgPath;
        img.onerror = () => { img.onerror = null; img.src = 'sprites/map/gold1.png'; };
    }

    // --- БОССЫ ---
    if (type === 'boss_group') {
        let phases = [];
        if (id === 'boss3') phases = ['boss31', 'boss32'];
        if (id === 'boss5') phases = ['boss51', 'boss52', 'boss53'];
        
        let unlocked = {};
        if (window.Cloud.playerData && window.Cloud.playerData.codex && window.Cloud.playerData.codex.enemies) {
            unlocked = window.Cloud.playerData.codex.enemies;
        }
        
        let btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex'; btnContainer.style.gap = '5px'; btnContainer.style.marginBottom = '10px';
        let firstAvailableBtn = null;

        phases.forEach((pid, idx) => {
            let isSeen = unlocked[pid] && unlocked[pid].seen;
            if (!isSeen) return; 

            let btn = document.createElement('button');
            btn.innerText = ["I", "II", "III"][idx];
            btn.className = 'btn'; 
            btn.style.minWidth = '40px'; btn.style.padding = '5px'; btn.style.fontSize = '14px'; btn.style.margin = '0';
            btn.style.background = '#555';

            btn.onclick = () => {
                let entry = LORE.enemies[pid];
                if(entry) {
                    title.innerText = entry.name[currentLang] || entry.name.en;
                    sub.innerText = entry.title[currentLang] || entry.title.en;
                    desc.innerText = entry.desc[currentLang] || entry.desc.en;
                    stat.innerText = `${t('kill_count')}: ${unlocked[pid].kills}`;
                    let folderName = pid;
                    if(pid === 'boss31') folderName = 'boss31'; 
                    let pImg = `sprites/enemy/${folderName}/${pid}_down.png`; 
                    img.src = pImg;
                    img.onerror = () => { img.src = `sprites/enemy/${folderName}/${pid}.png`; };
                }
                Array.from(btnContainer.children).forEach(b => b.style.border = 'none');
                btn.style.border = '2px solid #f1c40f';
            };
            btnContainer.appendChild(btn);
            if(!firstAvailableBtn) firstAvailableBtn = btn;
        });
        
        extraContainer.appendChild(btnContainer);
        if (firstAvailableBtn) firstAvailableBtn.click();
        return; 
    }

    // --- ВРАГИ ---
    if (type === 'enemy') {
        title.innerText = loreEntry.name[currentLang] || loreEntry.name.en;
        sub.innerText = loreEntry.title[currentLang] || loreEntry.title.en;
        desc.innerText = loreEntry.desc[currentLang] || loreEntry.desc.en;
        stat.innerText = `${t('kill_count')}: ${statVal}`;
    } 
    // --- ПРЕДМЕТЫ (SOUL STONE FIX) ---
    else if (type === 'item') {
        if (id === 'soul_stone') {
            let maxLvl = 0;
            if (window.Cloud && window.Cloud.playerData) maxLvl = window.Cloud.playerData.codex.items['soul_stone'] || 0;
            
            title.innerText = tDB(id, 'name');
            sub.innerText = "Ancient Artifact";
            stat.innerText = `Current Power: Level ${maxLvl}`;
            desc.innerText = "";

            let btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex'; btnContainer.style.gap = '5px'; btnContainer.style.marginBottom = '10px';
            btnContainer.style.flexWrap = 'wrap';

            let loreLevels = LORE.items.soul_stone.levels; 
            let firstBtn = null;

            loreLevels.forEach((loreObj, idx) => {
                // Если maxLvl=1, то открыт индекс 0 (по массиву) и индекс 1? 
                // Нет, обычно maxLvl=1 значит открыт только 1-й (индекс 0).
                // У тебя в базе 1..5. Массив 0..5 (6 штук? или 5?).
                // В LORE у тебя 6 записей (0-5). А в базе сохраняем 1-5.
                // Давай считать: Индекс + 1 <= maxLvl.
                
                // Исправление логики уровней (1-5)
                let visualNum = idx + 1; // 1, 2, 3...
                let isUnlocked = visualNum <= maxLvl;
                
                // Если это 0-й элемент массива (самый первый текст), он должен быть открыт, если есть камень (lvl >= 1)
                // Если у тебя в базе 0 - значит камня нет.
                
                let btn = document.createElement('button');
                btn.innerText = visualNum; // Пишем 1, 2, 3...
                btn.className = 'btn';
                btn.style.minWidth = '30px'; btn.style.padding = '5px'; btn.style.fontSize = '12px'; btn.style.margin = '0';
                
                if (isUnlocked) {
                    btn.style.background = '#9b59b6'; 
                    btn.onclick = () => {
                        desc.innerText = loreObj[currentLang] || loreObj.en;
                        img.src = `sprites/items/soulstone${visualNum}.png`; // soulstone1.png ...
                        Array.from(btnContainer.children).forEach(b => b.style.borderColor = 'transparent');
                        btn.style.border = '2px solid white';
                    };
                    firstBtn = btn;
                } else {
                    btn.style.background = '#333';
                    btn.style.color = '#555';
                    btn.disabled = true;
                }
                btnContainer.appendChild(btn);
            });

            extraContainer.appendChild(btnContainer);
            if(firstBtn) firstBtn.click();

        } else {
            title.innerText = tDB(id, 'name');
            sub.innerText = DB.weapons[id] ? "Weapon" : "Passive Item";
            desc.innerText = tDB(id, 'desc');
            stat.innerText = "";
        }
    }
    // --- ТОРГОВЕЦ (TOOLTIP FIX) ---
    else if (type === 'world') {
        title.innerText = loreEntry.name[currentLang] || loreEntry.name.en;
        sub.innerText = loreEntry.title[currentLang] || loreEntry.title.en;
        desc.innerText = loreEntry.desc[currentLang] || loreEntry.desc.en;
        stat.innerText = "";

        if (id === 'merchant') {
            let btnWares = document.createElement('button');
            btnWares.className = 'btn'; 
            btnWares.innerText = "VIEW WARES";
            btnWares.style.width = '100%'; btnWares.style.marginTop = '10px'; btnWares.style.background = '#f39c12';
            btnWares.onclick = () => {
                let waresDiv = document.createElement('div');
                waresDiv.style.display = 'grid'; waresDiv.style.gridTemplateColumns = 'repeat(6, 1fr)'; 
                waresDiv.style.gap = '5px'; waresDiv.style.marginTop = '10px'; 
                waresDiv.style.background = 'rgba(0,0,0,0.5)'; waresDiv.style.padding = '10px'; waresDiv.style.borderRadius = '8px';
                
                let myItems = {};
                if(window.Cloud.playerData && window.Cloud.playerData.codex && window.Cloud.playerData.codex.items) {
                    myItems = window.Cloud.playerData.codex.items;
                }
                
                DB.shopItems.forEach(shopItem => {
                    let d = document.createElement('div');
                    // Добавляем класс merch-slot для стилей (тултипы работают от него)
                    d.className = 'merch-slot'; 
                    d.style.width = '40px'; d.style.height = '40px'; 
                    
                    if (myItems[shopItem.id]) {
                        d.style.borderColor = '#f1c40f';
                        d.style.background = 'rgba(241, 196, 15, 0.1)';
                        d.innerHTML = `<img src="sprites/merchant/${shopItem.img}" style="width:32px;height:32px;">`;
                        
                        // Тултип
                        let itemName = t(shopItem.nameKey);
                        let itemDesc = t(shopItem.descKey);
                        let tooltip = document.createElement('span');
                        tooltip.className = 'tooltip';
                        tooltip.innerHTML = `<b style="color:#f1c40f">${itemName}</b><br><span style="font-size:12px; color:#ddd">${itemDesc}</span>`;
                        d.appendChild(tooltip);
                    } else {
                        // НЕ КУПЛЕНО: Рисуем силуэт
                        d.style.background = '#222';
                        // filter: brightness(0) делает черным, opacity(0.3) делает полупрозрачным
                        d.innerHTML = `<img src="sprites/merchant/${shopItem.img}" style="width:32px;height:32px; filter: brightness(0) opacity(0.3);">`;
                        d.style.cursor = 'default';
                    }
                    waresDiv.appendChild(d);
                });
                
                extraContainer.innerHTML = '';
                extraContainer.appendChild(waresDiv);
            };
            extraContainer.appendChild(btnWares);
        }
    }
}

// game/ui.js -> В САМЫЙ НИЗ

// --- МЯГКИЙ ВЫХОД В ГЛАВНОЕ МЕНЮ ---
// game/ui.js -> exitToMenu

window.exitToMenu = function(skipUI = false) {
    // --- ПЕРЕХВАТ PVP: СДАЧА (SURRENDER) ---
    // Если бой идет (есть ID) и мы не на экране Game Over -> это сдача
    if (window.RTDB && window.RTDB.currentBattleId && gameState !== 'GAMEOVER') {
        if (window.PvpUI && window.PvpUI.surrender) {
            window.PvpUI.surrender(); 
            return;
        }
    }

    // --- ОПРЕДЕЛЯЕМ, ОТКУДА МЫ ВЫШЛИ ---
    // Проверяем флаг битвы ДО очистки переменных
    let wasPvP = (window.RTDB && window.RTDB.currentBattleId);
    
    // Доп. проверка: если мы в режиме наблюдения или Game Over экрана PvP
    const pvpRes = document.getElementById('pvp-results-screen');
    const pvpWait = document.getElementById('pvp-wait-screen');
    if ((pvpRes && pvpRes.style.display !== 'none') || 
        (pvpWait && pvpWait.style.display !== 'none')) {
        wasPvP = true;
    }

    gameState = 'MENU';
    
    // 1. Скрываем ВСЕ игровые экраны и оверлеи
    const idsToHide = [
        'pause-menu', 'gameover-screen', 'ui-layer', 'pvp-spy-window', 
        'pvp-results-screen', 'boss-warning', 'pvp-wait-screen',
        'hit-flash-overlay', 'heal-flash-overlay', 'freeze-overlay', 
        'soul-upgrade-overlay', 'boss-transition-overlay', 'mobile-controls',
        'upgrade-screen', 'cheat-menu'
    ];
    
    idsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
            el.classList.remove('active', 'show');
        }
    });

    // 2. Сброс аудио
    const am = document.getElementById('audio-menu');
    const ag = document.getElementById('audio-game');
    if(ag) { ag.pause(); ag.currentTime = 0; }
    if(am && am.paused) am.play().catch(()=>{});

    // 3. Очистка объектов игры
    enemies = []; projectiles = []; drops = []; chests = []; 
    damageNumbers = []; visualEffects = []; firePools = [];
    banishedList = []; 
    
    // 4. Сброс PVP данных
    if (window.PvpUI) {
        window.PvpUI.targetWinTime = null;
        window.PvpUI.gameStartedLocal = false; 
        if (window.RTDB.currentBattleId) {
            window.RTDB.cancelDisconnectHook(window.RTDB.currentBattleId);
            window.RTDB.unsubscribe(`battles/${window.RTDB.currentBattleId}`);
        }
        window.RTDB.currentBattleId = null;
    }
    
    // 5. НАВИГАЦИЯ (КУДА ВОЗВРАЩАЕМСЯ)
    const startScreen = document.getElementById('start-screen');
    const charSelect = document.getElementById('char-select-screen');
    const pvpHub = document.getElementById('pvp-ranked-hub');

    // Скрываем все меню перед выбором нужного
    if(startScreen) startScreen.style.display = 'none';
    if(charSelect) charSelect.style.display = 'none';
    if(pvpHub) pvpHub.style.display = 'none';

    if (skipUI) {
        // Если принудительный пропуск (например, дисконнект), идем в главное меню
        if(startScreen) startScreen.style.display = 'flex';
        if(window.updateMainMenuUI) window.updateMainMenuUI();
    } 
    else if (wasPvP) {
        // БЫЛО PVP -> Идем в Хаб Рейтинга
        if(pvpHub) {
            pvpHub.style.display = 'flex';
            gameState = 'RANKED_HUB';
        } else {
            if(startScreen) startScreen.style.display = 'flex';
        }
    } 
    else {
        // БЫЛО СОЛО -> Идем в Выбор Персонажа
        if(startScreen) {
            startScreen.style.display = 'flex';
            // Обновляем UI (показать кнопку Play, профиль и т.д.)
            if(window.updateMainMenuUI) window.updateMainMenuUI(); 
        }
    }
}


// game/ui.js -> В КОНЕЦ

// --- CUSTOM MODAL & NOTIFICATIONS ---

window.showCustomModal = function(title, text, onYesCallback) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerText = text;
    
    const btnYes = document.getElementById('modal-yes');
    // Клонируем кнопку, чтобы убрать старые слушатели (чистый метод)
    const newBtn = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtn, btnYes);
    
    newBtn.onclick = () => {
        if(onYesCallback) onYesCallback();
        modal.style.display = 'none';
    };
    
    modal.style.display = 'flex';
}

window.showNotification = function(text, color = '#2ecc71') {
    const el = document.getElementById('game-notification');
    el.innerText = text;
    el.style.backgroundColor = (color === 'red') ? 'rgba(192, 57, 43, 0.95)' : 'rgba(46, 204, 113, 0.95)';
    el.style.borderColor = (color === 'red') ? '#c0392b' : '#27ae60';
    
    el.classList.add('show');
    // Сброс анимации, если вызывают часто
    clearTimeout(window.notifTimer);
    window.notifTimer = setTimeout(() => {
        el.classList.remove('show');
    }, 3000);
}

// game/ui.js -> Замени функцию updateFriendBadge

window.updateFriendBadge = function(count) {
    // Ищем оба бейджа: в меню и в шапке
    const badges = [
        document.getElementById('friends-badge'),       // Внутри выпадающего меню
        document.getElementById('header-friends-badge') // Снаружи, возле ника
    ];

    badges.forEach(badge => {
        if (badge) {
            if (count > 0) {
                badge.innerText = count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    });
}

// game/ui.js -> ВСТАВИТЬ В САМЫЙ КОНЕЦ ФАЙЛА

document.addEventListener('DOMContentLoaded', () => {

// 1. КНОПКА ВЫХОДА В ЛОББИ (ПИКИ/БАНЫ)
    const btnLobbyLeave = document.getElementById('btn-lobby-leave'); 
    if (btnLobbyLeave) {
        btnLobbyLeave.onclick = () => {
            // Используем твое существующее окно через функцию-обертку
            window.showCustomModal(
                "LEAVE LOBBY?", 
                "You will lose ranking points (-25 Elo).", 
                () => {
                    // Если нажали YES
                    if (window.PvpUI && window.PvpUI.leaveLobby) {
                        window.PvpUI.leaveLobby(false); 
                    }
                }
            );
        };
    }

    // 2. КНОПКА ВЫХОДА В МЕНЮ ПАУЗЫ (В ИГРЕ)
    const btnPauseLeave = document.getElementById('btn-leave-match');
    if (btnPauseLeave) {
        btnPauseLeave.onclick = () => {
            // Скрываем меню паузы
            const pauseMenu = document.getElementById('pause-menu');
            if(pauseMenu) pauseMenu.style.display = 'none';

            // Если это PvP игра — СРАЗУ СДАЕМСЯ (без вопросов)
            if (window.gameState === 'GAME' && window.battleId) {
                window.isPaused = false; 
                if (window.PvpUI && window.PvpUI.surrender) {
                    window.PvpUI.surrender(); 
                }
            } 
            else {
                // Если это СОЛО — СРАЗУ ВЫХОДИМ (как ты просил)
                window.exitToMenu();
            }
        };
    }

    // --- 3. ОБРАБОТЧИК КНОПКИ "YES" В МОДАЛКЕ ---
    const confirmYes = document.getElementById('btn-confirm-yes');
    if (confirmYes) {
        confirmYes.onclick = () => {
            document.getElementById('modal-confirm-exit').style.display = 'none';

            // Если мы нажали YES, находясь в ЛОББИ
            if (window.gameState === 'LOBBY') {
                if (window.PvpUI && window.PvpUI.leaveLobby) {
                    window.PvpUI.leaveLobby(false); // false = НЕ тихо (снимаем рейтинг)
                }
            } 
            // Для одиночной игры
            else {
                window.exitToMenu();
            }
        };
    }

    // --- 4. КНОПКА "NO" (ОСТАЕМСЯ) ---
    const confirmNo = document.getElementById('btn-confirm-no');
    if (confirmNo) {
        confirmNo.onclick = () => {
            document.getElementById('modal-confirm-exit').style.display = 'none';
            // Если были в паузе одиночной игры, можно вернуть меню паузы
            if (window.gameState === 'GAME' && !window.battleId) {
                document.getElementById('pause-menu').style.display = 'flex';
            }
        };
    }

});

// --- ВСТАВИТЬ В КОНЕЦ game/ui.js ---

// Защита: создаем объект UI, если его почему-то нет

// --- ИСТОРИЯ МАТЧЕЙ UI ---
window.UI.openMatchHistory = function() {
    const screen = document.getElementById('history-screen');
    const listDiv = document.getElementById('history-list-container');
    const detDiv = document.getElementById('history-details-container');
    
    if(!screen) {
        console.error("History screen not found in HTML!");
        return;
    }

    screen.style.display = 'flex';
    listDiv.style.display = 'block';
    detDiv.style.display = 'none';
    
    // Безопасное получение данных
    const data = (window.Cloud && window.Cloud.playerData) ? window.Cloud.playerData : {};
    const history = data.matchHistory || [];
    
    if (history.length === 0) {
        listDiv.innerHTML = '<div style="text-align:center; color:#555; margin-top:50px;">No battles recorded yet.</div>';
        return;
    }

    let html = '';
    history.forEach((m, idx) => {
        let colorClass = 'history-loss';
        let resText = 'DEFEAT';
        let valColor = '#e74c3c';
        
        if (m.result === 'win') { colorClass = 'history-win'; resText = 'VICTORY'; valColor = '#2ecc71'; }
        if (m.result === 'abandon') { colorClass = 'history-abandon'; resText = 'ABANDON'; valColor = '#95a5a6'; }

        let dateStr = 'Unknown Date';
        if (m.timestamp) {
            let d = new Date(m.timestamp);
            dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        let eloTxt = m.eloChange > 0 ? `+${m.eloChange}` : `${m.eloChange}`;

        html += `
        <div class="history-row ${colorClass}" onclick="window.UI.showMatchDetails(${idx})">
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="sprites/other/${m.myChar}_s.png" style="width:40px; height:40px; border-radius:4px; background:#000;" onerror="this.src='sprites/other/knight_s.png'">
                <div>
                    <div class="hist-res" style="color:${valColor}">${resText}</div>
                    <div class="hist-date">${dateStr}</div>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="color:#ddd; font-weight:bold;">vs ${m.opponentNick || "Unknown"}</div>
                <div style="color:${valColor}; font-weight:bold;">${eloTxt} MMR</div>
            </div>
        </div>`;
    });
    listDiv.innerHTML = html;
};

// game/ui.js -> Замени window.UI.showMatchDetails

window.UI.showMatchDetails = function(idx) {
    // Безопасная проверка данных
    if (!window.Cloud.playerData || !window.Cloud.playerData.matchHistory) return;
    const m = window.Cloud.playerData.matchHistory[idx];
    if (!m) return;

    document.getElementById('history-list-container').style.display = 'none';
    document.getElementById('history-details-container').style.display = 'block';
    const content = document.getElementById('history-details-content');
    
    // --- ХЕЛПЕР: ПОЛУЧЕНИЕ ПОЛНОГО ПУТИ К КАРТИНКЕ ---
    const getSpritePath = (itemData) => {
        let imgName = itemData.img;
        let id = itemData.id;

        // Если ID нет, пытаемся угадать из картинки
        if (!id && imgName) {
            id = imgName.split('.')[0].replace(/\d+$/, ''); 
        }

        // 1. Сначала проверяем базу данных (самый надежный способ)
        if (typeof DB !== 'undefined') {
            if (DB.weapons[id]) return `sprites/weapons/${DB.weapons[id].img}`;
            if (DB.items[id]) return `sprites/items/${DB.items[id].img}`;
            
            // Магазин
            let shopItem = DB.shopItems.find(s => s.id === id);
            if (shopItem) return `sprites/merchant/${shopItem.img}`;
        }
        
        // 2. Фолбеки по типу (если база недоступна или ID кривой)
        if (itemData.type === 'weapon') return `sprites/weapons/${imgName}`;
        if (itemData.type === 'merchant') return `sprites/merchant/${imgName}`;
        
        // 3. Фолбек по умолчанию
        return `sprites/items/${imgName}`;
    };

const renderItems = (items) => {
        if (!items || items.length === 0) return '<div style="color:#555; font-size:12px; width:100%; text-align:center;">Empty</div>';
        
        return items.map(i => {
            // Определяем ID для получения описания
            let id = i.id;
            if (!id && i.img) id = i.img.split('.')[0].replace(/\d+$/, '');

            let fullPath = getSpritePath(i);
            let lvlDisplay = i.lvl > 1 ? `<div class="hist-item-lvl">${i.lvl}</div>` : '';
            
            // Формируем тултип
            let name = (typeof tDB !== 'undefined' ? tDB(id, 'name') : id) || id;
            let desc = window.getItemDynamicDesc ? window.getItemDynamicDesc(id, i.lvl) : "";
            let tooltipHtml = `<span class="tooltip"><b>${name}</b> (Lvl ${i.lvl})<br>${desc}</span>`;

            let isMerch = fullPath.includes('merchant');
            let style = isMerch ? 'border-color: #f1c40f;' : '';
            let errFix = "this.onerror=null; if(this.src.includes('weapons')) this.src=this.src.replace('weapons','items'); else this.src='sprites/other/logo_s.png';";

            return `
            <div class="hist-item-box" style="${style}">
                <img src="${fullPath}" class="hist-item-img" onerror="${errFix}">
                ${lvlDisplay}
                ${tooltipHtml}
            </div>`;
        }).join('');
    };

    // --- СТАТИСТИКА ---
    let ps = m.stats || {}; 
    let es = m.opponentStats || {};

    const fmt = (v) => ((v || 0) * 100).toFixed(1) + '%';
    const fmtX = (v) => 'x' + (v || 1.0).toFixed(3);
    const fmtI = (v) => Math.floor(v || 0);

    const row = (label, v1, v2) => `
        <div class="res-stat-row">
            <div class="res-val">${v1}</div>
            <div class="res-label">${label}</div>
            <div class="res-val">${v2}</div>
        </div>`;

    // Применяем КАП 30% (0.3)
    const pCrit = Math.min(ps.critChance || 0, 0.3);
    const eCrit = Math.min(es.critChance || 0, 0.3);
    const pEva = Math.min(ps.evasion || 0, 0.3);
    const eEva = Math.min(es.evasion || 0, 0.3);
    const pVamp = Math.min(ps.vampChance || 0, 0.3);
    const eVamp = Math.min(es.vampChance || 0, 0.3);

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px;">
            <div class="hist-col">
                <div style="color:#2ecc71; text-align:center; font-weight:bold; margin-bottom:5px;">YOU (${m.myChar})</div>
                <div class="hist-build-grid">${renderItems(m.myBuild)}</div>
            </div>
            
            <div style="font-weight:bold; color:#555; margin-top:50px;">VS</div>

            <div class="hist-col">
                <div style="color:#e74c3c; text-align:center; font-weight:bold; margin-bottom:5px;">${m.opponentNick || 'Enemy'} (${m.opponentChar || '?'})</div>
                <div class="hist-build-grid">${renderItems(m.opponentBuild)}</div>
            </div>
        </div>

        <h4 style="color:#f1c40f; margin:0 0 5px 0; text-align:center; font-size:12px;">BATTLE STATISTICS</h4>
        <div class="res-stats-box">
            ${row('KILLS', ps.kills || 0, es.kills || 0)}
            ${row('GOLD', fmtI(ps.gold), fmtI(es.gold))}
            ${row('LEVEL', ps.level || 1, es.lvl || 1)}
            
            <div class="res-sep"></div>
            
            ${row('MIGHT', fmt(ps.might), fmt(es.might))}
            ${row('AREA', fmt(ps.area), fmt(es.area))}
            ${row('SPEED', fmt(ps.moveSpeed), fmt(es.moveSpeed))}
            ${row('FIRE RATE', fmt(ps.cooldown), fmt(es.cooldown))}
            ${row('PROJ. SPD', fmt(ps.projSpeed), fmt(es.projSpeed))}
            ${row('DURATION', fmt(ps.duration), fmt(es.duration))}
            ${row('AMOUNT', '+' + fmtI(ps.amount), '+' + fmtI(es.amount))}
            
            <div class="res-sep"></div>

            ${row('LUCK', fmtI(ps.luck), fmtI(es.luck))}
            ${row('GROWTH', '+' + fmtI(ps.growth), '+' + fmtI(es.growth))}
            ${row('GREED', '+' + fmtI(ps.greed), '+' + fmtI(es.greed))}
            ${row('CURSE', fmt(ps.curse), fmt(es.curse))}
            
            <div class="res-sep"></div>
            
            ${row('CRIT %', fmt(pCrit), fmt(eCrit))}
            ${row('CRIT DMG', fmtX(ps.critDamage), fmtX(es.critDamage))}
            ${row('EVASION%', fmt(pEva), fmt(eEva))}
            
            ${row('VAMP %', fmt(pVamp), fmt(eVamp))}
            ${row('VAMP PWR', '+' + fmtI(ps.vampPower), '+' + fmtI(es.vampPower))}
        </div>
        
        <div style="text-align:center; margin-top:10px; color:#aaa; font-size:12px;">
            Total Damage Dealt: <span style="color:#fff">${fmtI(ps.damage)}</span>
        </div>
    `;
};

// game/main.js -> window.getLastSyncBuild

window.getLastSyncBuild = function() {
    let build = [];
    if (!window.player) return build;
    
    // 1. Оружие
    if (player.weapons) {
        player.weapons.forEach(w => {
            build.push({ 
                id: w.id,      // ВАЖНО: сохраняем ID (sword, spear, holywater)
                img: w.img, 
                lvl: w.level, 
                type: 'weapon' 
            });
        });
    }

    // 2. Предметы
    if (player.items) {
        for(let k in player.items) { 
            if (window.DB && DB.items[k]) {
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
            let mItem = window.DB && window.DB.shopItems.find(i => i.id === mid);
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

    console.log("Saving Build:", build); // Для отладки в консоли
    return build;
};

window.UI.backToHistoryList = function() {
    document.getElementById('history-list-container').style.display = 'block';
    document.getElementById('history-details-container').style.display = 'none';
};
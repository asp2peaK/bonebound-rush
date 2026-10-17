// game/logic.js

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И СОСТОЯНИЕ ---
let gameState = 'MENU';
let gameTime = 0;         
let stageStartTime = 0;   
let stageTime = 600;      
let currentStage = 1;     
let kills = 0;
let currentChestCost = 20; 
let monumentReq = 5; 
let camera = { x: 0, y: 0 };

// Бан предметов
let banishCount = 3; 
let banishedList = [];

// Рероллы
let rerollsLeft = 3;      
let statRerollsLeft = 3;  

// Читы и Настройки
let isGodMode = false;
let timeScale = 1; 

// Таймеры предметов
let stopwatchTimer = 90; 
let isTimeFrozen = false;
let freezeTimer = 0;
let soulStoneStage = 0;
let soulStoneStartKills = null; 

// Бесконечный режим
let isEndlessMode = false;
let endlessStartTime = 0; 

// Массивы объектов
let visualEffects = []; 
let enemyGroundEffects = []; 
let enemies = [];
let enemyProjectiles = []; 
let drops = [];
let chests = [];
let anvils = [];
let projectiles = [];
let damageNumbers = [];
let firePools = [];
let monuments = [];
let portals = [];
let traders = [];

// Отложенные действия: тикают вместе с игровым временем (на паузе стоят, при рестарте очищаются)
let pendingActions = [];
function scheduleAction(delayMs, fn) {
    pendingActions.push({ t: delayMs, fn: fn });
}
function updatePendingActions(dtMs) {
    if (pendingActions.length === 0) return;
    const due = [];
    pendingActions = pendingActions.filter(a => {
        a.t -= dtMs;
        if (a.t <= 0) { due.push(a); return false; }
        return true;
    });
    due.forEach(a => a.fn());
}

// Прирост урона оружия за уровень: 1/6 базового урона (к 10-му уровню у всех оружий ×2.5)
function weaponLevelDamageGain(w) {
    const base = (DB.weapons[w.id] && DB.weapons[w.id].damage) || w.damage;
    return base / 6;
}

// Таймеры «когда я последний раз бил этого врага» (ключ = сам объект врага, поэтому Map, а не {})
function tickHitTimers(map, dtScale) {
    for (const [enemy, left] of map) {
        if (left > dtScale) map.set(enemy, left - dtScale);
        else map.delete(enemy);
    }
}

// Флаги спавна
let bossesSpawned = {
    mini1: false, 
    mini2: false, 
    boss: false,
    bossDead: false,
    waitingForBoss: false,
    waitTimer: 0,
    anvil: false
};
let merchantSpawned = false;
let bossPhase = 1; 

// Карта и Игрок
const worldMap = [];
const player = {
    x: WORLD_SIZE/2, y: WORLD_SIZE/2, type: 'knight',
    width: 20, height: 50,
    maxHp: 100, hp: 100, direction: 'down',
    level: 1, exp: 0, nextLevelExp: 50, gold: 0,
    healFlashTimer: 0, stunTimer: 0, fragileTimer: 0,
    nearPortal: false, nearAnvil: false, nearMerchant: false,
    weapons: [], items: {}, maxItems: 5, cursedItems: {},
    stats: { 
        might: 1, cooldown: 0, moveSpeed: 1, projSpeed: 1, 
        area: 0, magnet: 50, luck: 0, amount: 0, curse: 0, 
        vampChance: 0, vampPower: 0, growth: 0, greed: 0, 
        duration: 1.0, size: 1.0, critChance: 0, evasion: 0,
        critDamage: 1.0,
    }
};

// --- ГЕНЕРАЦИЯ КАРТЫ ---
function generateMap(stage) {
    let groundTile = 'ground';
    let decorTile = 'grass';
    let wallTile = 'mountains';

    if (stage === 2) { groundTile = 'sand'; decorTile = 'cobblegrass'; }
    else if (stage === 3) { groundTile = 'volcanocobl'; decorTile = 'lava'; }
    else if (stage === 4) { groundTile = 'crystground4'; decorTile = 'crystsurface4'; }
    else if (stage === 5) { groundTile = 'obsground5'; decorTile = 'abysslight5'; }

    for(let y=0; y<MAP_TILES; y++) {
        worldMap[y] = [];
        for(let x=0; x<MAP_TILES; x++) {
            if(x===0 || y===0 || x===MAP_TILES-1 || y===MAP_TILES-1) worldMap[y][x] = wallTile;
            else worldMap[y][x] = Math.random() > 0.3 ? groundTile : decorTile;
        }
    }

    // Пасхалка (Дружелюбная гора)
    let walls = [];
    for(let y=0; y<MAP_TILES; y++) {
        for(let x=0; x<MAP_TILES; x++) {
            if (worldMap[y][x] === wallTile) walls.push({x: x, y: y});
        }
    }
    if (walls.length > 0) {
        let r = walls[Math.floor(Math.random() * walls.length)];
        worldMap[r.y][r.x] = 'friend_mountain'; 
    }
}
generateMap(1); // Инициализация

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function getNearest(p, r) {
    let t=null, min=r; 
    enemies.forEach(e=>{
        let d=Math.hypot(p.x-e.x,p.y-e.y);
        if(d<min){min=d;t=e;}
    }); 
    return t;
}

// --- ЛОГИКА АКТИВАЦИИ ОБЪЕКТОВ ---

function activateMonument(m) {
    if(window.Cloud && window.Cloud.unlockCodexWorld) window.Cloud.unlockCodexWorld('monument');
    if (document.activeElement) document.activeElement.blur();
    m.active = false; monumentReq += 5;
    monuments.forEach(mon => { if(mon.active) mon.req = monumentReq; });
    scheduleAction(10000, () => spawnMonument());
    gameState = 'UPGRADE';
    
    // Передаем true третьим параметром -> значит "Это Монумент"
    if (Math.random() < 0.01) {
        generateCards('item_weapon', null, true); 
    } else {
        generateCards('stats', null, true);
    }
}

function levelUp() {
    if (document.activeElement) document.activeElement.blur();
    gameState = 'UPGRADE';
    player.level++; player.exp = 0; 
    player.nextLevelExp = Math.floor(player.nextLevelExp*1.2);
    player.hp += 10;
    if(player.hp > player.maxHp) player.hp = player.maxHp;
    generateCards('stats');
}

function nextStage(stageNum) {
    currentStage = stageNum;
    stageTime = 600; 
    stageStartTime = gameTime; 
    
    // Сброс
    bossesSpawned = { mini1: false, mini2: false, boss: false, bossDead: false, waitingForBoss: false, waitTimer: 0, anvil: false };
    isEndlessMode = false;
    if (statRerollsLeft < 3) statRerollsLeft++;
    
    enemies = []; enemyProjectiles = []; enemyGroundEffects = []; 
    drops = []; chests = []; portals = []; anvils = []; traders = [];
    merchantSpawned = false;
    
    if(window.generateMap) window.generateMap(stageNum);
    
    const ann = document.getElementById('stage-announcement');
    if (ann) {
        let name = "STAGE " + stageNum;
        if(stageNum===2) name="DESERT";
        if(stageNum===3) name="VOLCANO";
        if(stageNum===4) name="CRYSTAL CAVES";
        if(stageNum===5) name="THE VOID";
        ann.innerText = name;
        ann.classList.add('show');
        setTimeout(() => ann.classList.remove('show'), 3000);
    }

    player.x = WORLD_SIZE/2;
    player.y = WORLD_SIZE/2;
}

// --- УПРАВЛЕНИЕ ПРЕДМЕТАМИ И ОРУЖИЕМ ---
function addWeapon(id) {
    let limit = player.maxWeapons || MAX_WEAPONS;
    if (player.weapons.length >= limit) return;
    
    let info = DB.weapons[id];
    player.weapons.push({ id: id, ...info, timer: 0, level: 1 });
    if(window.Cloud && window.Cloud.unlockCodexItem) window.Cloud.unlockCodexItem(id);
    if(window.updateInventoryUI) window.updateInventoryUI();
}

function applyItemPassive(k) {
    if(k==='spinach') player.stats.might += 0.025;
    if(k==='candle') player.stats.area += 0.025; 
    if(k==='gloves') player.stats.cooldown += 0.05;
    if(k==='ring') player.stats.amount += 1;
    if(k==='clover') player.stats.luck += 2;
    if(k==='boots') player.stats.moveSpeed += 0.025; 
    if(k==='wings') { 
        player.stats.moveSpeed += 0.10; 
        addCappedStat(player.stats, 'evasion', 0.025);
    }
    if(k==='magnet') player.stats.magnet += 70; 
    if(k==='crown') player.stats.growth += 3; 
    if(k==='hollow_heart') { player.maxHp += 10; player.hp += 10; } 
    if(k==='bracer') { player.stats.duration += 0.05; player.stats.projSpeed += 0.05; }
    if(k==='skull_ring') { addCappedStat(player.stats, 'critChance', 0.05); player.stats.curse += 0.10; }
    if(k==='soul_stone') {
        player.stats.might += 0.20;
        // Сообщаем Кодексу, что открыт 1-й уровень камня
        if(window.Cloud && window.Cloud.unlockCodexItem) {
            window.Cloud.unlockCodexItem('soul_stone', 1);
        }
    }
    if(k==='mask') { 
        addCappedStat(player.stats, 'vampChance', 0.10);
        player.stats.vampPower += 10; 
    }
// --- НОВЫЕ ПРЕДМЕТЫ С КАПАМИ ---
    
// Whetstone (Crit Chance). КАП 30%
    if (k === 'whetstone') { 
        addCappedStat(player.stats, 'critChance', 0.01);
    }

    // Mist Cloak (Evasion). КАП 30%
    if (k === 'mist_cloak') {
        addCappedStat(player.stats, 'evasion', 0.01);
    }
    
    // Scope (Crit Damage)
    if (k === 'scope') { player.stats.critDamage += 0.025; }
    
    // Empty Bottle (Vamp Power)
    if (k === 'empty_bottle') { player.stats.vampPower += 1; }
    
    // Coffee
    if (k === 'coffee') { 
        player.stats.moveSpeed += 0.015; 
        player.stats.cooldown += 0.01; 
    }
    
    // Heavy Stone
    if (k === 'heavy_stone') { 
        player.stats.might += 0.04; 
        player.stats.moveSpeed -= 0.015; 
    }
    
    // Coin Purse
    if (k === 'coin_purse') { player.stats.greed += 4; } // У тебя стоит 4, в базе было 10. Оставил 4 как ты скинул.
    
    // Light Feather
    if (k === 'light_feather') { player.stats.moveSpeed += 0.025; }

// --- RARE ITEMS (Passive Effects) ---

    // 1. Spiked Pauldrons (Только Шипы +5%)
    if (k === 'spiked_pauldrons') player.stats.thorns += 0.05;
    
    // 2. Ninja Headband (Rate +3% / Crit +2%) -> КАП 30%
    if (k === 'ninja_headband') {
        player.stats.cooldown += 0.03;
        addCappedStat(player.stats, 'critChance', 0.02);
    }
    
    // 3. Magnet Boots (Speed +2.5% / Magnet +20)
    if (k === 'magnet_boots') {
        player.stats.moveSpeed += 0.025;
        player.stats.magnet += 20;
    }
    
    // 4. Ruby Ring (Might +2.5% / Area +2.5%)
    if (k === 'ruby_ring') {
        player.stats.might += 0.025;
        player.stats.area += 0.025;
    }
    
    // 5. Sapphire Amulet (Rate +2.5% / Proj Speed +2.5%)
    if (k === 'sapphire_amulet') {
        player.stats.cooldown += 0.025;
        player.stats.projSpeed += 0.025;
    }
    
    // 6. Sniper Lens (Proj Speed +3.5% / Crit +1.5%) -> КАП 30%
    if (k === 'sniper_lens') {
        player.stats.projSpeed += 0.035;
        addCappedStat(player.stats, 'critChance', 0.015);
    }
    
    // 7. Explosive Powder (Area +5%)
    if (k === 'explosive_powder') player.stats.area += 0.05;


    // --- EPIC ITEMS ---
    
    // 1. Berserker Blood (Динамический, тут ничего не даем)
    
    // 2. Golden Idol (Динамический, тут ничего не даем)
    
    // 3. Glass Cannon (+12.5% Might, -2.5% HP)
    if (k === 'glass_cannon') {
        player.stats.might += 0.125;
        // Снижаем MaxHP
        let reduce = Math.floor(player.maxHp * 0.025);
        if (reduce < 1) reduce = 1;
        player.maxHp -= reduce;
        player.hp = Math.min(player.hp, player.maxHp);
    }
    
    // 4. Adrenaline Shot (+5% Speed пассивно)
    if (k === 'adrenaline_shot') {
        player.stats.moveSpeed += 0.05;
    }
    
    // 5. Mana Crystal (+5% Rate, +5% Duration)
    if (k === 'mana_crystal') {
        player.stats.cooldown += 0.05;
        player.stats.duration += 0.05;
    }

    // --- LEGENDARY (Max Lvl 1) ---
    if (k === 'pandora_box') {
        // Percent stats (+10%)
        player.stats.might += 0.1;
        player.stats.moveSpeed += 0.1;
        player.stats.projSpeed += 0.1;
        player.stats.cooldown += 0.1;
        player.stats.area += 0.1;
        player.stats.duration += 0.1;
        player.stats.critDamage += 0.2;
        
        // Flat stats
        player.stats.amount += 1;
        player.stats.luck += 20;
        player.stats.greed += 20;
        player.stats.growth += 20;
        player.stats.vampPower += 5;

        // Capped stats (Max 30%)
        addCappedStat(player.stats, 'critChance', 0.1);
        addCappedStat(player.stats, 'evasion', 0.1);
        addCappedStat(player.stats, 'vampChance', 0.1);
    }
}

function applyCurse(id) {
    const curseData = DB.curses[id];
    if (!curseData) return;
    
    // 1. ПРОКЛЯТИЕ ОРУЖИЯ
    if (!curseData.type || curseData.type !== 'passive') {
        let w = player.weapons.find(x => x.id === id);
        if (w) {
            w.isCursed = true; // Флаг заморозит прокачку в ui.js
            
            // Применяем модификаторы ОДИН РАЗ
            if (curseData.dmgMult) w.damage *= curseData.dmgMult;
            if (curseData.cooldownMult) w.cooldown *= curseData.cooldownMult;
            
            // Глобальные бонусы от оружия (редкость)
            if (curseData.amountFlat) player.stats.amount += curseData.amountFlat;
            
            // Механики
            if (curseData.spread) w.spread = true;
            if (curseData.areaMult) w.area = (w.area || 100) * curseData.areaMult;
            if (curseData.projSpeedMult) w.projSpeedMult = curseData.projSpeedMult;
            if (curseData.critFixed) w.critChanceFixed = curseData.critFixed;
            if (curseData.amountFixed) w.amountFixed = curseData.amountFixed;
            if (curseData.pierce) w.pierce = true;
            if (curseData.vampire) w.vampire = true;
            if (curseData.durationInfinite) w.durationInfinite = true;
            if (curseData.speedMult) w.speed *= curseData.speedMult;
            if (curseData.rangeMult) w.rangeMult = curseData.rangeMult;
            if (curseData.widthMult) w.widthMult = curseData.widthMult;
            if (curseData.selfDamage) w.selfDamage = true;
            if (curseData.stationary) w.stationary = true;
            if (curseData.noReturn) w.noReturn = true;
        }
    } 
    // 2. ПРОКЛЯТИЕ ПРЕДМЕТА (ПАССИВКИ)
    else {
        player.cursedItems[id] = true; // Флаг заморозит прокачку в ui.js
        
        let s = curseData.stats;
        if (s) {
            // Просто плюсуем статы к текущим. 
            // Уровень предмета не меняется, но больше не растет.
            
            // 1. Обработка MaxHP (специфичная логика, оставляем отдельно)
            if (s.maxHpMult) { 
                let add = player.maxHp * s.maxHpMult; 
                player.maxHp += add; 
                if (add > 0) player.hp += add; 
                else player.hp = Math.min(player.hp, player.maxHp);
            }
            
            // 2. АВТОМАТИЧЕСКОЕ ДОБАВЛЕНИЕ ВСЕХ ОСТАЛЬНЫХ СТАТОВ
            // (Вместо того чтобы писать 20 раз if (s.might)...)
            for (let key in s) {
                // Пропускаем maxHpMult, так как сделали его выше
                if (key === 'maxHpMult') continue;

                // Если такой стат есть у игрока (greed, amount, armor, might...) — плюсуем
                if (player.stats.hasOwnProperty(key)) {
                    player.stats[key] += s[key];
                }
            }
        }
    }
}

function applyShopEffect(item) {
    // 1. Эффекты (Лечение, Реролл, Левел-ап)
    if (item.effect === 'heal_full_maxhp_10') {
        player.stats.maxHp = (player.stats.maxHp || 0) + 10; 
        player.maxHp += 10; player.hp = player.maxHp; 
        damageNumbers.push({x:player.x, y:player.y-50, val: "MAX HP UP!", color:'#2ecc71', life:120});
    }
    else if (item.effect === 'add_reroll') {
        rerollsLeft += 1; 
        damageNumbers.push({x:player.x, y:player.y-50, val: "+1 REROLL!", color:'#3498db', life:120});
    }
    else if (item.effect === 'random_level_up') {
        let candidates = [];
        // Проклятые предметы «заморожены» и не прокачиваются; потолки уровней те же, что у карточек
        player.weapons.forEach(w => { if (!w.isCursed && w.level < 10) candidates.push(w); });
        for (let id in player.items) {
            if (player.cursedItems && player.cursedItems[id]) continue;
            let lvl = player.items[id];
            let itemDb = DB.items[id] || {};
            let max = itemDb.maxLevel || ({ common: 10, rare: 7, epic: 5, legendary: 3 }[itemDb.rarity || 'common']);
            if (lvl < max) candidates.push({type:'passive', id: id});
        }
        if (candidates.length > 0) {
            let choice = candidates[Math.floor(Math.random() * candidates.length)];
            if (choice.type === 'passive') {
                player.items[choice.id]++;
                applyItemPassive(choice.id); // раньше уровень рос, а бонус предмета не выдавался
                damageNumbers.push({x:player.x, y:player.y-50, val: "LEVEL UP!", color:'#9b59b6', life:120});
            } else {
                choice.level++;
                choice.damage += weaponLevelDamageGain(choice);
                damageNumbers.push({x:player.x, y:player.y-50, val: "WEAPON UP!", color:'#f1c40f', life:120});
            }
            if(window.updateInventoryUI) window.updateInventoryUI();
        } else {
            player.gold += 1000; damageNumbers.push({x:player.x, y:player.y-50, val: "MAXED!", color:'#fff', life:120});
        }
    }
    
// 2. Статы (Сила, ХП, Удача и т.д.)
    if (item.type === 'stat' && item.stats) {
        for (let key in item.stats) {
            if (key === 'maxHp') { 
                player.maxHp += item.stats[key]; 
                player.hp += item.stats[key]; 
            } else { 
                // Потолки (крит/уклонение/вампиризм) берутся из STAT_CAPS
                addCappedStat(player.stats, key, item.stats[key]);
            }
        }
        damageNumbers.push({x:player.x, y:player.y-50, val: "UPGRADE!", color:'#f1c40f', life:120});
    }

    // 3. Сохранение в "Сумку" (ВОТ ЭТО МЫ ДОБАВИЛИ)
    if (!player.merchantItems) player.merchantItems = [];
    player.merchantItems.push(item.id);

    if (window.Cloud && window.Cloud.unlockCodexItem) {
        window.Cloud.unlockCodexItem(item.id);
    }
}

// --- БОЕВАЯ СИСТЕМА (СТРЕЛЬБА) ---
function fireWeapon(w) {
    let might = player.stats.might; 
    let area = player.stats.area; 
    let amount = player.stats.amount; 
    let duration = player.stats.duration; 
    let size = player.stats.size;         
    let projSpeed = player.stats.projSpeed; 

    if (w.amountFixed) amount = w.amountFixed - 1;
    if (w.projSpeedMult) projSpeed *= w.projSpeedMult;
    if (w.durationInfinite) duration = 999;
    
    // Размер = (базовый множитель героя + Area игрока) × собственный размер оружия (если он задан)
    let finalScale = (size + area) * (w.area ? w.area / 100 : 1);

    const DRAW_MULT = 0.65; 
    const OFFSET = 20;
    
    // --- [EPIC] ДИНАМИЧЕСКИЕ БОНУСЫ ---
    
    // 1. Berserker Blood (Чем меньше ХП, тем больше урон)
    if (player.items['berserker_blood']) {
        let lvl = player.items['berserker_blood'];
        let missingHpPct = (1 - (player.hp / player.maxHp)) * 100;
        if (missingHpPct < 0) missingHpPct = 0;
        
        // Ур 1: 0.5% за 1% ХП. Ур 5: 1.0% за 1% ХП.
        let multiplier = 0.375 + (lvl * 0.125); 
        let bonusMight = (missingHpPct * multiplier) / 100;
        
        might += bonusMight;
    }

    // 2. Golden Idol (Урон от золота)
    if (player.items['golden_idol']) {
        let lvl = player.items['golden_idol'];
        // Ур 1: 200g. Ур 5: 100g. Шаг 25g.
        let goldStep = 225 - (lvl * 25); 
        
        // Если проклят - растет в 2 раза быстрее (шаг 50g)
        if (player.cursedItems['golden_idol']) goldStep = 50; 
        
        let bonusMight = Math.floor(player.gold / goldStep) * 0.01;
        might += bonusMight;
    }

    // [ВСТАВИТЬ СЮДА 1] --- РАСЧЕТ РАЗБРОСА ОТ КОФЕ ---
    let angleOffset = 0;
    if (player.cursedItems && player.cursedItems['coffee']) {
        // Разброс +/- 30 градусов (хаотичность)
        angleOffset = (Math.random() - 0.5) * 1.0; 
    }

// --- FIX: ОГНЕННАЯ АУРА (Считаем урон здесь) ---
if (player.items['fireaura'] && Math.random() < 0.05 * player.items['fireaura']) {
         // Исправили скобки: (База 10 + Уровень предмета) * Силу
         let auraDmg = (10 + player.items['fireaura']) * might; 
         
         firePools.push({
             x: player.x, y: player.y, 
             life: 300 * duration, 
             size: 20 * finalScale, 
             img: 'fireaura', 
             sourceId: 'fireaura',
             damage: auraDmg // <--- Мы записали сюда УЖЕ посчитанный урон (с уровнем и силой)
         });
    }

if (w.id === 'sword') {
        let baseSize = 70 * finalScale; // Длина удара
        let realReach = (baseSize * 0.35) + OFFSET;
        for(let i=0; i<=amount; i++) {
            scheduleAction(i * (w.isCursed ? 300 : 150), () => {
                let t = getNearest(player, realReach + 30);
                let angle = t ? Math.atan2(t.y - player.y, t.x - player.x) : (player.direction === 'left' ? Math.PI : 0);
                if (!t) angle = (player.direction === 'left' ? Math.PI : 0) + (i%2!==0 ? -0.4 : 0.4);
                angle += angleOffset; // проклятый Кофе: косая стрельба
                let tx = player.x + Math.cos(angle) * realReach;
                let ty = player.y + Math.sin(angle) * realReach;
                
                projectiles.push({ 
                    type:'slash', x:player.x, y:player.y, tx:tx, ty:ty, life:15, 
                    size: baseSize, damage: w.damage * might, hit:[], img: w.img, sourceId: w.id,
                    
                    // --- НАСТРОЙКИ ДЛЯ МЕЧА ---
                    hitWidth: 0.06,  // Толщина хитбокса (0.1 = тонкий, 0.5 = жирный)
                    drawScale: 0.4  // Размер картинки (0.5 = маленькая, 1.0 = большая)
                });
            });
        }
    }
    else if (w.id === 'wand') {
        let t = getNearest(player, 600);
        if (w.spread) t = { x: player.x + (Math.random()-0.5)*100, y: player.y + (Math.random()-0.5)*100 };
        if(t || w.spread){ 
            for(let i=0; i<=amount; i++) { 
                scheduleAction(i*100, () => {
                    let a=Math.atan2(t.y-player.y, t.x-player.x);
                    // [ВСТАВИТЬ СЮДА 2] --- ПРИМЕНЯЕМ РАЗБРОС ---
                    a += angleOffset; 
                    // -----------------------------------------
                    if (w.spread) a += (Math.random()-0.5) * 1.5; else a += (Math.random()-0.5)*0.2; 
                    projectiles.push({ type:'bullet', x:player.x, y:player.y, vx:Math.cos(a)*w.speed*projSpeed, vy:Math.sin(a)*w.speed*projSpeed, life:100 * duration, size: 6 * finalScale, damage:w.damage*might, sourceId: w.id });
                });
            }
        }
    }
    else if (w.id === 'knife') {
        let t = getNearest(player, 500);
        let baseA = t ? Math.atan2(t.y-player.y, t.x-player.x) : (keys['KeyA']?Math.PI:0);
        baseA += angleOffset; // <--- ДОБАВИЛИ СЮДА
        for(let i=0; i<=amount; i++) {
            let a = baseA + (i - amount/2) * 0.2; 
            projectiles.push({ type:'bullet', x:player.x, y:player.y, vx:Math.cos(a)*w.speed*projSpeed, vy:Math.sin(a)*w.speed*projSpeed, life:60 * duration, size: 8 * finalScale, damage:w.damage*might, img:'knife1.png', rotation: a, sourceId: w.id, pierce: w.pierce, critFixed: w.critChanceFixed });
        }
    }

    else if (w.id === 'axe') {
        let t = getNearest(player, 400 * duration); 
        let targetX = t ? t.x : player.x + (Math.random()-0.5)*200;
        let targetY = t ? t.y : player.y - 150;
        
        // 1.0 для обычного, 0.5 для проклятого
        let heaviness = w.projSpeedMult || 1.0; 

        for(let i=0; i<=amount; i++) {
            let spread = (i - amount/2) * 20;
            let throwSpeed = 6 * projSpeed;
            let angle = Math.atan2(targetY - player.y, targetX - player.x + spread) + angleOffset; // + косая стрельба Кофе
            
            projectiles.push({ 
                type: 'axe', 
                x: player.x, 
                y: player.y, 
                vx: Math.cos(angle) * throwSpeed, 
                
                // Прыжок в 2 раза ниже для проклятого
                vy: Math.sin(angle) * throwSpeed - (12 * heaviness), 
                
                // --- ГЛАВНОЕ ИЗМЕНЕНИЕ ---
                // Умножаем 60 на heaviness.
                // Обычный: 60 кадров.
                // Проклятый: 30 кадров (исчезнет очень быстро).
                life: 60 * duration * heaviness, 
                
                size: 18 * finalScale, 
                damage: w.damage * might, 
                img: w.img, 
                hitList: [], 
                sourceId: w.id 
            });
        }
    }
    else if (w.id === 'bible') {
        let totalBooks = 1 + amount;
        
        // ФИКС: Если книги бесконечные, не спавним лишние
        if (w.durationInfinite) {
            let active = projectiles.filter(p => p.sourceId === w.id).length;
            if (active >= totalBooks) return; // Уже крутится достаточно книг
            // Если кол-во изменилось (прокачали Amount), удаляем старые и создаем пачку заново
            if (active > 0 && active < totalBooks) projectiles = projectiles.filter(p => p.sourceId !== w.id);
        }

        let orbitRadius = 140 * (1 + area); 
        for(let i=0; i<totalBooks; i++) {
            projectiles.push({ 
                type: 'bible_book', owner: player, 
                angle: (i / totalBooks) * Math.PI * 2, 
                radius: orbitRadius, 
                speed: 0.05 * w.speed * projSpeed, 
                life: w.durationInfinite ? 999999 : (180 * duration), 
                size: 12 * finalScale, damage: w.damage * might, 
                img: w.img, hitTimers: new Map(), sourceId: w.id
            });
        }
    }
    else if (w.id === 'garlic') {
        let garlicBonus = (1 + amount * 0.3); 
        // Проклятие уже уменьшило w.area (areaMult 0.6), второй раз резать радиус не нужно
        let rad = (90 * finalScale);
        let garlicHits = 0;
        enemies.forEach(e => {
            if(Math.hypot(player.x-e.x, player.y-e.y) < rad + e.size) { dealDamage(e, w.damage * might * garlicBonus, w.id); garlicHits++; }
        });
        // Проклятие «Вампиризм»: +1 HP за каждый удар ауры, задевший хотя бы одного врага
        if (w.vampire && garlicHits > 0) {
            player.hp = Math.min(player.maxHp, player.hp + 1);
            damageNumbers.push({x:player.x, y:player.y-40, val: "+1", life:30, color:'#2ecc71'});
            if(window.updateUI) window.updateUI();
        }
    }
    // --- FIX: СВЯТАЯ ВОДА (Считаем урон здесь) ---
    else if (w.id === 'holywater') {
        for(let i=0; i<=amount; i++) {
            let rx = (Math.random()-0.5)*200; let ry = (Math.random()-0.5)*200;
            // Урон берется из оружия (w.damage), которое растет с уровнем
            let waterDmg = w.damage * might; 
            
            firePools.push({ 
                x: player.x+rx, y: player.y+ry, 
                life: 450 * duration, 
                size: 45 * finalScale, 
                img: 'holywaterground', 
                sourceId: w.id, 
                selfDamage: w.selfDamage,
                damage: waterDmg // <--- ЗАПИСАЛИ УРОН
            });
        }
    }
    else if (w.id === 'spear') {
        let baseSize = 100 * finalScale;
        if (w.rangeMult) baseSize *= w.rangeMult; 
        let realReach = (baseSize * 0.68) + OFFSET;
        for(let i=0; i<=amount; i++) {
            scheduleAction(i * 150, () => {
                let t = getNearest(player, realReach + 40);
                let angle = t ? Math.atan2(t.y - player.y, t.x - player.x) : (player.direction === 'left' ? Math.PI : 0);
                angle += angleOffset; // проклятый Кофе: косая стрельба
                
                projectiles.push({ 
                    type:'slash', x:player.x, y:player.y, tx:player.x + Math.cos(angle) * realReach, ty:player.y + Math.sin(angle) * realReach, life:12, 
                    size: baseSize, damage:w.damage*might, hit:[], img: w.img, sourceId: w.id, widthMult: w.widthMult,
                    
                    // --- НАСТРОЙКИ ДЛЯ КОПЬЯ ---
                    hitWidth: 0.1,  // Копье должно быть уже меча (острее)
                    drawScale: 0.8   // Картинка копья тоже может быть другой
                });
            });
        }
    }
    else if (w.id === 'cross') {
        let t = getNearest(player, 500);
        let baseAngle = (t ? Math.atan2(t.y-player.y, t.x-player.x) : 0) + angleOffset; // + косая стрельба Кофе
        if (w.stationary) {
             projectiles.push({ type: 'boomerang', x: player.x, y: player.y, vx: 0, vy: 0, returnSpeed: 0, state: 'stationary', life: 180, size: 25 * finalScale, damage: w.damage * might * 2, img: w.img, hitList: [], rotation: 0, sourceId: w.id });
        } else {
            for(let i=0; i<=amount; i++) {
                let angle = baseAngle + (i - amount/2) * 0.3;
                let spd = (w.speed || 16) * projSpeed;
                projectiles.push({ type: 'boomerang', x: player.x, y: player.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, returnSpeed: 12 * projSpeed, state: 'going', life: 200 * duration, size: 18 * finalScale, damage: w.damage * might, img: w.img, hitList: [], rotation: angle, sourceId: w.id });
            }
        }
    }
    // --- НОВЫЕ ОРУЖИЯ (ЭТАП 2) ---
    else if (w.id === 'frost_orb') {
        let activeShields = projectiles.filter(p => p.type === 'orbit_shield' && p.sourceId === w.id).length;
        
        // --- ПРОКЛЯТАЯ (ЩИТ) ---
        if (w.stationary) {
            if (activeShields > 0) return;

            let count = amount + 1;
            let orbitRad = 50 * finalScale; 

            for(let i=0; i<count; i++) {
                let angle = (i / count) * Math.PI * 2;
                projectiles.push({ 
                    type: 'orbit_shield', owner: player, angle: angle, 
                    radius: orbitRad, speed: 2, life: 600, 
                    
                    // РАЗМЕР ПРОКЛЯТОЙ = 12
                    size: 12 * finalScale, 
                    
                    damage: w.damage * might, 
                    img: 'frost_orb.png', sourceId: w.id, freeze: true, hitTimers: new Map()
                });
            }
        } 
        // --- ОБЫЧНАЯ (СТРЕЛЬБА) ---
        else {
            let t = getNearest(player, 500);
            let baseAngle = (t ? Math.atan2(t.y-player.y, t.x-player.x) : (Math.random()*Math.PI*2)) + angleOffset; // + косая стрельба Кофе
            for(let i=0; i<=amount; i++) {
                let a = baseAngle + (i - amount/2) * 0.3;
                projectiles.push({ 
                    type: 'bullet', x: player.x, y: player.y, 
                    vx: Math.cos(a)*w.speed*projSpeed, vy: Math.sin(a)*w.speed*projSpeed, 
                    life: (w.duration || 180) * duration, 
                    
                    // РАЗМЕР ОБЫЧНОЙ = 10
                    size: 10 * finalScale, 
                    
                    damage: w.damage * might, 
                    img: 'frost_orb.png', sourceId: w.id, pierce: 999, freeze: true
                });
            }
        }
    }
// --- FIREBALL ---
    else if (w.id === 'fire_scroll') {
        let t = getNearest(player, 600);
        let baseAngle = t ? Math.atan2(t.y-player.y, t.x-player.x) : (player.direction==='left'?Math.PI:0);
        baseAngle += angleOffset; // <--- ДОБАВИЛИ
        for(let i=0; i<=amount; i++) {
            let a = baseAngle + (i - amount/2) * 0.2;
            projectiles.push({
                type: 'fireball', x: player.x, y: player.y,
                vx: Math.cos(a)*w.speed*projSpeed, vy: Math.sin(a)*w.speed*projSpeed,
                life: 120 * duration, 
                size: 15 * finalScale, // <--- УМЕНЬШИЛ РАЗМЕР ШАРА (БЫЛО 15)
                damage: w.damage * might, 
                img: 'fireball.png', sourceId: w.id,
                rotation: a, napalm: DB.curses['fire_scroll'] && w.isCursed
            });
        }
    }
    else if (w.id === 'landmines') {
        for(let i=0; i<=amount; i++) {
            let rx = (Math.random()-0.5) * 50; 
            let ry = (Math.random()-0.5) * 50;
            projectiles.push({
                type: 'mine', x: player.x + rx, y: player.y + ry,
                vx: 0, vy: 0, 
                life: (w.duration || 600) * duration, 
                
                // 2) ОТДЕЛЬНЫЕ РАЗМЕРЫ МИНЫ
                size: 9 * finalScale, // <-- ХИТБОКС (Радиус, когда враг наступает)
                drawScale: 0.8,        // <-- РАЗМЕР СПРАЙТА (0.8 = 80% от размера хитбокса)
                
                damage: w.damage * might,
                img: 'mine.png', sourceId: w.id,
                cluster: DB.curses['landmines'] && w.isCursed
            });
        }
    }
// game/logic.js -> fireWeapon

else if (w.id === 'katana') {
        let reach = (w.area || 100) * (1 + area); 
        let speed = 10 * projSpeed;
        
        // --- ЗАЩИТА ОТ NaN (ПРЕВРАЩАЕМ В ЧИСЛА) ---
        let playerCrit = Number(player.stats.critChance) || 0; 
        let weaponCrit = Number(w.critChance) || 0; 
        let curseCrit = (w.isCursed && DB.curses.katana && DB.curses.katana.critBonus) ? Number(DB.curses.katana.critBonus) : 0;

        let totalCrit = playerCrit + weaponCrit + curseCrit;
        
        // Проверка урона
        let baseDmg = Number(w.damage);
        if (isNaN(baseDmg)) baseDmg = 10; // Если забыл прописать урон в базе
        // ------------------------------------------

        let t = getNearest(player, 250); 
        let ang = 0;
        if (t) ang = Math.atan2(t.y - player.y, t.x - player.x);
        else {
            let pDir = player.direction || 'right';
            if(pDir==='left') ang = Math.PI; else if(pDir==='up') ang = -Math.PI/2; else if(pDir==='down') ang = Math.PI/2;
        }
        ang += angleOffset; // проклятый Кофе: косая стрельба

        projectiles.push({
            type: 'slash_wave', x: player.x, y: player.y, 
            vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
            life: (reach / speed), 
            
            pWidth: 20 * finalScale,  
            pHeight: 40 * finalScale, 
            hWidth: 30 * finalScale,  
            hHeight: 15 * finalScale, 

            damage: baseDmg * might, // Используем проверенный урон
            img: 'katana_slash.png', sourceId: w.id, 
            rotation: ang + Math.PI/2, 
            pierce: 999,
            
            critFixed: totalCrit 
        });
    }
}


function updateProjectiles(dt_scale) { 
    // --- 1. ОГНЕННЫЕ ЛУЖИ (Napalm / Holy Water) ---
firePools.forEach(p => { 
        p.life -= 1 * dt_scale; 
        
        // ТИК УРОНА (раз в 20 кадров)
        if(p.life % 20 < dt_scale) {
            
            // А) УРОН ПО ВРАГАМ
            enemies.forEach(e => { 
                let enemyR = e.hitboxSize || e.size; 
                if(Math.hypot(e.x-p.x, e.y-p.y) < p.size + enemyR) {
                    dealDamage(e, p.damage || (10 * player.stats.might), p.sourceId); 
                } 
            });

            // Б) САМОУРОН (ТОЛЬКО ДЛЯ ПРОКЛЯТЫХ ЛУЖ)
            // Мы проверяем sourceId. Если это 'fire_scroll' и у нас есть проклятие в базе
            // Или можно просто добавить флаг p.isCursed при создании.
            // Но для простоты: если это fire_ground, считаем, что она жжется.
            if (p.img === 'fire_ground.png' || p.selfDamage) {
                if (Math.hypot(player.x - p.x, player.y - p.y) < p.size) {
                    takeDamage(10, null); // <--- 10 УРОНА ИГРОКУ
                }
            }
        }
    });
    firePools = firePools.filter(p => p.life > 0);

    // --- 2. СНАРЯДЫ ИГРОКА ---
        projectiles.forEach(p => {
        
        // 1. НОВЫЙ КРУГЛЫЙ ВЗРЫВ (ИСПРАВЛЕНО: ТЕПЕРЬ ИСЧЕЗАЕТ)
        if (p.type === 'round_explosion') {
            p.life -= 1 * dt_scale; // <--- ВОТ ЭТОГО НЕ ХВАТАЛО! Теперь взрывы исчезнут.
            
        // 1. УРОН ВРАГАМ
            enemies.forEach(e => {
                if (!p.hitList) p.hitList = [];
                if (!p.hitList.includes(e)) {
                    let dist = Math.hypot(p.x - e.x, p.y - e.y);
                    if (dist < p.size + (e.size || 20)) {
                        dealDamage(e, p.damage, p.sourceId);
                        p.hitList.push(e);
                    }
                }
            });

            // 2. САМОУРОН (Если это взрыв от маленькой мины)
            // Мы пометим их флагом 'canHurtPlayer' при создании (см. ниже)
            if (p.canHurtPlayer && !p.hitPlayer) {
                let dist = Math.hypot(p.x - player.x, p.y - player.y);
                if (dist < p.size) {
                    takeDamage(10, null); // <--- 10 УРОНА ИГРОКУ
                    p.hitPlayer = true;   // Чтобы ударил только 1 раз за взрыв
                }
            }
            return;
        }

        // 2. МИНА (Mine)
        // МИНА (Логика создания взрыва с самоуроном)
        if (p.type === 'mine') {
            p.life -= 1 * dt_scale;
            // ... (движение и armingTimer оставляем) ...
            if (p.vx || p.vy) { p.x += p.vx*dt_scale; p.y += p.vy*dt_scale; p.vx*=0.9; p.vy*=0.9; }
            if (p.armingTimer > 0) { p.armingTimer -= 1 * dt_scale; return; }

            let triggered = false;
            enemies.forEach(e => { if (!triggered && Math.hypot(p.x - e.x, p.y - e.y) < p.size + e.size) triggered = true; });

            if (triggered || p.life <= 0) {
                if (p.cluster) {
                    // Большая мина распадается (БЕЗ УРОНА ИГРОКУ)
                    projectiles.push({
                        type: 'round_explosion', x: p.x, y: p.y, life: 10, 
                        size: 30, damage: 0, img: 'mine_explosion.png', sourceId: p.sourceId,
                        drawScale: 0.8
                    });
                    
                    // Спавним 3 мелкие (ОНИ БУДУТ БИТЬ ИГРОКА)
                    for(let k=0; k<3; k++) {
                        let ang = (k / 3) * Math.PI * 2;
                        projectiles.push({
                            type: 'mine', x: p.x, y: p.y,
                            vx: Math.cos(ang)*8, vy: Math.sin(ang)*8, 
                            life: 600, size: 7, damage: p.damage * 0.5, 
                            img: 'mine.png', sourceId: p.sourceId, cluster: false, 
                            armingTimer: 40,
                            
                            isTraitor: true // <--- МЕТКА: "Я ПРЕДАТЕЛЬ"
                        });
                    }
                } else {
                    // Взрыв (Проверяем: если мина была "Предателем", взрыв тоже бьет игрока)
                    projectiles.push({
                        type: 'round_explosion', x: p.x, y: p.y, 
                        life: 10, size: 30, 
                        damage: p.damage, img: 'mine_explosion.png', sourceId: p.sourceId,
                        drawScale: 0.8,
                        
                        canHurtPlayer: p.isTraitor // <--- Передаем способность бить игрока
                    });
                }
                p.life = 0; 
            }
            return;
        }

        // 3. ФАЕРБОЛ (Fireball)
        if (p.type === 'fireball') {
            p.life -= 1 * dt_scale; p.x += p.vx * dt_scale; p.y += p.vy * dt_scale;
            let hit = false;
            enemies.forEach(e => { if (!hit) { let dist = Math.hypot(p.x - e.x, p.y - e.y); if (dist < p.size + (e.size || 20)) hit = true; } });

            if (hit || p.life <= 0) {
                if (p.napalm) {
                    firePools.push({ x: p.x, y: p.y, life: 300, size: 45, img: 'fire_ground.png', sourceId: p.sourceId, damage: 15 * player.stats.might });
                } else {
                    // 4) ВЗРЫВ ФАЕРБОЛА (Настройка размеров)
                    projectiles.push({
                        type: 'round_explosion', x: p.x, y: p.y, 
                        life: 15, 
                        
                        size: 40, // <--- ХИТБОКС (Радиус)
                        drawScale: 0.6, // <--- СПРАЙТ (Будет 0.6 от размера хитбокса, визуально меньше)
                        
                        damage: p.damage, img: 'fireball_explosion.png', sourceId: p.sourceId
                    });
                }
                p.life = 0;
            }
            return;
        }
        // D. ЩИТ (Orbit Shield)
        if (p.type === 'orbit_shield') {
            p.life -= 1 * dt_scale; p.angle += 0.05 * dt_scale;
            p.x = player.x + Math.cos(p.angle) * p.radius; p.y = player.y + Math.sin(p.angle) * p.radius;
            enemies.forEach(e => {
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.size + e.size) {
                    if ((p.hitTimers.get(e) || 0) <= 0) {
                        dealDamage(e, p.damage, p.sourceId); if (p.freeze) e.freezeTimer = 60; p.hitTimers.set(e, 20);
                    }
                }
            });
            tickHitTimers(p.hitTimers, dt_scale);
            return;
        }

        // E. КАТАНА
        if (p.type === 'slash_wave') {
            p.life -= 1 * dt_scale; 
            p.x += p.vx * dt_scale; 
            p.y += p.vy * dt_scale;
            
            let pPoly = null;
            if (p.hWidth && p.hHeight) {
                pPoly = getRotatedCorners(p.x, p.y, p.hWidth, p.hHeight, p.rotation);
            }

            enemies.forEach(e => {
                if (!p.hitList) p.hitList = [];
                if (!p.hitList.includes(e)) {
                    let isHit = false;
                    if (pPoly) {
                        let eW = (e.size || 20) * 2; 
                        let ePoly = getRotatedCorners(e.x, e.y, eW, eW, 0);
                        if (checkPolygonCollision(pPoly, ePoly)) isHit = true;
                    } else {
                         if (Math.hypot(p.x - e.x, p.y - e.y) < p.size + e.size) isHit = true;
                    }

                    if (isHit) {
                        // ФИКС: Было p.pierce (999% шанс), стало p.critFixed (нормальный шанс)
                        dealDamage(e, p.damage, p.sourceId, false, p.critFixed);
                        
                        p.hitList.push(e);
                    }
                }
            });
            return;
        }

        // --- СТАРЫЕ ОРУЖИЯ (Bible, Boomerang, Axe, Slash, Bullet) ---

        if(p.type === 'bible_book') {
            p.life -= 1 * dt_scale; p.angle += p.speed * dt_scale;
            p.x = player.x + Math.cos(p.angle) * p.radius; p.y = player.y + Math.sin(p.angle) * p.radius;
            enemies.forEach(e => { if(Math.hypot(p.x - e.x, p.y - e.y) < p.size + e.size) { if ((p.hitTimers.get(e) || 0) <= 0) { dealDamage(e, p.damage, p.sourceId, false, p.critFixed); p.hitTimers.set(e, 20); } } });
            tickHitTimers(p.hitTimers, dt_scale); return;
        }
        
        if (p.type === 'boomerang') {
            p.life -= 1 * dt_scale;
            if (p.state === 'stationary') { p.rotation += 0.5 * dt_scale; }
            else if (p.state === 'going') { p.x += p.vx * dt_scale; p.y += p.vy * dt_scale; p.vx *= 0.95; p.vy *= 0.95; if (Math.abs(p.vx) < 0.5 && Math.abs(p.vy) < 0.5) p.state = 'returning'; } 
            else { let dx = player.x - p.x; let dy = player.y - p.y; if (Math.hypot(dx, dy) < 30) { p.life = 0; return; } let angle = Math.atan2(dy, dx); p.x += Math.cos(angle) * p.returnSpeed * dt_scale; p.y += Math.sin(angle) * p.returnSpeed * dt_scale; }
            if (p.state !== 'stationary') p.rotation += 0.2 * dt_scale;
            enemies.forEach(e => { if(Math.hypot(p.x-e.x, p.y-e.y) < p.size + e.size) { if (!p.hitList.includes(e)) { dealDamage(e, p.damage, p.sourceId, false, p.critFixed); p.hitList.push(e); scheduleAction(500, () => { if(projectiles.includes(p)) { let idx = p.hitList.indexOf(e); if(idx>-1) p.hitList.splice(idx,1); } }); } } }); return;
        }
        
        if (p.type === 'axe') {
            p.life -= 1 * dt_scale; p.x += p.vx * dt_scale; p.y += p.vy * dt_scale; p.vy += 0.5 * dt_scale; p.rotation = (p.rotation || 0) + 0.2 * dt_scale;
            enemies.forEach(e => { if(Math.hypot(p.x-e.x, p.y-e.y) < p.size + e.size) { if (!p.hitList.includes(e)) { dealDamage(e, p.damage, p.sourceId, false, p.critFixed); p.hitList.push(e); } } }); return;
        }
        
        if(p.type==='slash') {
            p.life -= 1 * dt_scale; 
            enemies.forEach(e => { 
                if(!p.hit.includes(e)) { 
                    let x1 = p.x, y1 = p.y; let x2 = p.tx, y2 = p.ty; let ex = e.x, ey = e.y; 
                    let lenSq = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1); 
                    let dist = 0; 
                    if (lenSq === 0) dist = Math.hypot(ex - x1, ey - y1); 
                    else { let t = ((ex - x1) * (x2 - x1) + (ey - y1) * (y2 - y1)) / lenSq; t = Math.max(0, Math.min(1, t)); dist = Math.hypot(ex - (x1 + t * (x2 - x1)), ey - (y1 + t * (y2 - y1))); } 
                    
                    let thickness = p.hitWidth || 0.15; 
                    if (dist < (p.size * thickness) + e.size) { 
                        dealDamage(e, p.damage, p.sourceId, false, p.critFixed); 
                        p.hit.push(e); 
                    } 
                } 
            });
        }
        
        else if (p.type === 'bullet') { // Пули (Нож, Посох, Frost Orb)
            p.x += p.vx * dt_scale; p.y += p.vy * dt_scale; p.life -= 1 * dt_scale; 
            enemies.forEach(e => {
                if(Math.hypot(p.x-e.x, p.y-e.y) < p.size + e.size) {
                    if (p.pierce) {
                        if (!p.hitList) p.hitList = [];
                        if (!p.hitList.includes(e)) {
                            dealDamage(e, p.damage, p.sourceId, false, p.critFixed); 
                            if (p.freeze) e.freezeTimer = 60; // Заморозка
                            p.hitList.push(e);
                            if (typeof p.pierce === 'number') { p.pierce--; if (p.pierce <= 0) p.life = 0; }
                        }
                    } else {
                        dealDamage(e, p.damage, p.sourceId, false, p.critFixed); 
                        if (p.freeze) e.freezeTimer = 60;
                        p.life = 0; 
                    }
                }
            });
        }
    });
    projectiles = projectiles.filter(p=>p.life>0);

    // --- 3. СНАРЯДЫ ВРАГОВ ---
    let playerHitbox = player.hitboxSize || 15; 
    enemyProjectiles.forEach(p => {
        let pW = p.width || p.size * 2; let pH = p.height || p.size * 2; 
        let plW = player.width || 20; let plH = player.height || 50; 
        let pAngle = p.rotation !== undefined ? p.rotation : Math.atan2(p.vy, p.vx); 
        if (!p.vx && !p.vy) pAngle = 0; 
        
        const checkHit = () => { 
            if (pW !== pH || (pAngle !== 0 && Math.abs(pAngle) > 0.1)) { 
                let pPoly = getRotatedCorners(p.x, p.y, pW, pH, pAngle); 
                let plPoly = getRotatedCorners(player.x, player.y, plW, plH, 0); 
                return checkPolygonCollision(pPoly, plPoly); 
            } else { 
                return checkRectCollision({x:player.x, y:player.y, width:plW, height:plH}, {x:p.x, y:p.y, width:pW, height:pH}); 
            } 
        }; 
        
        if (p.homing) { 
            let dx = player.x - p.x; let dy = player.y - p.y; let dist = Math.hypot(dx, dy); 
            if (dist > 0) { 
                p.vx += (dx/dist) * 0.1 * dt_scale; p.vy += (dy/dist) * 0.1 * dt_scale; 
                let speed = Math.hypot(p.vx, p.vy); 
                if(speed > 4) { p.vx = (p.vx/speed)*4; p.vy = (p.vy/speed)*4; } 
                p.x += p.vx * dt_scale; p.y += p.vy * dt_scale; 
            } 
            if (checkHit()) { takeDamage(p.damage, null); p.life = 0; } 
        } else { 
            if(p.speed === 0 && p.life < 19) { 
                if (checkHit()) { if(!p.hitPlayer) { takeDamage(p.damage, null); p.hitPlayer = true; } } 
            } else { 
                p.x += p.vx * dt_scale; p.y += p.vy * dt_scale; 
                if (checkHit()) { 
                    takeDamage(p.damage, null); 
                    if(p.isStun && Math.random() < 0.61) { player.stunTimer = 60; damageNumbers.push({x:player.x, y:player.y-60, val: "STUN!", color:'#00FFFF', life:60}); } 
                    if(p.isFragile) { player.fragileTimer = 300; damageNumbers.push({x:player.x, y:player.y-60, val: "FRAGILE!", color:'#ffffff', life:60}); } 
                    if(!p.pierce) p.life = 0; 
                } 
            } 
        } 
        p.life -= 1 * dt_scale;
    });
    enemyProjectiles = enemyProjectiles.filter(p => p.life > 0);
}

// --- ГЛАВНЫЙ ЦИКЛ ОБНОВЛЕНИЯ ---
function update(deltaTime) { 
    player.nearPortal = false; player.nearAnvil = false;
    const effectiveDelta = deltaTime * timeScale;
    const dt_scale = effectiveDelta / 16.666; 
    gameTime += effectiveDelta / 1000;
    updatePendingActions(effectiveDelta);

    // --- PANDORA CURSE (FATAL ERROR) ---
    // Ставим это ДО регенерации, чтобы она не срабатывала зря
    if (player.cursedItems && player.cursedItems['pandora_box']) {
        player.maxHp = 1;
        if (player.hp > 1) player.hp = 1;
    }
    
    if (!isTimeFrozen) {
        if (player.stats.hpRegen > 0 && player.hp < player.maxHp && player.hp > 0) {
            player.regenTimer = (player.regenTimer || 0) - dt_scale;
            if (player.regenTimer <= 0) {
                player.hp = Math.min(player.maxHp, player.hp + player.stats.hpRegen);
                
                // Красивое отображение: если число целое (3), пишем "3", если дробное (0.5), пишем "0.5"
                let valShow = Number.isInteger(player.stats.hpRegen) ? player.stats.hpRegen : player.stats.hpRegen.toFixed(1);
                damageNumbers.push({x:player.x+20, y:player.y-30, val: "+" + valShow, life:30, color:'#2ecc71'}); 
                
                player.regenTimer = 180; // 180 кадров = 3 секунды
                if(window.updateUI) window.updateUI();
            }
        }
        if (!bossesSpawned.boss && stageTime > 0 && !isEndlessMode) stageTime -= effectiveDelta / 1000;
    } else {
        freezeTimer -= effectiveDelta / 1000;
        if (freezeTimer <= 0) { isTimeFrozen = false; document.getElementById('freeze-overlay').classList.remove('active'); }
    }
    
    if (player.fragileTimer > 0) player.fragileTimer -= 1 * dt_scale;
    if (player.items['stopwatch']) {
        stopwatchTimer -= effectiveDelta / 1000;
        if (stopwatchTimer <= 0 && !isTimeFrozen) {
            isTimeFrozen = true; freezeTimer = 2.0; 
            let lvl = player.items['stopwatch'];
            stopwatchTimer = 90 - (lvl * 5); if(stopwatchTimer < 30) stopwatchTimer = 30; 
            document.getElementById('freeze-overlay').classList.add('active');
            damageNumbers.push({x:player.x, y:player.y-80, val: "TIME FREEZE!", color:'#00BFFF', life:60});
        }
    }

    if (stageTime <= 300 && !bossesSpawned.anvil && !isEndlessMode) { spawnAnvil(); bossesSpawned.anvil = true; }

    const stTimer = document.getElementById('stage-timer');
    if (stTimer) {
        if (isEndlessMode) { 
            stTimer.innerText = "SURVIVAL"; 
            stTimer.classList.add('critical'); 
        } 
        else if(stageTime <= 0) {
            stTimer.innerText = "00:00";
        }
        else {
            // ИСПОЛЬЗУЕМ CEIL (ВВЕРХ), чтобы 10:00 висело 1 секунду
            let totalStageSeconds = Math.ceil(stageTime);
            let m = Math.floor(totalStageSeconds / 60); 
            let s = totalStageSeconds % 60;
            
            stTimer.innerText = (m<10?'0'+m:m)+":"+(s<10?'0'+s:s);
            
            if(stageTime < 10 && !isEndlessMode) stTimer.classList.add('critical'); 
            else stTimer.classList.remove('critical');
        }
    }

    // --- ОБЩИЙ ТАЙМЕР (0:00 -> 0:01) ---
    const gTimer = document.getElementById('timer');
    if (gTimer) {
        // ИСПОЛЬЗУЕМ FLOOR (ВНИЗ), чтобы 0:00 висело 1 секунду
        let totalGameSeconds = Math.floor(gameTime);
        let gm = Math.floor(totalGameSeconds / 60); 
        let gs = totalGameSeconds % 60;
        gTimer.innerText = (gm<10?'0'+gm:gm)+":"+(gs<10?'0'+gs:gs);
    }

    if (!isEndlessMode && currentStage < 5) {
        if (stageTime <= 420 && !bossesSpawned.mini1) {
            bossesSpawned.mini1 = true;
            if (currentStage === 4) { spawnMiniBoss('crystalserpent4'); spawnMiniBoss('crystalstrider4'); } 
            else { let type = currentStage === 3 ? 'firegolem3' : (currentStage === 2 ? 'firezombie2' : 'skeleton'); spawnMiniBoss(type); }
            showBossWarning('boss_mini');
        }
        if (stageTime <= 240 && !bossesSpawned.mini2) {
            bossesSpawned.mini2 = true;
            if (currentStage === 4) { spawnMiniBoss('shardgolem4'); } 
            else { let type = currentStage === 3 ? 'firesliz3' : (currentStage === 2 ? 'sandgolem2' : 'zombie'); spawnMiniBoss(type); }
            showBossWarning('boss_mini');
        }
        if (stageTime <= 120 && !merchantSpawned) { spawnMerchant(); merchantSpawned = true; } 
        if (stageTime <= 0 && !bossesSpawned.boss) {
            if (currentStage === 3) {
                 if (!bossesSpawned.waitingForBoss) {
                     bossesSpawned.waitingForBoss = true; bossesSpawned.waitTimer = 5; enemies = []; showBossWarning("SILENCE...");
                 } else {
                     bossesSpawned.waitTimer -= effectiveDelta / 1000;
                     if (bossesSpawned.waitTimer <= 0) { bossesSpawned.boss = true; spawnBoss(); }
                 }
            } else { bossesSpawned.boss = true; spawnBoss(); }
        }
    }
    
    if (currentStage === 5 && !bossesSpawned.boss && !isEndlessMode) {
        if (!bossesSpawned.waitingForBoss) { bossesSpawned.waitingForBoss = true; bossesSpawned.waitTimer = 5; } 
        else {
            bossesSpawned.waitTimer -= effectiveDelta / 1000;
            if (bossesSpawned.waitTimer <= 0) { bossesSpawned.boss = true; spawnBoss(); }
        }
    }

    if (player.healFlashTimer > 0) player.healFlashTimer -= 1 * dt_scale;
    if (player.stunTimer > 0) player.stunTimer -= 1 * dt_scale;

    visualEffects.forEach(fx => {
        if(fx.type === 'vampire_wave') {
            fx.x = player.x; fx.y = player.y; fx.radius += 2 * dt_scale; fx.alpha -= 0.03 * dt_scale;
            if(fx.alpha < 0) fx.life = 0;
        } else fx.life -= 1 * dt_scale;
    });
    visualEffects = visualEffects.filter(fx => fx.life > 0);
    
    enemyGroundEffects.forEach(p => {
        p.life -= 1 * dt_scale;
        if (p.life % 30 < dt_scale) { if (Math.hypot(p.x - player.x, p.y - player.y) < p.size) takeDamage(10, null); }
    });
    enemyGroundEffects = enemyGroundEffects.filter(p => p.life > 0);

    if (player.hp <= player.maxHp * 0.4) document.getElementById('gameCanvas').classList.add('grayscale-filter');
    else document.getElementById('gameCanvas').classList.remove('grayscale-filter');

    if (player.stunTimer <= 0) {
        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

        if (dx !== 0 || dy !== 0) {
            if (dy < 0) player.direction = 'up'; else if (dy > 0) player.direction = 'down'; else if (dx < 0) player.direction = 'left'; else if (dx > 0) player.direction = 'right';
            let len = Math.hypot(dx, dy);
            let speed = player.speed * player.stats.moveSpeed;
            player.x += (dx/len)*speed * dt_scale; player.y += (dy/len)*speed * dt_scale; 
            let b = TILE_SIZE+20;
            player.x = Math.max(b, Math.min(WORLD_SIZE-b, player.x));
            player.y = Math.max(b, Math.min(WORLD_SIZE-b, player.y));
        }
    }
    
    let cx = player.x - window.innerWidth / 2;
    let cy = player.y - window.innerHeight / 2;
    camera.x = Math.max(0, Math.min(cx, WORLD_SIZE - window.innerWidth));
    camera.y = Math.max(0, Math.min(cy, WORLD_SIZE - window.innerHeight));

// --- ОБНОВЛЕНИЕ ОРУЖИЯ (С ЛОГИКОЙ ADRENALINE SHOT) ---

    // 1. Проверяем движение. (Используем window.keys, так как keys объявлен в main.js)
    let isMoving = false;
    if (window.keys) {
        isMoving = (window.keys['KeyW'] || window.keys['KeyS'] || window.keys['KeyA'] || window.keys['KeyD'] || 
                    window.keys['ArrowUp'] || window.keys['ArrowDown'] || window.keys['ArrowLeft'] || window.keys['ArrowRight']);
    }

    // 2. Если Проклятый Адреналин: СТОИШЬ = ОРУЖИЕ НЕ РАБОТАЕТ
    let adrenalineBlock = (player.cursedItems && player.cursedItems['adrenaline_shot'] && !isMoving);

    player.weapons.forEach(w => {
        // Если блок активен — пропускаем (таймер не тикает, выстрела нет)
        if (adrenalineBlock) return;

        if (w.timer > 0) w.timer -= 1 * dt_scale; // Твой dt_scale на месте
        else { 
            fireWeapon(w); 
            
            // --- РАСЧЕТ СКОРОСТРЕЛЬНОСТИ ---
            let cooldownBonus = player.stats.cooldown;
            
            // Логика Адреналина (Эпик)
            if (player.items['adrenaline_shot']) {
                let lvl = player.items['adrenaline_shot'];
                if (isMoving) {
                    // Бежим: +10% за уровень (до +50%)
                    cooldownBonus += (lvl * 0.10);
                } else {
                    // Стоим: -20% штраф
                    cooldownBonus -= 0.20;
                }
            }
            
            w.timer = w.cooldown / (1 + cooldownBonus); 
        }
    }); 

    updateProjectiles(dt_scale); 
    
    // Темп спавна растёт от времени ТЕКУЩЕГО этапа (+0.01 за каждый этап), а не от общего времени забега
    let timeInStageForSpawn = Math.max(0, gameTime - stageStartTime);
    let spawnRate = 0.02 + 0.01 * (currentStage - 1) + (timeInStageForSpawn/3000) + (player.stats.curse * 0.02);
    if(currentStage === 3 && bossesSpawned.boss) spawnRate = 0; 
    if(isEndlessMode) spawnRate = 0.08 + (player.stats.curse * 0.05);

    if (!isTimeFrozen) {
        let spawnRateAdjusted = spawnRate * dt_scale;
        if (Math.random() < spawnRateAdjusted) spawnEnemy();
    }
    
portals.forEach(p => {
        if(Math.hypot(player.x - p.x, player.y - p.y) < 100) { 
            player.nearPortal = true;
            
            // Открываем кодекс, когда подошел к порталу
            if(window.Cloud && window.Cloud.unlockCodexWorld) window.Cloud.unlockCodexWorld('portal');
            
            if(keys['KeyE']) nextStage(p.nextStage);
        }
    });
    
    anvils.forEach(a => {
        if (a.cooldown > 0) a.cooldown -= 1 * dt_scale;
        if(a.active && Math.hypot(player.x - a.x, player.y - a.y) < 100) {
            player.nearAnvil = true; 
            if (!a.seen) { damageNumbers.push({x:a.x, y:a.y-60, val: "CURSED ANVIL", color:'#39ff14', life:120}); a.seen = true; }
            if(keys['KeyE']) {
                if (a.cooldown > 0) return;
                let totalItems = player.weapons.length + Object.keys(player.items).length;
                if (totalItems >= 2) { if(window.openCursedAnvilMenu) window.openCursedAnvilMenu(a); } else showBossWarning("need_more_power");
            }
        }
    });
    anvils = anvils.filter(a => a.active);

    player.nearMerchant = false;
    traders.forEach(t => {
        if (t.active && Math.hypot(player.x - t.x, player.y - t.y) < 100) {
            player.nearMerchant = true; 
            if (keys['KeyE']) { if (window.openShopMenu) { window.openShopMenu(t); keys['KeyE'] = false; } }
        }
    });
    traders = traders.filter(t => t.active);

enemies.forEach(e => {
        if (isTimeFrozen) return;

        // 1. СНАЧАЛА ОБЪЯВЛЯЕМ ПЕРЕМЕННУЮ (Исправление ошибки)
        let moveSpeedFactor = 1.0; 

        // 2. Считаем дистанцию
        let distFromPlayer = Math.hypot(player.x - e.x, player.y - e.y);

        // --- ВСТАВЛЯТЬ СЮДА (3C) ---

        // 3. РЕЦИРКУЛЯЦИЯ (Hard Despawn)
        // Если враг дальше 1300px и не босс — удаляем.
        if (distFromPlayer > 1100 && !e.isBoss && !e.isMiniBoss) {
            e.dead = true; 
            return; // Прерываем обработку этого врага
        }

        // 4. ЭФФЕКТ РЕЗИНКИ (Rubber Banding)
        // Если враг отстал, он ускоряется
        if (distFromPlayer > 800) {
            moveSpeedFactor *= 2.5; // Очень быстро
        } else if (distFromPlayer > 600) {
            moveSpeedFactor *= 1.5; // Быстро
        }
        
        // 5. ЗАМОРОЗКА (Твой код)
        if (e.freezeTimer > 0) {
            e.freezeTimer -= 1 * dt_scale;
            // Если заморожен, скорость падает (перекрывает резинку, что логично)
            moveSpeedFactor = 0.5; 
            
            if (Math.random() < 0.1) visualEffects.push({ type: 'snowflake', x: e.x, y: e.y, life: 20 });
        }
        
        // Дальше твой код без изменений...
        let pushX = 0;
        let pushY = 0;
        let myRadius = (e.hitboxSize || e.size || (e.width ? e.width / 2 : 20)) * 0.8; // Чуть меньше реального размера, чтобы могли плотно стоять

        if (Math.abs(player.x - e.x) < 900 && Math.abs(player.y - e.y) < 600) {
            for (let other of enemies) {
                if (e === other) continue;

                let dx = e.x - other.x;
                let dy = e.y - other.y;

                if (Math.abs(dx) > 50 || Math.abs(dy) > 50) continue; 

                let distSq = dx*dx + dy*dy;
                
                // Считаем радиус соседа так же
                let otherR = (other.hitboxSize || other.size || (other.width ? other.width / 2 : 20)) * 0.8;
                let minDist = myRadius + otherR;
                let minDistSq = minDist * minDist;

                if (distSq < minDistSq && distSq > 0) {
                    let dist = Math.sqrt(distSq);
                    let force = (minDist - dist) / minDist; 
                    
                    // --- НОВАЯ ФИЗИКА ВЕСА ---
                    let pushStrength = 1.5; // Базовая сила для обычных мобов

                    // 1. Танки: Их почти невозможно сдвинуть мелким мобам
                    if (e.role === 'tank') {
                        if (other.role === 'tank') pushStrength = 0.5; // Танк об Танк трется
                        else pushStrength = 0.05; // Мелочь вообще не толкает Танка
                    }
                    // 2. Боссы: Несдвигаемы
                    else if (e.isBoss || e.isMiniBoss) {
                        pushStrength = 0.01; 
                    }
                    // 3. Фланкеры: Легкие, легко отлетают
                    else if (e.role === 'flanker') {
                        pushStrength = 2.0;
                    }
                    
                    pushX += (dx / dist) * force * pushStrength;
                    pushY += (dy / dist) * force * pushStrength;
                }
            }
        }

        if (pushX !== 0 || pushY !== 0) {
            let oldX = e.x;
            let oldY = e.y;
            
            e.x += pushX * dt_scale;
            e.y += pushY * dt_scale;
            
            // --- ПРОВЕРКА СТЕН ПОСЛЕ ТОЛЧКА ---
            let wallBuffer = TILE_SIZE + (e.size || 20); // Отступ от стены равен размеру моба
            
            // 1. Границы мира
            e.x = Math.max(wallBuffer, Math.min(WORLD_SIZE - wallBuffer, e.x));
            e.y = Math.max(wallBuffer, Math.min(WORLD_SIZE - wallBuffer, e.y));
            
            // 2. Проверка тайлов (Гор)
            let tx = Math.floor(e.x / TILE_SIZE);
            let ty = Math.floor(e.y / TILE_SIZE);
            
            // Если моба затолкали в гору
            if (worldMap[ty] && worldMap[ty][tx] === 'mountains') {
                // Пытаемся скользить: отменяем X, оставляем Y
                e.x = oldX; 
                let tx2 = Math.floor(e.x / TILE_SIZE);
                let ty2 = Math.floor(e.y / TILE_SIZE);
                
                // Если все еще в горе, отменяем и Y (полный откат)
                if (worldMap[ty2] && worldMap[ty2][tx2] === 'mountains') {
                    e.y = oldY;
                }
            }
        }
        if (e.type === 'firesliz3') {
             let distToP = Math.hypot(player.x - e.x, player.y - e.y);
             if (distToP < 50) { e.dead = true; spawnEnemyProjectile(e.x, e.y, 0, 0, 'explosion'); damageNumbers.push({x:e.x, y:e.y-40, val:"BOOM!", color:'#e67e22', life:45}); }
        }
        
        if (e.isBoss) {
            if(e.meteorTimer > 0) e.meteorTimer -= 1 * dt_scale;
            if(e.lavaTimer > 0) e.lavaTimer -= 1 * dt_scale;
            if(e.summonTimer > 0) e.summonTimer -= 1 * dt_scale;

            if (e.type === 'boss31' || e.type === 'boss32') {
                if (e.meteorTimer <= 0) {
                     e.meteorTimer = 240; 
                     let count = 6 + Math.floor(Math.random()*3);
                     for(let i=0; i<count; i++) {
                         let angle = Math.random() * Math.PI * 2;
                         let dist = Math.random() * 300;
                         let tx = player.x + Math.cos(angle) * dist;
                         let ty = player.y + Math.sin(angle) * dist;
                         visualEffects.push({ type: 'warning_circle', x: tx, y: ty, life: 90, radius: 100 });
                         scheduleAction(1500, () => { if(gameState === 'PLAYING' && !isTimeFrozen) spawnEnemyProjectile(tx, ty, 0, 0, 'explosion'); });
                     }
                }
                if (e.type === 'boss32' && e.lavaTimer <= 0) {
                    e.lavaTimer = 600; 
                    let count = 4;
                    for(let i=0; i<count; i++) {
                        let rx = (Math.random()-0.5) * 400; let ry = (Math.random()-0.5) * 400;
                        enemyGroundEffects.push({ x: player.x + rx, y: player.y + ry, life: 360, size: 60, img: 'lava_crack' });
                    }
                }
            }
        }

        if(e.attackCooldown > 0) e.attackCooldown -= 1 * dt_scale;
        if(e.shootCooldown > 0) e.shootCooldown -= 1 * dt_scale;

// 1. Инициализация направления обхода (для Фланкеров)
        if (e.role === 'flanker' && !e.flankDir) {
            e.flankDir = Math.random() < 0.5 ? 1 : -1; // 1 = по часовой, -1 = против
        }

        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let distToPlayer = Math.hypot(dx, dy);
        let moveAngle = Math.atan2(dy, dx); // Базовый угол (прямо на игрока)

        // 2. ЛОГИКА ФЛАНКЕРА (Окружение)
        if (e.role === 'flanker') {
            // Если мы на средней дистанции (120px - 450px) — бежим по дуге
            if (distToPlayer > 120 && distToPlayer < 450) {
                // Смещаем угол на ~45 градусов
                moveAngle += 0.8 * e.flankDir;
            }
        }

        // 3. ЛОГИКА БОССА (Рывок / Charge)
        if (e.role === 'boss_charger') {
            if (!e.chargeState) { e.chargeState = 'idle'; e.chargeTimer = 300; } // 5 сек кулдаун

            if (e.chargeState === 'idle') {
                e.chargeTimer -= 1 * dt_scale;
                if (e.chargeTimer <= 0) {
                    e.chargeState = 'prep';
                    e.chargeTimer = 60; // 1 сек подготовки
                    damageNumbers.push({x:e.x, y:e.y-80, val:"!!!", color:'#e74c3c', life:60});
                }
            } 
            else if (e.chargeState === 'prep') {
                e.chargeTimer -= 1 * dt_scale;
                e.speed = 0; // Стоим
                if (e.chargeTimer <= 0) {
                    e.chargeState = 'dash';
                    e.chargeTimer = 40; // Рывок (0.6 сек)
                    e.dashAngle = moveAngle; 
                }
                moveAngle = null; // Не двигаемся стандартно
            }
            else if (e.chargeState === 'dash') {
                e.chargeTimer -= 1 * dt_scale;
                moveAngle = e.dashAngle; // Летим по прямой
                e.speed = 9.0; // ОЧЕНЬ БЫСТРО
                
                // Урон тараном
                if (checkRectCollision({x:player.x, y:player.y, width:20, height:20}, {x:e.x, y:e.y, width:e.width, height:e.height})) {
                    takeDamage(40, e);
                }

                if (e.chargeTimer <= 0) {
                    e.chargeState = 'idle';
                    e.chargeTimer = 300;
                    e.speed = 2.2; // Сброс скорости
                }
            }
        }

        // --- ПРИМЕНЕНИЕ ДВИЖЕНИЯ ---
        e.direction = (Math.abs(dx) > Math.abs(dy)) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        
        let stopDistance = 0;
        // Список стрелков (из твоего списка)
        if (['owl2','boss2','boss31','boss32','crystalserpent4','crystalstrider4','abysswraith5','boss51','boss52','boss53','boss4'].includes(e.type)) stopDistance = 350; 

        // Если moveAngle не null (босс не в фазе подготовки)
        if (moveAngle !== null) {
            if (distToPlayer > stopDistance) { 
                e.x += Math.cos(moveAngle) * e.speed * dt_scale* moveSpeedFactor;
                e.y += Math.sin(moveAngle) * e.speed * dt_scale* moveSpeedFactor; 
            }
            else if (distToPlayer < 200 && stopDistance > 0) { 
                // Стрелки отходят назад (Кайт)
                e.x -= Math.cos(moveAngle) * e.speed * 0.5 * dt_scale* moveSpeedFactor; 
                e.y -= Math.sin(moveAngle) * e.speed * 0.5 * dt_scale* moveSpeedFactor; 
            }
        }
        
        // СТРЕЛЬБА
        if (e.shootType || (e.isBoss && e.type !== 'boss')) {
            let cd = 240; 
            if (e.type === 'boss2') cd = 70; 
            if (e.type === 'boss31') cd = 90; 
            if (e.type === 'boss32') { cd = 30 + (e.hp/e.maxHp * 70); }
            if (e.type === 'boss4') cd = 90; 
            if (e.type === 'boss51') cd = 150;
            if (e.type === 'boss52') cd = 80; 
            if (e.type === 'boss53') cd = 20; 
            if (e.type.includes('serpent')) cd = 250;
            if (e.type.includes('strider')) cd = 280;
            if (e.type.includes('wraith')) cd = 150;

            if (e.shootCooldown <= 0 && distToPlayer < 700) {
                let va = Math.atan2(player.y - e.y, player.x - e.x);
                if (['boss2','boss31','boss32','boss53','boss4','boss51'].includes(e.type)) {
                    let projectilesCount = 1;
                    let spread = 0.5; 
                    let pType = e.type;

                    if (e.type === 'boss2') { projectilesCount = 3; spread = 0.5; }
                    else if (e.type === 'boss31') { projectilesCount = 7; spread = 1.0; }
                    else if (e.type === 'boss32') { projectilesCount = 11; spread = 1.5; }
                    else if (e.type === 'boss4') { projectilesCount = 5; spread = 0.8; }
                    else if (e.type === 'boss51') { projectilesCount = 4; spread = 0.6; }
                    else if (e.type === 'boss53') {
                        projectilesCount = 8; spread = Math.PI * 2; 
                        for(let k=0; k<2; k++) {
                            let lOff = (k-0.5) * 0.3; 
                            spawnEnemyProjectile(e.x, e.y, Math.cos(va+lOff), Math.sin(va+lOff), 'boss53_laser');
                        }
                    }

                    for(let i=0; i<projectilesCount; i++) {
                         let offset;
                         if (e.type === 'boss53') offset = (i / projectilesCount) * Math.PI * 2 + (gameTime); 
                         else if (projectilesCount > 1) offset = (i - (projectilesCount - 1) / 2) * (spread / (projectilesCount - 1));
                         else offset = 0;
                         
                         let spawnX = e.x; let spawnY = e.y;
                         if (e.type === 'boss51') {
                             let shiftDist = 80; let shiftAngle = (i / projectilesCount) * Math.PI * 2;
                             spawnX += Math.cos(shiftAngle) * shiftDist; spawnY += Math.sin(shiftAngle) * shiftDist;
                         }
                         spawnEnemyProjectile(spawnX, spawnY, Math.cos(va + offset), Math.sin(va + offset), pType);
                    }
                } else {
                    let pSize = null; let pW = null; let pH = null;    
                    if (e.isMiniBoss) {
                        if (e.type.includes('crystalserpent4')) { pSize = 25; pW = 60; pH = 20; }
                        else if (e.type.includes('crystalstrider4')) { pSize = 30; pW = 40; pH = 40; }
                    }
                    spawnEnemyProjectile(e.x, e.y, Math.cos(va), Math.sin(va), e.type, pSize, pW, pH);
                }
                e.shootCooldown = cd;
            }
        }

        let eW = e.width || (e.hitboxSize ? e.hitboxSize*2 : e.size*2);
        let eH = e.height || (e.hitboxSize ? e.hitboxSize*2 : e.size*2);
        if (checkRectCollision({x: player.x, y: player.y, width: player.width, height: player.height}, {x: e.x, y: e.y, width: eW, height: eH})) {
            if (e.attackCooldown <= 0) { takeDamage(e.damage || 5, e); e.attackCooldown = 60; }
        }
    });
    enemies = enemies.filter(e => !e.dead);
    
    // Исчезающие дропы (золото при проклятом Кошеле); остальные лежат до подбора
    drops = drops.filter(d => {
        if (d.expires) { d.life -= dt_scale; return d.life > 0; }
        return true;
    });
    // Идём с конца, чтобы splice не пропускал соседние дропы
    for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        let dist = Math.hypot(player.x - d.x, player.y - d.y);
        if (dist < player.stats.magnet && d.type !== 'heart') { d.x += (player.x-d.x)*0.15 * dt_scale; d.y += (player.y-d.y)*0.15 * dt_scale; }
        if (dist < 30) {
            drops.splice(i, 1);
            if (d.type === 'xp') { let bonus = player.stats.growth; player.exp += Math.max(1, 10 + bonus); if(player.exp >= player.nextLevelExp) levelUp(); }
            else if (d.type === 'gold') { player.gold += (10 + player.stats.greed); }
            else if (d.type === 'heart') { player.hp = Math.min(player.maxHp, player.hp + 30); damageNumbers.push({x:player.x,y:player.y-30,val:"+30",color:"#2ecc71",life:40}); triggerHealFlash(); }
            if(window.updateUI) window.updateUI();
        }
    }

    for (let i = chests.length - 1; i >= 0; i--) {
        let c = chests[i];
        if (Math.hypot(player.x - c.x, player.y - c.y) < 60) {
            if(window.Cloud && window.Cloud.unlockCodexWorld) {
                if (c.type === 'normal') window.Cloud.unlockCodexWorld('chest_normal');
                else if (c.type === 'gold') window.Cloud.unlockCodexWorld('chest_gold');
            }
            if (c.type === 'normal') {
                if (player.gold >= c.cost) {
                    player.gold -= c.cost;
                    currentChestCost = Math.ceil(currentChestCost * 1.2);
                    chests.forEach(ch => { if(ch.type === 'normal') ch.cost = currentChestCost; });
                    chests.splice(i, 1);
                    openChest('normal');
                }
            } else { chests.splice(i, 1); openChest('gold'); }
            if(window.updateUI) window.updateUI(); 
        }
    }
    
    damageNumbers.forEach(dn=>{ dn.y -= 0.5 * dt_scale; dn.life -= 1 * dt_scale; });
    damageNumbers = damageNumbers.filter(d=>d.life>0);
}

// --- ЧИТЫ ---
window.forceSpawn = function(target) {
    if (target === 'merchant') { 
        spawnMerchant(); 
        damageNumbers.push({x:player.x, y:player.y-50, val: "CHEAT: SHOP!", color:'#f1c40f', life:60}); 
        return; 
    }
    if (target === 'boss') { bossesSpawned.waitingForBoss = false; bossesSpawned.boss = true; spawnBoss(); damageNumbers.push({x:player.x, y:player.y-50, val: "CHEAT: BOSS!", color:'#ff0000', life:60}); return; }
    let type = '';
    if (target === 'mini1') {
        if (currentStage === 4) { spawnMiniBoss('crystalserpent4'); spawnMiniBoss('crystalstrider4'); damageNumbers.push({x:player.x, y:player.y-50, val: "CHEAT: TWIN MINI!", color:'#ff00ff', life:60}); return; } 
        else if (currentStage === 3) type = 'firegolem3'; else if (currentStage === 2) type = 'firezombie2'; else type = 'skeleton';
    } 
    else if (target === 'mini2') {
        if (currentStage === 4) type = 'shardgolem4'; else if (currentStage === 3) type = 'firesliz3'; else if (currentStage === 2) type = 'sandgolem2'; else type = 'zombie';
    }
    if (type) { spawnMiniBoss(type); damageNumbers.push({x:player.x, y:player.y-50, val: "CHEAT: MINI BOSS!", color:'#ff00ff', life:60}); }
};

// game/logic.js -> В самый низ

window.cheatGiveSoulStone = function() {
    if (!player.items['soul_stone']) {
        player.items['soul_stone'] = 1;
        
        // Применяем пассивку (должно дать +20% Might сразу)
        applyItemPassive('soul_stone'); 
        
        // Обновляем инвентарь
        if(window.updateInventoryUI) window.updateInventoryUI();
        if(window.updateUI) window.updateUI();
        
        damageNumbers.push({x:player.x, y:player.y-50, val: "SOUL STONE GET!", color:'#9b59b6', life:120});
    } else {
        // Если уже есть, просто накинем убийств для теста (опционально)
        kills += 500;
        damageNumbers.push({x:player.x, y:player.y-50, val: "+500 KILLS", color:'#fff', life:60});
        if(window.updateInventoryUI) window.updateInventoryUI();
    }
};
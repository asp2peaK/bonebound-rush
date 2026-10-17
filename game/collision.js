// game/collision.js

// --- ВИЗУАЛЬНЫЕ ЭФФЕКТЫ БОЯ ---

function triggerHealFlash() { 
    player.healFlashTimer = 60; 
}

function spawnVampireEffect() {
    visualEffects.push({ type: 'vampire_wave', x: player.x, y: player.y, radius: 10, maxRadius: 20, alpha: 1.0, life: 30 });
}

// Вспышка экрана (для смены фаз боссов)
function triggerScreenFlash(color, opacity, duration) {
    const overlay = document.getElementById('boss-transition-overlay');
    if (overlay) {
        overlay.style.backgroundColor = color;
        overlay.style.opacity = opacity;
        overlay.style.transition = `opacity ${duration}s`;
        overlay.classList.add('active');
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.classList.remove('active'), duration * 1000);
        }, 100);
    }
}

// --- ЛОГИКА КАМНЯ ДУШ ---
// game/collision.js

function checkSoulStone() {
    if (soulStoneStartKills === null) {
        soulStoneStartKills = kills - 1; 
    }
    let currentSoulKills = kills - soulStoneStartKills;
    let newStage = 0;
    
    // Определяем текущий этап
    if (currentSoulKills >= 1500) newStage = 1;  // Lvl 2
    if (currentSoulKills >= 3500) newStage = 2;  // Lvl 3
    if (currentSoulKills >= 7000) newStage = 3;  // Lvl 4
    if (currentSoulKills >= 12500) newStage = 4; // Lvl 5 (MAX)

    if (newStage > soulStoneStage) {
        soulStoneStage = newStage;
        
        // Вспышка улучшения
        const flash = document.getElementById('soul-upgrade-overlay');
        if(flash) { flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 500); }
        
        // --- РАЗДАЧА СТАТОВ ПО УРОВНЯМ ---
        
        // Уровень 2 (1500): Даем Скорострельность
        if (newStage === 1) { 
            player.stats.cooldown += 0.20; 
            damageNumbers.push({x:player.x, y:player.y-60, val: "SOUL LVL 2!", color:'#9b59b6', life:90}); 
        }
        
        // Уровень 3 (3500): Даем Скорость полета
        if (newStage === 2) { 
            player.stats.projSpeed += 0.20; 
            damageNumbers.push({x:player.x, y:player.y-60, val: "SOUL LVL 3!", color:'#9b59b6', life:90}); 
        }
        
        // Уровень 4 (7000): Даем +1 Снаряд
        if (newStage === 3) { 
            player.stats.amount += 1; 
            damageNumbers.push({x:player.x, y:player.y-60, val: "SOUL LVL 4!", color:'#9b59b6', life:90}); 
        }
        
        // Уровень 5 (12500): Удваиваем ВСЁ (даем еще раз то же самое)
        if (newStage === 4) { 
            player.stats.might += 0.20;      // Было 20, стало 40
            player.stats.cooldown += 0.20;   // Было 20, стало 40
            player.stats.projSpeed += 0.20;  // Было 20, стало 40
            player.stats.amount += 1;        // Было +1, стало +2
            
            damageNumbers.push({x:player.x, y:player.y-60, val: "ULTIMATE POWER!", color:'#e74c3c', life:180}); 
        }
        
        // Обновляем картинку и UI
        if(DB.items.soul_stone) DB.items.soul_stone.img = `soulstone${newStage + 1}.png`;
        if(window.updateInventoryUI) window.updateInventoryUI(); 
        if(window.updateUI) window.updateUI(); 

        if(window.Cloud && window.Cloud.unlockCodexItem) {
            window.Cloud.unlockCodexItem('soul_stone', newStage + 1); // +1 потому что newStage 0..4, а нам надо 1..5
        }
    }
}

// game/collision.js -> dealDamage

function dealDamage(e, dmg, sourceId = null, isVampire = false, critOverride = null) {
    // 1. ЗАЩИТА ОТ NaN (Чтобы игра не ломалась)
    if (isNaN(dmg) || dmg === undefined || dmg === null) {
        // console.error("NaN damage detected:", sourceId); // Можно раскомментить для проверки
        dmg = 1; 
    }
    if(dmg < 1) return; 
    if(e.moldStacks) dmg *= (1+e.moldStacks*0.1);
    
    // --- FIX: ЛОГИКА КРИТА (БЕЗОПАСНАЯ) ---
    // 1. По умолчанию берем шанс игрока
    let finalCritChance = player.stats.critChance;
    
    // 2. Если оружие передало свой ФИКСИРОВАННЫЙ шанс (например, Катана 0.5), 
    // используем его ВМЕСТО статов игрока.
    if (critOverride !== null && critOverride !== undefined && typeof critOverride === 'number') {
        finalCritChance = critOverride;
    }
    
    // 3. Проверка: Если шанс > 2.0 (например 999 от pierce), это НЕ крит.
    // Критуем, только если шанс адекватный (<= 200%).
    let isCrit = false;
    if (finalCritChance <= 2.0 && Math.random() < finalCritChance) {
        isCrit = true;
        dmg *= player.stats.critDamage;
    }
    // ---------------------------------------------

    // Подсчет статистики оружия
    if (sourceId && sourceId !== 'zap' && sourceId !== 'thornmail') {
        let w = player.weapons.find(x => x.id === sourceId);
        if (w) {
             if (!w.totalDamage) w.totalDamage = 0;
             w.totalDamage += Math.round(dmg);
        }
    }
    
    e.hp -= dmg;
    
    // Визуал
    let color = isCrit ? '#ff0000' : 'white';
    let text = Math.round(dmg);
    if(isCrit) text = "!" + text;
    damageNumbers.push({x:e.x, y:e.y-20, val: text, life:30, color: color});

    // Вампиризм
    let finalVampChance = Math.min(player.stats.vampChance, 0.3);

    // ПРОВЕРКА БУТЫЛКИ (Если проклята - шанс всегда 1%)
    if (player.cursedItems && player.cursedItems['empty_bottle']) {
        finalVampChance = 0.01;
    } else {
        // Иначе твой обычный кап (0.3)
        finalVampChance = Math.min(finalVampChance, 0.3);
    }

    if (!isVampire && Math.random() < finalVampChance) {
        let healAmount = player.stats.vampPower; 
        if (healAmount > 0) {
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            damageNumbers.push({x:player.x, y:player.y-40, val: "+" + healAmount, life:30, color:'#2ecc71'});
            spawnVampireEffect();
            if(window.updateUI) window.updateUI(); 
        }
    }
    
    // Плесень
    if(player.items['plesen'] && Math.random()<0.3) {
        // Потолок стаков растёт с уровнем предмета: 5 + 2 за уровень (каждый стак = +10% урона по врагу)
        let moldCap = 5 + 2 * player.items['plesen'];
        if ((e.moldStacks || 0) < moldCap) {
            e.moldStacks = (e.moldStacks || 0) + 1;
            damageNumbers.push({x:e.x, y:e.y-40, val:"Mold", life:20, color:'#2ecc71'});
        }
    }
    
    // ZAP
    if(player.items['zap'] && Math.random() < 0.5 && !isVampire) {
        let n = enemies.find(en=>en!==e && Math.hypot(en.x-e.x, en.y-e.y)<200);
        if(n) {
            dealDamage(n, dmg*0.5, 'zap', true); 
            visualEffects.push({ type: 'zap', x: e.x, y: e.y, tx: n.x, ty: n.y, life: 15 });
        }
    }

    // СМЕРТЬ ИЛИ СМЕНА ФАЗЫ
    if (e.hp <= 0 && !e.dead) {
        // --- ПЕРЕХОДЫ ФАЗ БОССОВ ---
        if (e.type === 'boss31') {
            if(window.Cloud && window.Cloud.unlockCodexEnemy) window.Cloud.unlockCodexEnemy('boss31');
            e.type = 'boss32'; e.hp = e.maxHp; e.phase = 2;
            if (DB.enemies.boss32) { e.width = DB.enemies.boss32.width || e.width; e.height = DB.enemies.boss32.height || e.height; e.size = DB.enemies.boss32.size || e.size; }
            damageNumbers.push({x:e.x, y:e.y-80, val:"PHASE 2!", color:'#e74c3c', life:90});
            triggerScreenFlash('white', 0.2, 0.2); return; 
        }
        if (e.type === 'boss51') {
            if(window.Cloud && window.Cloud.unlockCodexEnemy) window.Cloud.unlockCodexEnemy('boss51');
            e.type = 'boss52'; e.hp = 40000 * (1 + (gameTime/600)*0.2); e.maxHp=e.hp; e.phase = 2; e.speed = 4.0;
            if (DB.enemies.boss52) { e.width = DB.enemies.boss52.width || e.width; e.height = DB.enemies.boss52.height || e.height; e.size = DB.enemies.boss52.size || 80; } else { e.size = 80; }
            damageNumbers.push({x:e.x, y:e.y-80, val:"VOID RAGE!", color:'#8e44ad', life:90});
            triggerScreenFlash('#00FFFF', 0.2, 0.2); return;
        }
        if (e.type === 'boss52') {
            if(window.Cloud && window.Cloud.unlockCodexEnemy) window.Cloud.unlockCodexEnemy('boss52');
            e.type = 'boss53'; e.hp = 60000 * (1 + (gameTime/600)*0.2); e.maxHp=e.hp; e.phase = 3; e.speed = 1.2;
            if (DB.enemies.boss53) { e.width = DB.enemies.boss53.width || e.width; e.height = DB.enemies.boss53.height || e.height; e.size = DB.enemies.boss53.size || 70; } else { e.size = 70; }
            damageNumbers.push({x:e.x, y:e.y-80, val:"NIGHTMARE!", color:'#8e44ad', life:90});
            triggerScreenFlash('#00FFFF', 0.2, 0.2); return;
        }
        if (e.type === 'boss53') {
            e.dead = true; isEndlessMode = true; endlessStartTime = Date.now(); bossesSpawned.bossDead = true;
            if(window.showBossWarning) window.showBossWarning("SURVIVAL MODE STARTED");
            for(let k=0; k<5; k++) spawnChest(e.x + (k-2)*40, e.y, 'gold'); return;
        }

        e.dead = true; kills++; 
        if (window.Cloud && window.Cloud.unlockCodexEnemy) window.Cloud.unlockCodexEnemy(e.type);
        if(window.updateUI) window.updateUI();
        if(player.items['soul_stone']) { checkSoulStone(); if(window.updateInventoryUI) window.updateInventoryUI(); }

        if (e.isBoss) {
            let count = 3 + Math.floor(Math.random() * 3); 
            for(let k=0; k<count; k++) { let ox = (Math.random() - 0.5) * 100; let oy = (Math.random() - 0.5) * 100; spawnChest(e.x + ox, e.y + oy, 'gold'); }
            if (currentStage < 5) {
                let min = TILE_SIZE * 2; let max = WORLD_SIZE - TILE_SIZE * 2;
                let px, py; let safe = false; let attempts = 0;
                while(!safe && attempts < 50) {
                     px = min + Math.random() * (max - min); py = min + Math.random() * (max - min);
                     let tx = Math.floor(px/TILE_SIZE); let ty = Math.floor(py/TILE_SIZE);
                     if(worldMap[ty] && worldMap[ty][tx] !== 'mountains' && worldMap[ty][tx] !== 'monument4') safe = true;
                     attempts++;
                }
                spawnPortal(px, py, currentStage + 1);
                if(window.showBossWarning) window.showBossWarning('FIND THE PORTAL!');
                bossesSpawned.bossDead = true;
            }
        }
        monuments.forEach(m => {
            if (m.active) {
                let distEnemy = Math.hypot(e.x - m.x, e.y - m.y); let distPlayer = Math.hypot(player.x - m.x, player.y - m.y);
                if (distEnemy < m.radius && distPlayer < m.radius) { m.kills++; if(m.kills >= m.req) activateMonument(m); }
            }
        });
        if (e.isMiniBoss) {
            let count = 1 + Math.floor(Math.random() * 3); for(let k=0; k<count; k++) spawnChest(e.x + (k-1)*30, e.y, 'gold');
        } else if (!e.isBoss) {
            if (Math.random() < 0.008 * (1 + player.stats.luck * 0.1)) spawnChest(e.x, e.y, 'normal');
            if(Math.random() < 0.02) spawnDrop(e.x, e.y, 'heart'); else spawnDrop(e.x, e.y, Math.random()<0.3 ? 'gold' : 'xp');
        }
    }
}

// game/collision.js

function takeDamage(amount, sourceEnemy) {
    if(isGodMode) return; 

    // 1. Уклонение (работает как раньше + магазин)
let finalEvasion = Math.min(player.stats.evasion, 0.3);
    
    if (finalEvasion > 0 && Math.random() < finalEvasion) {
        damageNumbers.push({x:player.x, y:player.y-50, val: "MISS", color:'#ffff00', life:40});
        return; 
    }
    
    // 2. ШИПЫ (Thornmail + Cactus Juice)
    let baseThorn = 0;
    if (player.items['thornmail']) {
        let lvl = player.items['thornmail'];
        baseThorn = lvl * 0.10; // База от предмета
    }
    // СУММИРУЕМ: Предмет + Магазин (player.stats.thorns)
    let totalThorn = baseThorn + (player.stats.thorns || 0);

    if (sourceEnemy && totalThorn > 0) {
        dealDamage(sourceEnemy, amount * totalThorn, 'thornmail');
        // Визуал шипов
        projectiles.push({type:'slash', x:player.x, y:player.y, tx:sourceEnemy.x, ty:sourceEnemy.y, life:5, size:20, damage:0, hit:[], img:'thornmail1.png'}); 
    }

        // 1. Расчет защиты (Armor)
    let armorLevel = player.items['armor'] || 0;
    let itemReduction = armorLevel * 0.025; 
    let totalReduction = itemReduction + (player.stats.shopDefense || 0);
    
    // Кап защиты 90%
    if (totalReduction > 0.9) totalReduction = 0.9;

    // Б. Базовый урон с учетом брони
    let finalDmg = Math.max(1, amount * (1 - totalReduction));

    // В. ПРОКЛЯТИЯ (+25% Входящего урона каждое)
    // Mist Cloak (Плащ)
    if (player.cursedItems && player.cursedItems['mist_cloak']) {
        finalDmg *= 1.25; 
    }
    // Light Feather (Перо)
    if (player.cursedItems && player.cursedItems['light_feather']) {
        finalDmg *= 1.25; // Исправил: в database.js стоит 1.25 (было 1.20 в старом коде, привел к стандарту)
    }

    // Г. Хрупкость (Fragile) - урон x2
    if (player.fragileTimer > 0) finalDmg *= 2;

    // --- EPIC CURSES (Эффекты при ударе) ---
    
    // 1. Glass Cannon (Стан)
    if (player.cursedItems && player.cursedItems['glass_cannon']) {
        // Стан на 2 секунды (120 кадров)
        player.stunTimer = 120; 
        damageNumbers.push({x:player.x, y:player.y-70, val: "STUNNED!", color:'#e74c3c', life:90});
    }
    
    // 2. Golden Idol (Потеря золота)
    if (player.cursedItems && player.cursedItems['golden_idol']) {
        if (player.gold >= 100) {
            player.gold -= 100;
            damageNumbers.push({x:player.x, y:player.y-50, val: "-100 G", color:'#f1c40f', life:60});
        }
    }

    // Д. Применение урона
    let oldHp = player.hp;
    player.hp -= finalDmg;

    // Е. Визуал и UI
    if (player.hp < oldHp) {
        if(window.triggerHitFlash) window.triggerHitFlash(); 
        if(window.updateUI) window.updateUI(); 
    }
    
    // Ж. Феникс (Воскрешение)
    if(player.hp <= 0 && player.items['phoenix']) {
        player.hp = player.maxHp * 0.5; 
        delete player.items['phoenix']; 
        if(window.updateInventoryUI) window.updateInventoryUI();
        enemies.forEach(e => dealDamage(e, 9999)); 
        damageNumbers.push({x:player.x, y:player.y-60, val: "PHOENIX REBIRTH!", color:'#e67e22', life:120});
        visualEffects.push({ type: 'vampire_wave', x: player.x, y: player.y, radius: 10, maxRadius: 500, alpha: 1.0, life: 60 });
        return; 
    }
    
    

    if(player.hp<=0) {
        if (window.RTDB && window.RTDB.currentBattleId) return;

        if(window.showGameOver) window.showGameOver();
    }
}
// game/spawner.js

// --- СПАВН ПРЕДМЕТОВ И ОБЪЕКТОВ ---

function spawnDrop(x, y, t) { 
    // Настраиваем время жизни
    let lifeTime = 600; // Дефолт (10 сек)
    
    // ПРОКЛЯТИЕ: КОШЕЛЬ (Золото исчезает за 3 сек)
    if (t === 'gold' && player.cursedItems && player.cursedItems['coin_purse']) {
        lifeTime = 180; // 3 секунды
    }
    
    drops.push({ x: x, y: y, type: t, life: lifeTime }); 
}

function spawnChest(x, y, type) {
    chests.push({ x: x, y: y, type: type, cost: type==='normal' ? currentChestCost : 0 });
}

function spawnAnvil() {
    let min = TILE_SIZE * 2;
    let max = WORLD_SIZE - TILE_SIZE * 2;
    let ax, ay;
    let safe = false;
    let attempts = 0;
    
    while(!safe && attempts < 50) {
         ax = min + Math.random() * (max - min);
         ay = min + Math.random() * (max - min);
         let tx = Math.floor(ax/TILE_SIZE);
         let ty = Math.floor(ay/TILE_SIZE);
         if(worldMap[ty] && worldMap[ty][tx] !== 'mountains' && worldMap[ty][tx] !== 'monument4') safe = true;
         attempts++;
    }
    anvils.push({ x: ax, y: ay, active: true });
    if(window.showBossWarning) window.showBossWarning("cursed_anvil_title");
}

function spawnMonument() {
    let mx = (Math.random() * (WORLD_SIZE - 400)) + 200;
    let my = (Math.random() * (WORLD_SIZE - 400)) + 200;
    
    let hp = monumentReq; 
    if (currentStage >= 4) hp *= 2;

    monuments.push({ x: mx, y: my, active: true, kills: 0, req: hp, radius: 250 });
}

function spawnPortal(x, y, nextStage) {
    portals.push({ x: x, y: y, nextStage: nextStage, life: 999999 });
}

// game/spawner.js

function spawnMerchant() {
    // 1. Задаем границы поиска (отступаем от стен)
    let min = TILE_SIZE * 2;
    let max = WORLD_SIZE - TILE_SIZE * 2;
    let tx, ty;
    let safe = false;
    let attempts = 0;
    
    // 2. Ищем случайную точку, пока не найдем "не гору"
    while(!safe && attempts < 50) {
         tx = min + Math.random() * (max - min);
         ty = min + Math.random() * (max - min);
         
         // Проверяем тайл на карте
         let mapX = Math.floor(tx / TILE_SIZE);
         let mapY = Math.floor(ty / TILE_SIZE);
         
         // Если тайл существует и это не горы — ставим
         if(worldMap[mapY] && worldMap[mapY][mapX] !== 'mountains') safe = true;
         attempts++;
    }

    // Если за 50 попыток не нашли (вряд ли), ставим в центр
    if (!safe) { tx = WORLD_SIZE/2; ty = WORLD_SIZE/2; }

    traders.push({
        x: tx, y: ty,
        type: 'merchant',
        active: true,
        purchases: 0 
    });
    
    damageNumbers.push({x: tx, y: ty - 50, val: "MERCHANT ARRIVED!", color: '#f1c40f', life: 120}); 
    if(window.showBossWarning) window.showBossWarning("shop_title"); 
}

// --- СПАВН ВРАГОВ ---

function spawnEnemy(forceType = null, forceX = null, forceY = null) {
    // 1. Лимит мобов (+25 за этап)
    let baseLimit = 200 + (currentStage - 1) * 25;
    if (currentStage === 5) baseLimit = 400; 

    let limit = Math.floor(baseLimit * (1 + player.stats.curse));

    if (enemies.length >= limit && !forceType) return;
    if (currentStage === 3 && bossesSpawned.waitingForBoss && !forceType) return;
    if (currentStage === 3 && bossesSpawned.boss && !bossesSpawned.bossDead && !forceType) return; 
    if (currentStage === 5 && !isEndlessMode && !forceType) return;

    let x, y;
    if (forceX !== null && forceY !== null) {
        x = forceX; y = forceY;
    } else {
        let a=Math.random()*Math.PI*2, r=Math.max(window.innerWidth, window.innerHeight)/2+50;
        x=player.x+Math.cos(a)*r; y=player.y+Math.sin(a)*r;
        let wallBuffer = TILE_SIZE + 60; 
        x = Math.max(wallBuffer, Math.min(WORLD_SIZE - wallBuffer, x)); 
        y = Math.max(wallBuffer, Math.min(WORLD_SIZE - wallBuffer, y));
    }
    
    let timeInStage = gameTime - stageStartTime; 
    if (isEndlessMode) timeInStage = (Date.now() - endlessStartTime) / 1000;

    let timeMulti = 1 + (timeInStage / 120) * 0.05; 
    let curseMulti = 1 + player.stats.curse;
    let stageMulti = 1 + (currentStage - 1) * 0.25; 
    if (isEndlessMode) stageMulti = 2.0 + (timeInStage / 60) * 0.1;

    let finalMulti = timeMulti * curseMulti * stageMulti;
    let speedMulti = 1.0;

    let type = 'skeleton';
    let size = 16; 
    let hpBase = 20;
    let dmgBase = 10;
    let shootType = null; 

    // --- ЛОГИКА ВЫБОРА ТИПА ВРАГА ---
    if (forceType) {
        type = forceType;
        if (type === 'firesliz3') { hpBase=80; speedMulti=4.5; size=18; dmgBase=20; }
        if (type === 'abysswraith5') { hpBase=500; speedMulti=3.0; size=30; dmgBase=30; shootType='shadow_bolt'; } 
        if (type === 'rifttitan5')   { hpBase=1200; speedMulti=1.2; size=50; dmgBase=50; } 
        if (type === 'voidharbinger5'){ hpBase=2000; speedMulti=2.2; size=40; dmgBase=70; } 
    }
    else if (currentStage === 5 && isEndlessMode) {
        if (timeInStage < 180) {
            type = 'abysswraith5'; hpBase=500; speedMulti=3.0; size=30; dmgBase=30; shootType='shadow_bolt';
        } else if (timeInStage < 360) {
            type = Math.random() < 0.6 ? 'abysswraith5' : 'rifttitan5';
            if (type === 'rifttitan5') { hpBase=1200; speedMulti=1.2; size=36; dmgBase=50; }
            else { hpBase=500; speedMulti=3.0; shootType='shadow_bolt'; size=40; } 
        } else if (timeInStage < 540) {
             let r = Math.random();
             if (r < 0.4) { type='abysswraith5'; hpBase=500; shootType='shadow_bolt'; size=40; }
             else if (r < 0.7) { type='rifttitan5'; hpBase=1200; size=36; }
             else { type='voidharbinger5'; hpBase=2000; speedMulti=2.2; dmgBase=70; size=40; }
        } else {
             let pool = ['abysswraith5', 'rifttitan5', 'voidharbinger5', 'shardgolem4', 'crystalserpent4'];
             type = pool[Math.floor(Math.random() * pool.length)];
             hpBase = 1000; dmgBase=50; size=40;
             if(type.includes('serpent')) shootType='crystal_shard';
             if(type.includes('wraith')) shootType='shadow_bolt';
        }
    }
    else if (currentStage === 4) {
        if (stageTime > 420) {
             type = 'crystalserpent4'; hpBase=200; speedMulti=3.5; size=25; dmgBase=20; shootType='crystal_shard';
        } else if (stageTime > 240) {
             type = Math.random() < 0.5 ? 'crystalserpent4' : 'crystalstrider4';
             if(type==='crystalstrider4') { hpBase=350; speedMulti=2.5; size=30; dmgBase=25; shootType='crystal_orb'; }
             else { hpBase=200; speedMulti=3.5; size=25; shootType='crystal_shard'; }
        } else {
             let r = Math.random();
             if(r < 0.4) { type='crystalserpent4'; hpBase=200; size=25; shootType='crystal_shard'; }
             else if(r < 0.7) { type='crystalstrider4'; hpBase=350; size=30; shootType='crystal_orb'; }
             else { 
                 type = 'shardgolem4'; hpBase=800; speedMulti=1.0; size=40; dmgBase=40; 
             }
        }
    }
    else if (currentStage === 3) {
        type = 'firegolem3'; hpBase = 120; dmgBase = 40; size = 26; speedMulti = 0.65;
        if (stageTime < 420 && Math.random() < 0.3) {
             type = 'firesliz3'; hpBase = 80; speedMulti = 3.5; size = 18; dmgBase = 20;
        }
    }
    else if (currentStage === 2) {
        type = 'firezombie2'; hpBase = 35; speedMulti = 0.65; size = 20;
        if (stageTime < 420 && Math.random() > 0.7) { 
            type = 'sandgolem2'; hpBase = 90; size = 30; speedMulti = 0.5; dmgBase = 30; 
        }
        if (stageTime < 240 && Math.random() > 0.8) { 
            type = 'owl2'; shootType = 'owl'; hpBase = 25; speedMulti = 0.9; 
        }
    } 
    else {
        if (stageTime < 420) {
            type = Math.random() < 0.6 ? 'zombie' : 'skeleton'; 
        }
    }

    let hpGrowth = timeInStage / 10;
    let speedAdjustment = 1.0;
    if (currentStage === 4) speedAdjustment = 1.1;
    if (currentStage === 5) speedAdjustment = 1.2;

    let finalSpeed = (type === 'firesliz3' || type.includes('serpent') || type.includes('wraith')) 
        ? speedMulti * speedAdjustment
        : ((1 + Math.random()) * finalMulti * speedMulti * speedAdjustment) * 0.9;

    let dbData = (DB.enemies && DB.enemies[type]) ? DB.enemies[type] : {};

    enemies.push({
        x:x, y:y, type: type,
        hp: (hpBase + hpGrowth) * finalMulti,
        maxHp: (hpBase + hpGrowth) * finalMulti,
        speed: finalSpeed,
        damage: dmgBase * finalMulti,
        size: size, 
        
        width: dbData.width || null,   
        height: dbData.height || null, 
        role: dbData.role || 'mob',
        dead: false,
        attackCooldown: 0, shootType: shootType, shootCooldown: 0,
        frozen: false 
    });
}

function spawnBoss() { 
    let hpBase = 5000; 
    let type = 'boss'; 
    let size = 55; 
    
    if (currentStage === 2) { type = 'boss2'; hpBase = 12000; } 
    else if (currentStage === 3) { type = 'boss31'; hpBase = 25000; }
    else if (currentStage === 4) { type = 'boss4'; hpBase = 70000; size=65; } 
    else if (currentStage === 5) { 
        type = 'boss51'; hpBase = 50000; size=70; bossPhase = 1; 
    }

    let timeScale = 1 + (gameTime / 600) * 0.2; 
    let dbData = (DB.enemies && DB.enemies[type]) ? DB.enemies[type] : {};

    enemies.push({
        x: player.x + 400, y: player.y, type: type, 
        hp: hpBase * timeScale, maxHp: hpBase * timeScale, 
        damage: dbData.damage || 20, 
        speed: type.includes('boss5') ? 1.5 : 2.2, 
        
        size: dbData.size || size, 
        width: dbData.width || null,
        height: dbData.height || null,
        hitboxSize: dbData.hitboxSize || null,
        role: dbData.role || 'boss',
        dead: false, isBoss: true,
        attackCooldown: 0, shootCooldown: 0, phase: bossPhase,
        
        meteorTimer: 240, 
        lavaTimer: 600,   
        summonTimer: 480,
        fragileTimer: 0
    }); 
    
    if(window.showBossWarning) window.showBossWarning('boss_warn');
}

function spawnMiniBoss(type) {
    let dbData = (DB.enemies && DB.enemies[type]) ? DB.enemies[type] : {};
    let a = Math.random() * Math.PI * 2; let r = 500;
    let mx = player.x + Math.cos(a) * r; let my = player.y + Math.sin(a) * r;
    
    let hp = 1500 * (1 + gameTime/600) * currentStage;
    if (currentStage === 4) hp *= 1.5;

    let mbSize = 45;      
    let mbWidth = 70;     
    let mbHeight = 70;    

    const customSizes = {
        'crystalserpent4': { size: 55, width: 120, height: 130 }, 
        'crystalstrider4': { size: 50, width: 100, height: 105 },  
        'shardgolem4':     { size: 60, width: 100, height: 125 },  
        'firegolem3':      { size: 50, width: 90, height: 100 },
        'firesliz3':       { size: 40, width: 80, height: 100 },
        'firezombie2':      { size: 55, width: 80, height: 120 },
        'sandgolem2':       { size: 45, width: 100, height: 100 }, 
        'skeleton':        { size: 45, width: 65, height: 97 }, 
        'zombie':          { size: 45, width: 65, height: 100 }
    };

    if (customSizes[type]) {
        mbSize = customSizes[type].size;
        mbWidth = customSizes[type].width;
        mbHeight = customSizes[type].height;
    }

    let shootType = null;
    if (type.includes('serpent')) shootType = 'crystal_shard';
    if (type.includes('strider')) shootType = 'crystal_orb';
    if (type.includes('owl')) shootType = 'owl';
    if (type.includes('wraith')) shootType = 'shadow_bolt';

    enemies.push({
        x:mx, y:my, type: type, hp: hp, maxHp: hp, speed: 2.0, 
        size: mbSize, width: mbWidth, height: mbHeight,
        role: dbData.role || 'miniboss',
        dead: false, 
        isMiniBoss: true, damage: 25 * currentStage, attackCooldown: 0,
        shootType: shootType, 
        shootCooldown: 60
    });
}

function spawnEnemyProjectile(x, y, vx, vy, type, sizeOverride = null, widthOverride = null, heightOverride = null) {
    let img = 'owlattack2.png'; 
    let dmg = 15 * currentStage; 
    let pW = 30; let pH = 30; let pSize = 14; 
    let speed = 4; 
    let isStun = false;
    let isFragile = false; 
    let lifeTime = 180; 

    if (type === 'boss31' || type === 'boss32') { 
        img = type==='boss31'?'boss31attack1.png':'boss32attack2.png'; 
        dmg = type==='boss31'?40:50; speed = type==='boss31'?6:7; 
        pSize = type==='boss31' ? 40 : 40; 
        pW = type==='boss31' ? 77 : 80; pH = type==='boss31' ? 27 : 35; 
    }
    else if (type === 'explosion') {
        img = 'meteor_explosion.png'; dmg = 50; speed = 0; 
        pSize = 80; pW = 120; pH = 120; 
    }
    else if (type === 'boss4') {
        img = 'boss4crystal.png'; dmg = 50; speed = 6; isFragile = true;
        pSize = 25; pW = 45; pH = 33;
    }
    else if (type === 'boss51') {
        img = 'boss51voidorb.png'; dmg = 40; speed = 7; lifeTime = 600; 
        pSize = 25; pW = 40; pH = 40;
    }
    else if (type === 'boss52') {
        img = 'boss52voidlaser.png'; dmg = 60; speed = 10; 
        pSize = 60; pW = 105; pH = 45;  
    }
    else if (type === 'boss53') {
        img = 'boss51voidorb.png'; dmg = 50; speed = 5; 
        pSize = 15; pW = 20; pH = 20;
    }
    else if (type === 'boss53_laser') {
        img = 'boss52voidlaser.png'; dmg = 45; speed = 8;
        pSize = 30; pW = 55; pH = 15;
    }
    else if (type === 'boss2') { 
        img = 'boss2_attack.png'; dmg = 30; speed = 6; isStun = true; 
        pSize = 20; pW = 30; pH = 18;
    } 
    else if (type === 'owl' || type === 'owl2') {
        img = 'owlattack2.png'; pSize = 15; pW = 25; pH = 12;
    }
    else if (type === 'crystalserpent4' || type === 'crystal_shard') { 
        img = 'crystal_shard4.png'; dmg=20; speed=5; 
        pSize = 15; pW = 25; pH = 13;
    }
    else if (type === 'crystalstrider4' || type === 'crystal_orb') { 
        img = 'crystal_orb4.png'; dmg=25; speed=4; 
        pSize = 12; pW = 20; pH = 20;
    }
    else if (type === 'abysswraith5' || type === 'shadow_bolt') { 
        img = 'shadow_bolt5.png'; dmg=30; speed=6; 
        pSize=18; pW=23; pH=12;
    }

    if (sizeOverride) pSize = sizeOverride;
    if (widthOverride) pW = widthOverride;
    if (heightOverride) pH = heightOverride;
    if (sizeOverride && !widthOverride) { pW = sizeOverride; pH = sizeOverride; }

    enemyProjectiles.push({ 
        x: x, y: y, vx: vx * speed, vy: vy * speed, 
        life: lifeTime, width: pW, height: pH, size: pSize, 
        damage: dmg, img: img,
        isStun: isStun, isFragile: isFragile,
        homing: (type === 'boss51') 
    });
}
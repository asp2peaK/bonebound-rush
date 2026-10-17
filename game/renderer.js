// game/renderer.js

// --- ИНИЦИАЛИЗАЦИЯ CANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ФУНКЦИЯ РЕСАЙЗА (ФИКС ЧЕРНЫХ ПОЛОС)
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- ЗАГРУЗКА КАРТИНОК И СПРАЙТОВ ---
const IMAGES = {};

const mapImages = { 
    chest: 'chest1.png', goldenchest: 'goldenchest1.png', 
    chest2: 'chest2.png', goldenchest2: 'goldenchest2.png', 
    chest3: 'chest3.png', goldenchest3: 'goldenchest3.png', 
    
    // --- STAGE 4 & 5 MAP ---
    crystground4: 'crystground4.png', crystsurface4: 'crystsurface4.png',
    abysslight5: 'abysslight5.png', obsground5: 'obsground5.png',
    
    chest4: 'chest4.png', goldenchest4: 'goldenchest4.png',
    chest5: 'chest5.png', goldenchest5: 'goldenchest5.png',
    
    monument4: 'monument4.png', monument5: 'monument5.png',
    tp34: 'tp34.png', tp45: 'tp45.png',

    grass: 'grass1.png', ground: 'ground1.png', 
    sand: 'sand2.png', cobblegrass: 'cobblegrass2.png', plitka: 'plitka2.png',
    lava: 'lava3.png', volcanocobl: 'volcanocobl3.png',
    
    monument: 'monument1.png', mountains: 'mountains1.png', 
    monument2: 'monument2.png', monument3: 'monument3.png', 

    gold: 'gold1.png', xp: 'xp1.png', heart: 'heart1.png',
    tp12: 'tp12.png', tp23: 'tp23.png',
    
    friend_mountain: 'friend_mountain1.png',
    cursedanvil: 'cursedanvil.png',
    torgovec: 'torgovec.png'
};

const effectImages = { 
    garlicyo: 'garlicyo1.png', holywaterground: 'holywaterground1.png', 
    mageattack: 'mageattack1.png',
    boss2_attack: 'boss2_attack.png',
    boss31attack: 'boss31attack1.png',
    boss32attack: 'boss32attack2.png',
    owlattack: 'owlattack2.png',
    zap_effect: 'zap_effect1.png',
    warning_circle: 'warning_circle.png',
    meteor_explosion: 'meteor_explosion.png',
    lava_crack: 'lava_crack.png',
    crystal_shard4: 'crystal_shard4.png',
    crystal_orb4: 'crystal_orb4.png',
    boss4crystal: 'boss4crystal.png',
    boss51voidorb: 'boss51voidorb.png',
    boss52voidlaser: 'boss52voidlaser.png',
    boss52expl: 'boss52expl.png',
    shadow_bolt5: 'shadow_bolt5.png',

    // --- НОВЫЕ ЭФФЕКТЫ (ЭТАП 2) ---
    fireball: 'fireball.png',
    fireball_explosion: 'fireball_explosion.png',
    fire_ground: 'fire_ground.png',
    katana_slash: 'katana_slash.png',
    mine_explosion: 'mine_explosion.png'
};

const weaponImages = { sword: 'knightssword1.png', wand: 'mageposoh1.png', axe: 'axe1.png', knife: 'knife1.png', bible: 'bible1.png', spear: 'spear1.png', holywater: 'holywater1.png', garlic: 'cesnok1.png', cross: 'cross1.png',
    // --- НОВЫЕ ОРУЖИЯ (ЭТАП 2) ---
    frost_orb: 'frost_orb.png',
    fire_scroll: 'fire_scroll.png',
    katana: 'katana.png',
    landmines: 'mine.png' // Используем mine.png как иконку для Landmines
 };

const itemImages = { 
    plesen: 'plesen1.png', fireaura: 'fireaura1.png', magnet: 'magnite1.png', zap: 'zap1.png', armor: 'armor1.png', clover: 'clover1.png', spinach: 'spinach1.png', crown: 'crown1.png', boots: 'boots1.png', gloves: 'gloves1.png', candle: 'candle1.png', ring: 'ring1.png', mask: 'mask1.png', wings: 'wings1.png',
    hollow_heart: 'hollowheart1.png', bracer: 'bracer1.png', skull_ring: 'skullring1.png', stopwatch: 'stopwatch1.png', thornmail: 'thornmail1.png', phoenix: 'phoenix1.png',
    soul_stone: 'soulstone1.png', soul_stone2: 'soulstone2.png', soul_stone3: 'soulstone3.png', soul_stone4: 'soulstone4.png', soul_stone5: 'soulstone5.png'
};

function loadSimple(obj, prefix) {
    for (let k in obj) {
        let img = new Image();
        img.src = prefix + obj[k];
        IMAGES[k] = img;         
        IMAGES[obj[k]] = img;    
    }
}

function loadCharacter(type, folderPath, baseName) {
    IMAGES[type] = new Image(); IMAGES[type].src = folderPath + baseName + '.png';
    ['right', 'up', 'down'].forEach(dir => { 
        let key = type + '_' + dir; 
        IMAGES[key] = new Image(); 
        IMAGES[key].src = folderPath + baseName + '_' + dir + '.png'; 
    });
}

loadSimple(mapImages, 'sprites/map/');
loadSimple(effectImages, 'sprites/effects/');
loadSimple(weaponImages, 'sprites/weapons/');
loadSimple(itemImages, 'sprites/items/');

// ЗАГРУЗКА ПЕРСОНАЖЕЙ
loadCharacter('knight', 'sprites/characters/knight/', 'knight1');
loadCharacter('mage',   'sprites/characters/mage/',   'mage1');
loadCharacter('thief',  'sprites/characters/thief/',  'thief');
loadCharacter('butcher', 'sprites/characters/butcher/', 'butcher1'); 
loadCharacter('alchemist', 'sprites/characters/alchemist/', 'alchemist1');
loadCharacter('spartan',   'sprites/characters/spartan/',   'spartan1');
loadCharacter('nun',       'sprites/characters/nun/',       'nun1');
loadCharacter('exorcist',  'sprites/characters/exorcist/',  'exorcist1');
loadCharacter('preacher',  'sprites/characters/preacher/',  'preacher1');

// ВРАГИ
loadCharacter('skeleton', 'sprites/enemy/skeleton/',  'skeleton1');
loadCharacter('zombie',   'sprites/enemy/zombie/',    'zombie1');
loadCharacter('boss',     'sprites/enemy/boss1/',      'boss1');
loadCharacter('firezombie2', 'sprites/enemy/firezombie2/', 'firezombie2');
loadCharacter('sandgolem2', 'sprites/enemy/sandgolem2/', 'sandgolem2');
loadCharacter('owl2', 'sprites/enemy/owl2/', 'owl2');
loadCharacter('boss2', 'sprites/enemy/boss2/', 'boss2');
loadCharacter('firegolem3', 'sprites/enemy/firegolem3/', 'firegolem3');
loadCharacter('boss31', 'sprites/enemy/boss31/', 'boss31');
loadCharacter('boss32', 'sprites/enemy/boss32/', 'boss32');
loadCharacter('firesliz3', 'sprites/enemy/firesliz3/', 'firesliz3'); 
loadCharacter('crystalserpent4', 'sprites/enemy/crystalserpent4/', 'crystalserpent4');
loadCharacter('crystalstrider4', 'sprites/enemy/crystalstrider4/', 'crystalstrider4');
loadCharacter('shardgolem4',     'sprites//enemy/shardgolem4/',     'shardgolem4');
loadCharacter('boss4',           'sprites/enemy/boss4/',           'boss4');
loadCharacter('boss51',          'sprites/enemy/boss51/',          'boss51');
loadCharacter('boss52',          'sprites/enemy/boss52/',          'boss52');
loadCharacter('boss53',          'sprites/enemy/boss53/',          'boss53');
loadCharacter('abysswraith5',    'sprites/enemy/abysswraith5/',    'abysswraith5');
loadCharacter('rifttitan5',      'sprites/enemy/rifttitan5/',      'rifttitan5');
loadCharacter('voidharbinger5',  'sprites/enemy/voidharbinger5/',  'voidharbinger5');


// --- ОСНОВНАЯ ФУНКЦИЯ ОТРИСОВКИ ---
function draw() {
// 1. ОЧИСТКА В МЕНЮ (ЧТОБЫ НЕ ПРОСВЕЧИВАЛО)
    if (gameState === 'MENU' || gameState === 'SETTINGS' || gameState === 'CHAR_SELECT' || gameState === 'GAMEOVER' || 
        gameState === 'PVP_MENU' || gameState === 'MATCHMAKING' || gameState === 'LOBBY' || gameState === 'RANKED_HUB') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Рисуем черный фон поверх всего, чтобы точно ничего не просвечивало
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // 2. Очистка перед кадром игры
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Очистка перед кадром игры
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let sc = Math.floor(camera.x/TILE_SIZE), ec = sc+(canvas.width/TILE_SIZE)+1;
    let sr = Math.floor(camera.y/TILE_SIZE), er = sr+(canvas.height/TILE_SIZE)+1;
    for(let y=sr;y<=er;y++) for(let x=sc;x<=ec;x++) {
        if(y>=0&&y<MAP_TILES&&x>=0&&x<MAP_TILES) {
            let t=worldMap[y][x], px=x*TILE_SIZE-camera.x, py=y*TILE_SIZE-camera.y;
            if(IMAGES[t] && IMAGES[t].complete) ctx.drawImage(IMAGES[t],px,py,TILE_SIZE,TILE_SIZE);
            else { ctx.fillStyle='#222'; ctx.fillRect(px,py,TILE_SIZE,TILE_SIZE); }
        }
    }
    
    // НАЗЕМНЫЕ ЭФФЕКТЫ (ЛАВА)
    if (typeof enemyGroundEffects !== 'undefined') {
        enemyGroundEffects.forEach(p => {
            let img = IMAGES[p.img]; 
            if(img && img.complete) {
                ctx.globalAlpha = 0.9;
                ctx.drawImage(img, p.x - p.size - camera.x, p.y - p.size - camera.y, p.size * 2, p.size * 2);
                ctx.globalAlpha = 1.0;
            } else {
                 ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
                 ctx.fillRect(p.x - p.size - camera.x, p.y - p.size - camera.y, p.size * 2, p.size * 2);
            }
        });
    }

    firePools.forEach(p=>{
        ctx.globalAlpha=0.7; 
        let imgKey = p.img || 'holywaterground'; 
        if(IMAGES[imgKey] && IMAGES[imgKey].complete) {
            ctx.drawImage(IMAGES[imgKey], p.x-p.size-camera.x, p.y-p.size-camera.y, p.size*2, p.size*2);
        }
        ctx.globalAlpha=1;
    });

    // МОНУМЕНТЫ
    monuments.forEach(m => {
        if(!m.active) return;
        let px=m.x-camera.x, py=m.y-camera.y;
        ctx.strokeStyle=`rgba(255,255,255,0.3)`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px,py,m.radius,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle="white"; ctx.font="bold 20px Arial"; ctx.fillText(`${m.kills}/${m.req}`, px-20, py-50);
        
        let monImg = IMAGES.monument;
        if(currentStage === 2 && IMAGES.monument2) monImg = IMAGES.monument2;
        if(currentStage === 3 && IMAGES.monument3) monImg = IMAGES.monument3;
        if(currentStage === 4 && IMAGES.monument4) monImg = IMAGES.monument4;
        if(currentStage === 5 && IMAGES.monument5) monImg = IMAGES.monument5;
        
        if(monImg && monImg.complete) ctx.drawImage(monImg, px-32, py-32, 64, 64);
    });

    // ПОРТАЛЫ
    portals.forEach(p => {
        let imgKey = 'tp12';
        if (p.nextStage === 3) imgKey = 'tp23';
        if (p.nextStage === 4) imgKey = 'tp34';
        if (p.nextStage === 5) imgKey = 'tp45';

        if (IMAGES[imgKey] && IMAGES[imgKey].complete) {
            let sz = 128;
            ctx.save();
            ctx.shadowBlur = 20 + Math.sin(Date.now()/200)*10;
            let shadow = '#f1c40f'; 
            if(p.nextStage === 3) shadow = '#e74c3c';
            if(p.nextStage === 4) shadow = '#9b59b6';
            if(p.nextStage === 5) shadow = '#34495e';
            ctx.shadowColor = shadow;
            
            ctx.drawImage(IMAGES[imgKey], p.x - sz/2 - camera.x, p.y - sz/2 - camera.y, sz, sz);
            ctx.restore();

            ctx.globalAlpha = 0.5 + Math.sin(Date.now()/200) * 0.2;
            ctx.fillStyle = '#00FFFF';
            ctx.font = 'bold 20px Arial';
            ctx.fillText("PORTAL", p.x - 40 - camera.x, p.y - 70 - camera.y);
            ctx.globalAlpha = 1.0;
        }
    });

    drops.forEach(d => {
        let img = IMAGES[d.type];
        if(img && img.complete) ctx.drawImage(img, d.x-12-camera.x, d.y-12-camera.y, 24, 24);
        else {
            ctx.fillStyle = d.type==='heart'?'red':'gold';
            ctx.beginPath(); ctx.arc(d.x-camera.x, d.y-camera.y, 10, 0, Math.PI*2); ctx.fill();
        }
    });
    
    // СУНДУКИ
    chests.forEach(c => {
        let base = c.type==='normal'?'chest':'goldenchest';
        if(currentStage === 2) base += '2';
        if(currentStage === 3) base += '3';
        if(currentStage === 4) base += '4';
        if(currentStage === 5) base += '5';
        
        let img = IMAGES[base] || IMAGES[c.type==='normal'?'chest':'goldenchest'];

        let sz = 64;
        if (currentStage >= 4) sz = 48; 
        ctx.globalAlpha = 0.8 + Math.sin(Date.now()/300)*0.2;
        if(img && img.complete) ctx.drawImage(img, c.x-sz/2-camera.x, c.y-sz/2-camera.y, sz, sz);
        ctx.globalAlpha = 1.0;
        if(c.type==='normal') {
            ctx.fillStyle = player.gold>=c.cost ? '#2ecc71' : '#e74c3c';
            ctx.font="bold 16px Arial"; ctx.fillText(`${c.cost} G`, c.x-20-camera.x, c.y-40-camera.y);
        }
    });

    // НАКОВАЛЬНИ
    if (typeof anvils !== 'undefined') {
        anvils.forEach(a => {
            let img = IMAGES['cursedanvil'];
            if (img && img.complete) {
                let sz = 64; 
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#39ff14'; 
                ctx.drawImage(img, a.x - sz/2 - camera.x, a.y - sz/2 - camera.y, sz, sz);
                ctx.restore();
            } else {
                ctx.fillStyle = '#39ff14';
                ctx.fillRect(a.x - 30 - camera.x, a.y - 30 - camera.y, 60, 60);
            }
        });
    }

    // ТОРГОВЕЦ
    if (typeof traders !== 'undefined') {
        traders.forEach(t => {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.ellipse(t.x - camera.x, t.y + 40 - camera.y, 40, 15, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();

            let img = IMAGES['torgovec'];
            if (img && img.complete) {
                let sz = 110;
                ctx.save(); 
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#f1c40f'; 
                ctx.drawImage(img, t.x - sz/2 - camera.x, t.y - sz/2 - camera.y, sz, sz);
                ctx.restore(); 
            } else {
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(t.x - 30 - camera.x, t.y - 30 - camera.y, 60, 60);
            }
        });
    }
    enemies.sort((a, b) => a.y - b.y);
    // ВРАГИ
// ВРАГИ
    enemies.forEach(e => {
        let scale = 1.0;
        if (e.isBoss) scale = 1.4;      
        else if (e.isMiniBoss) scale = 1.2; 
        
        let sz = e.size * scale;
        
        // 1. Сохраняем контекст перед отрисовкой спрайта
        ctx.save(); 

        // 2. Применяем фильтр, если враг заморожен
        if (e.freezeTimer > 0) {
            // Синий оттенок и насыщенность
            ctx.filter = 'hue-rotate(180deg) saturate(200%) brightness(1.2)'; 
        }

        let spriteKey = getSpriteKey(e.type, e.direction);
        let img = IMAGES[spriteKey];
        if (!img || !img.complete) img = IMAGES[e.type];
        if (!img || !img.complete) img = IMAGES['zombie'];

        if (img && img.complete) {
            let ratio = img.naturalWidth / img.naturalHeight;
            let drawW = sz * 2;
            let drawH = sz * 2;
            
            if(ratio > 1) {
                drawH = drawW / ratio;
            } else {
                drawW = drawH * ratio;
            }
            // Рисуем спрайт (с учетом фильтра)
            ctx.drawImage(img, e.x - camera.x - drawW/2, e.y - camera.y - drawH/2, drawW, drawH);
        } else {
            // Если спрайта нет, красим круг в голубой (если заморожен) или стандартный цвет
            ctx.fillStyle = e.freezeTimer > 0 ? '#00ffff' : (e.isMiniBoss ? '#8e44ad' : '#e74c3c');
            ctx.beginPath();
            ctx.arc(e.x-camera.x, e.y-camera.y, sz, 0, Math.PI*2);
            ctx.fill();
        }

        // 3. Восстанавливаем контекст (чтобы фильтр не влиял на HP бар)
        ctx.restore(); 

        if(e.isBoss || e.isMiniBoss) { 
            ctx.fillStyle='red'; 
            ctx.fillRect(e.x-30-camera.x, e.y-sz-10-camera.y, 60, 6); 
            ctx.fillStyle='#0f0'; 
            ctx.fillRect(e.x-30-camera.x, e.y-sz-10-camera.y, 60*(e.hp/e.maxHp), 6); 
        }
    });
    
    // ИГРОК
    let playerSpriteKey = getSpriteKey(player.type, player.direction);
    let pImg = (IMAGES[playerSpriteKey] && IMAGES[playerSpriteKey].complete) ? IMAGES[playerSpriteKey] : IMAGES[player.type];
    
    let px = player.x - camera.x;
    let py = player.y - camera.y;

    if(pImg) {
        let pRatio = pImg.naturalWidth / pImg.naturalHeight;
        let pW = 48; 
        let pH = 48; 
        
        if (player.type === 'butcher') { pW *= 1.15; pH *= 1.3; } 
        else if (player.type === 'spartan') { pW *= 1.05; pH *= 1.2; }
        else if (player.type === 'thief') { pW *= 0.75; pH *= 0.85; }
        else if (player.type === 'mage') { pW *= 0.85; pH *= 1.0; }
        else if (player.type === 'knight') { pW *= 1.0; pH *= 1.0; }
        else if (player.type === 'preacher') { pW *= 0.95; pH *= 1.0; }
        else if (player.type === 'exorcist') { pW *= 0.8; pH *= 1.1; }
        else if (['alchemist', 'nun',].includes(player.type)) { pW *= 0.95; pH *= 1.1; }
        
        // ЭФФЕКТ ХРУПКОСТИ (FRAGILITY)
        if (player.fragileTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(10) grayscale(100%)'; 
            ctx.drawImage(pImg, px - pW/2, py - pH/2, pW, pH);
            ctx.restore();
        } else {
            ctx.drawImage(pImg, px - pW/2, py - pH/2, pW, pH);
        }
        
        // PRESS E
        if (player.nearPortal || player.nearAnvil || player.nearMerchant) {
            ctx.save();
            if (player.nearMerchant) { ctx.fillStyle = "#f1c40f"; } 
            else if (player.nearAnvil) { ctx.fillStyle = "#9b59b6"; } 
            else { ctx.fillStyle = "white"; }

            ctx.font = "bold 20px Arial"; 
            ctx.strokeStyle = "black"; 
            ctx.lineWidth = 3;
            ctx.textAlign = "center"; 
            
            let txt = "PRESS E";
            if (player.nearMerchant) { txt = "E - SHOP"; } 
            else if (player.nearAnvil) { txt = t('press_e_anvil'); } 
            else { txt = (currentLang === 'ru' ? "Жми E" : "Press E"); }
            if (!txt) txt = "PRESS E"; 

            ctx.strokeText(txt, px, py - 60); 
            ctx.fillText(txt, px, py - 60);
            ctx.restore();
        }
        
        if (player.healFlashTimer > 0) {
            ctx.save(); ctx.fillStyle = 'rgba(46, 204, 113, 0.5)'; ctx.beginPath(); ctx.arc(px, py, 35, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }
        if (player.stunTimer > 0) {
            ctx.save(); ctx.strokeStyle = '#00FFFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 30, 0, Math.PI*2); ctx.stroke(); ctx.restore();
        }
    }
    
    // ЭФФЕКТЫ
    visualEffects.forEach(fx => {
        if(fx.type === 'vampire_wave') {
            ctx.save(); ctx.beginPath(); ctx.strokeStyle = `rgba(0, 255, 0, ${fx.alpha})`; ctx.lineWidth = 3;
            ctx.arc(fx.x - camera.x, fx.y - camera.y, fx.radius, 0, Math.PI * 2);
            ctx.stroke(); ctx.fillStyle = `rgba(0, 255, 0, ${fx.alpha * 0.3})`; ctx.fill(); ctx.restore();
        } 
        else if (fx.type === 'warning_circle') {
            let img = IMAGES['warning_circle'];
            if(img && img.complete) {
                 ctx.save();
                 ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.2; 
                 ctx.drawImage(img, fx.x - fx.radius - camera.x, fx.y - fx.radius - camera.y, fx.radius * 2, fx.radius * 2);
                 ctx.restore();
            } else {
                 ctx.save();
                 ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                 ctx.beginPath();
                 ctx.arc(fx.x - camera.x, fx.y - camera.y, fx.radius, 0, Math.PI*2);
                 ctx.fill();
                 ctx.strokeStyle = 'red';
                 ctx.stroke();
                 ctx.restore();
            }
        }
        else if(fx.type === 'zap') {
            ctx.save();
            ctx.strokeStyle = '#3498db'; 
            ctx.lineWidth = 2;
            ctx.globalAlpha = fx.life / 15; 
            ctx.beginPath();
            ctx.moveTo(fx.x - camera.x, fx.y - camera.y);
            let midX = (fx.x + fx.tx)/2 + (Math.random()-0.5)*20;
            let midY = (fx.y + fx.ty)/2 + (Math.random()-0.5)*20;
            ctx.lineTo(midX - camera.x, midY - camera.y);
            ctx.lineTo(fx.tx - camera.x, fx.ty - camera.y);
            ctx.stroke();
            let zImg = IMAGES['zap_effect'];
            if(zImg && zImg.complete) {
                let sz = 32; 
                ctx.drawImage(zImg, fx.tx - sz/2 - camera.x, fx.ty - sz/2 - camera.y, sz, sz);
            }
            ctx.restore();
        }
    });

// ОРУЖИЕ (Чеснок)
    let garlicSpriteW = player.weapons.find(w => w.id === 'garlic');
    if (garlicSpriteW) {
        let count = 5; 
        
        // 1. Считаем масштаб (Size + Area), как в логике урона
        let finalScale = (player.stats.size + player.stats.area);
        
        // 2. Если чеснок проклят — уменьшаем радиус визуально (чтобы совпадал с хитбоксом)
        if (garlicSpriteW.isCursed) finalScale *= 0.6;

        // 3. Считаем радиус: 90 умножаем на масштаб
        let radius = 90 * finalScale;

        for(let i=0; i<count; i++) {
             let angle = (Date.now()/500) + (i * (Math.PI*2/count));
             let gx = player.x + Math.cos(angle)*radius; 
             let gy = player.y + Math.sin(angle)*radius;
             if(IMAGES.garlicyo.complete) ctx.drawImage(IMAGES.garlicyo, gx-12-camera.x, gy-12-camera.y, 24, 24);
        }
    }

    // СНАРЯДЫ ИГРОКА
projectiles.forEach(p => {
        
        // 1. БИБЛИЯ (Оставляем как было)
        if (p.type === 'bible_book') {
             if(p.img && IMAGES[p.img]) {
                 ctx.save(); 
                 ctx.translate(p.x - camera.x, p.y - camera.y);
                 ctx.rotate(p.angle); 
                 ctx.drawImage(IMAGES[p.img], -p.size, -p.size, p.size*2, p.size*2); 
                 ctx.restore();
             }
             return; 
        }

        // [ВСТАВЛЯЕМ СЮДА НОВЫЙ БЛОК ДЛЯ МИН]
// --- МИНА (ПОВОРОТ В ГРАДУСАХ) ---
        if (p.type === 'mine') {
             if(p.img && IMAGES[p.img]) {
                 ctx.save(); 
                 ctx.translate(p.x - camera.x, p.y - camera.y);
                 
                 // Поворот (если надо)
                 // ctx.rotate(Math.PI); 

                 // ИСПОЛЬЗУЕМ drawScale
                 let scale = p.drawScale || 1.0; 
                 let drawSize = p.size * scale; 
                 
                 ctx.drawImage(IMAGES[p.img], -drawSize, -drawSize, drawSize*2, drawSize*2); 
                 ctx.restore();
             }
             return;
        }

        // [ВСТАВЛЯЕМ СЮДА НОВЫЙ БЛОК ДЛЯ КАТАНЫ]
// --- КАТАНА (ПОВОРОТ В ГРАДУСАХ) ---
        if (p.type === 'slash_wave') {
            if (p.img && IMAGES[p.img]) {
                ctx.save();
                ctx.translate(p.x - camera.x, p.y - camera.y);
                
                // p.rotation - это направление полета (в радианах).
                // Мы добавляем к нему корректировку в ГРАДУСАХ.
                // Если летит боком — меняй 90 на 0 или 180.
                let offsetDegrees = 270; 
                ctx.rotate(p.rotation + (offsetDegrees * Math.PI / 180)); 
                
                let img = IMAGES[p.img];
                // Используем размеры из logic.js (pWidth/pHeight) или дефолт
                let dw = (p.pWidth || p.size * 2);
                let dh = (p.pHeight || p.size * 2);

                ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
                ctx.restore();
            }
            return; 
        }
        
        if (p.type === 'explosion') {
             if(p.img && IMAGES[p.img]) {
                 ctx.save();
                 ctx.translate(p.x - camera.x, p.y - camera.y);
                 
                 // УМЕНЬШЕНИЕ СПРАЙТА
                 // p.size - это радиус хитбокса (например, 80).
                 // Мы рисуем картинку размером 0.7 от хитбокса (будет визуально меньше, но бить так же)
                 // Или 1.0, чтобы совпадало с кругом.
                 let scale = 0.8; // <--- МЕНЯЙ ЭТО ЧИСЛО (Меньше 1.0 = спрайт меньше хитбокса)
                 
                 let drawSize = p.size * scale; 
                 ctx.drawImage(IMAGES[p.img], -drawSize, -drawSize, drawSize*2, drawSize*2);
                 ctx.restore();
             }
             return;
        }

        if(p.type==='slash') { 
            if (p.img && IMAGES[p.img]) {
                 ctx.save(); 
                 // ... (translate и rotate оставляем) ...
                 ctx.translate(p.x - camera.x, p.y - camera.y);
                 let angle = Math.atan2(p.ty - p.y, p.tx - p.x); 
                 ctx.rotate(angle + Math.PI / 2);
                 
                 let img = IMAGES[p.img];
                 
                 // --- ИСПОЛЬЗУЕМ МАСШТАБ КАРТИНКИ ---
                 let scale = p.drawScale || 0.65; // Дефолт 0.65, если не задано
                 let drawHeight = p.size * scale; 
                 
                 // ... (дальше без изменений) ...
                 let ratio = img.naturalWidth / img.naturalHeight;
                 let drawWidth = drawHeight * ratio;
                 let distanceFromHero = 20;
                 ctx.drawImage(img, -drawWidth/2, -drawHeight - distanceFromHero, drawWidth, drawHeight); 
                 ctx.restore();
            } else { 
                ctx.strokeStyle='white'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(p.x-camera.x,p.y-camera.y); ctx.lineTo(p.tx-camera.x,p.ty-camera.y); ctx.stroke(); 
            }
        } else { 
            if(p.img && IMAGES[p.img]) {
                ctx.save(); ctx.translate(p.x-camera.x, p.y-camera.y); 
                if (p.rotation) ctx.rotate(p.rotation); else ctx.rotate(Date.now()/100);
                
                let img = IMAGES[p.img];
                let ratio = img.naturalWidth / img.naturalHeight;
                let dw = p.size*2, dh = p.size*2;
                if (p.img.includes('mageattack')) { dw *= 0.6; dh *= 0.6; }
                if(ratio>1) dh = dw/ratio; else dw = dh*ratio;

                ctx.drawImage(img, -dw/2, -dh/2, dw, dh); 
                ctx.restore();
            } else if(p.type==='bullet') ctx.drawImage(IMAGES.mageattack, p.x-p.size-camera.x, p.y-p.size-camera.y, p.size*2, p.size*2);
            else ctx.drawImage(IMAGES.axe, p.x-p.size-camera.x, p.y-p.size-camera.y, p.size*2, p.size*2);
        }
    });
    
    // СНАРЯДЫ ВРАГОВ
    enemyProjectiles.forEach(p => {
        if (p.img && IMAGES[p.img] && IMAGES[p.img].complete) {
            ctx.save(); 
            ctx.translate(p.x - camera.x, p.y - camera.y); 
            
            if (p.img !== 'meteor_explosion.png') {
                let angle = Math.atan2(p.vy, p.vx);
                ctx.rotate(angle);
            }
            
            let img = IMAGES[p.img];
            let ratio = img.naturalWidth / img.naturalHeight;
            let dw = p.size*2, dh = p.size*2;
            if(ratio>1) dh = dw/ratio; else dw = dh*ratio;
            
            ctx.drawImage(img, -dw/2, -dh/2, dw, dh); 
            ctx.restore();
        } else {
            ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(p.x-camera.x, p.y-camera.y, p.size, 0, Math.PI*2); ctx.fill();
        }
    });

// game/renderer.js -> В самом конце

    // DEBUG: ОТРИСОВКА ХИТБОКСОВ (С ЛУЖАМИ)
    if (window.debugShowHitboxes || window.showHitboxes) {
        ctx.save();
        ctx.lineWidth = 2;

        // 1. ИГРОК
        ctx.strokeStyle = '#00FFFF'; 
        ctx.strokeRect(player.x - camera.x - player.width/2, player.y - camera.y - player.height/2, player.width, player.height);

        // 2. ВРАГИ
        enemies.forEach(e => {
            ctx.strokeStyle = 'red';
            ctx.beginPath(); ctx.arc(e.x - camera.x, e.y - camera.y, e.size, 0, Math.PI*2); ctx.stroke();
        });

        // 3. СНАРЯДЫ ИГРОКА
        projectiles.forEach(p => {
            ctx.strokeStyle = '#00ff00';
            if (p.type === 'slash_wave' && p.hWidth && p.hHeight) {
                let poly = getRotatedCorners(p.x, p.y, p.hWidth, p.hHeight, p.rotation);
                ctx.beginPath();
                ctx.moveTo(poly[0].x - camera.x, poly[0].y - camera.y);
                for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x - camera.x, poly[i].y - camera.y);
                ctx.closePath(); ctx.stroke();
            } else if(p.type === 'slash') {
                 ctx.beginPath(); ctx.moveTo(p.x-camera.x, p.y-camera.y); ctx.lineTo(p.tx-camera.x, p.ty-camera.y); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI*2); ctx.stroke();
            }
        });

        // 4. ЛУЖИ (Fire Ground, Holy Water) - ДОБАВЛЕНО ЭТО!
        firePools.forEach(p => {
            ctx.strokeStyle = 'cyan'; // Голубой цвет для луж
            ctx.beginPath(); 
            ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI*2); 
            ctx.stroke();
        });

        // 5. СНАРЯДЫ ВРАГОВ
        enemyProjectiles.forEach(p => {
             ctx.save(); 
             ctx.strokeStyle = 'magenta';
             ctx.translate(p.x - camera.x, p.y - camera.y);
             if (p.width && p.height) {
                 let angle = p.rotation !== undefined ? p.rotation : Math.atan2(p.vy, p.vx);
                 if (!p.vx && !p.vy) angle = 0;
                 ctx.rotate(angle);
                 ctx.strokeRect(-p.width/2, -p.height/2, p.width, p.height);
             } else {
                 ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.stroke();
             }
             ctx.restore();
        });

        ctx.restore();
    }

    damageNumbers.forEach(dn=>{ctx.fillStyle=dn.color||'white'; ctx.font="bold 16px Arial"; ctx.fillText(dn.val, dn.x-camera.x, dn.y-camera.y);});
}
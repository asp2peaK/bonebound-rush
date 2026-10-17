// game/pvp_ui.js

window.PvpUI = {
    myDeathTime: null,
    lobbyListener: null,
    myUid: null,
    myIndex: null, // 0 (Host) or 1 (Guest)
    targetWinTime: null, 
    currentPhase: null,
    currentTurn: -1,
    
    // Флаг защиты от двойного вызова
    isGameOverHandled: false,

    // --- РАНГИ ---
    ranks: [
        { name: "Lost Soul", min: 0, color: "#95a5a6", icon: "sprites/ranks/rank_0.png" },
        { name: "Bone Scavenger", min: 500, color: "#d35400", icon: "sprites/ranks/rank_1.png" },
        { name: "Crypt Keeper", min: 750, color: "#7f8c8d", icon: "sprites/ranks/rank_2.png" },
        { name: "Grave Knight", min: 1000, color: "#e67e22", icon: "sprites/ranks/rank_3.png" },
        { name: "Void Walker", min: 1250, color: "#9b59b6", icon: "sprites/ranks/rank_4.png" },
        { name: "Soul Reaper", min: 1500, color: "#c0392b", icon: "sprites/ranks/rank_5.png" },
        { name: "Abyss Lord", min: 1750, color: "#2c3e50", icon: "sprites/ranks/rank_6.png" },
        { name: "ETERNAL", min: 2000, color: "#f1c40f", icon: "sprites/ranks/rank_7.png" }
    ],

    getRankInfo: (elo) => {
        let r = window.PvpUI.ranks;
        for (let i = r.length - 1; i >= 0; i--) {
            if (elo >= r[i].min) return r[i];
        }
        return r[0];
    },

    showRankInfo: () => {
        const modal = document.getElementById('rank-info-modal');
        const list = document.getElementById('rank-list-container');
        list.innerHTML = '';
        let myElo = window.Cloud.playerData ? (window.Cloud.playerData.elo || 1000) : 1000;

        window.PvpUI.ranks.forEach((r, idx) => {
            let nextR = window.PvpUI.ranks[idx+1];
            let range = nextR ? `${r.min} - ${nextR.min - 1}` : `${r.min}+`;
            let isCurrent = (myElo >= r.min && (!nextR || myElo < nextR.min));
            let bg = isCurrent ? "rgba(241, 196, 15, 0.2)" : "rgba(0,0,0,0.3)";
            let border = isCurrent ? "1px solid #f1c40f" : "none";

            let row = document.createElement('div');
            row.style.cssText = `display: flex; align-items: center; padding: 10px; margin-bottom: 5px; background: ${bg}; border: ${border}; border-radius: 8px;`;
            row.innerHTML = `
                <img src="${r.icon}" style="width: 48px; height: 48px; margin-right: 20px;">
                <div style="flex: 1; font-size: 20px; font-weight: bold; color: ${r.color};">${r.name.toUpperCase()}</div>
                <div style="font-size: 18px; color: #fff; font-family: monospace;">${range}</div>
            `;
            list.appendChild(row);
        });
        modal.style.display = 'flex';
    },

    // Draft Order
    draftOrder: [
        { type: 'char',   p: 0 }, { type: 'char',   p: 1 },
        { type: 'weapon', p: 0 }, { type: 'weapon', p: 1 },
        { type: 'item',   p: 0 }, { type: 'item',   p: 1 },
        { type: 'item',   p: 0 }, { type: 'item',   p: 1 },
        { type: 'stat',   p: 0 }, { type: 'stat',   p: 1 },
        { type: 'pick',   p: -1 } 
    ],

    getBanPool: (type) => {
        if (type === 'char') return Object.keys(DB.characters);
        if (type === 'weapon') return Object.keys(DB.weapons);
        if (type === 'stat') return Object.keys(DB.stats);
        if (type === 'item') {
            let items = Object.keys(DB.items);
            const rMap = { legendary: 4, epic: 3, rare: 2, common: 1 };
            items.sort((a, b) => {
                let rA = DB.items[a].rarity || 'common';
                let rB = DB.items[b].rarity || 'common';
                return rMap[rB] - rMap[rA];
            });
            return items;
        }
        return [];
    },

    openModeSelect: () => {
        gameState = 'PVP_MENU';
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('pvp-menu-screen').style.display = 'flex';
        
        const myData = window.Cloud.playerData;
        const elo = myData ? (myData.elo || 1000) : 1000;
        
        const eloDisp = document.getElementById('rank-elo-disp');
        if(eloDisp) eloDisp.innerText = elo;
        
        let info = window.PvpUI.getRankInfo(elo);
        const rankTxt = document.getElementById('rank-name-disp');
        if(rankTxt) { 
            rankTxt.innerText = info.name; 
            rankTxt.style.color = info.color; 
        }
    },

    closeModeSelect: () => {
        gameState = 'MENU';
        document.getElementById('pvp-menu-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
    },

    openRankedHub: () => {
        gameState = 'RANKED_HUB';
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('pvp-menu-screen').style.display = 'none';
        document.getElementById('pvp-ranked-hub').style.display = 'flex';
        
        const myData = window.Cloud.playerData;
        const elo = myData ? (myData.elo || 1000) : 1000;
        document.getElementById('hub-elo-val').innerText = elo;
        
        let info = window.PvpUI.getRankInfo(elo);
        const rName = document.getElementById('hub-rank-name');
        rName.innerText = info.name; 
        rName.style.color = info.color;
        document.getElementById('hub-rank-icon').src = info.icon;
    },

    closeRankedHub: () => {
        document.getElementById('pvp-ranked-hub').style.display = 'none';
        window.PvpUI.openModeSelect();
    },

    openLobby: async (battleId) => {
        gameState = 'LOBBY';
        document.getElementById('matchmaking-screen').style.display = 'none';
        document.getElementById('pvp-lobby-screen').style.display = 'flex';
        
        window.PvpUI.myUid = window.Cloud.user.uid;
        window.PvpUI.targetWinTime = null;
        window.PvpUI.currentTurn = -1; 
        window.PvpUI.myDeathTime = null; 
        window.PvpUI.lastEnemyData = null; // Очищаем данные прошлого врага
        
        // --- СБРОС ФЛАГОВ ---
        window.PvpUI.gameStartedLocal = false;
        window.PvpUI.isGameOverHandled = false; // <--- ВАЖНО: СБРОС ЗАЩИТЫ
        window.PvpUI.lastBanCount = null;

        if (window.PvpUI.lobbyListener) window.RTDB.unsubscribe(`battles/${battleId}`);
        
        window.PvpUI.lobbyListener = window.RTDB.subscribe(`battles/${battleId}`, (battle) => {
            if (!battle) return;

            // --- FIX: ВСЕГДА ОБНОВЛЯЕМ ДАННЫЕ, ЧТОБЫ ЗНАТЬ АКТУАЛЬНОЕ СОСТОЯНИЕ ---
            window.PvpUI.currentBattle = battle;
            window.PvpUI.myIndex = (battle.player1.uid === window.PvpUI.myUid) ? 0 : 1;
            window.PvpUI.enemyKey = window.PvpUI.myIndex === 0 ? 'player2' : 'player1';
            // ---------------------------------------------------------------------

            // --- NOTIFICATIONS ---
            let currentBans = [];
            if(battle.bans) {
                if(battle.bans.char) currentBans.push(...battle.bans.char);
                if(battle.bans.weapon) currentBans.push(...battle.bans.weapon);
                if(battle.bans.item) currentBans.push(...battle.bans.item);
                if(battle.bans.stat) currentBans.push(...battle.bans.stat);
            }

            if (window.PvpUI.lastBanCount !== null && currentBans.length > window.PvpUI.lastBanCount) {
                let turnIndex = (battle.turn || 0) - 1; 
                let lastItem = currentBans[currentBans.length - 1];
                if (turnIndex >= 0 && window.PvpUI.draftOrder[turnIndex] && window.PvpUI.draftOrder[turnIndex].p !== window.PvpUI.myIndex) {
                    let name = tDB(lastItem, 'name'); 
                    if(t('stat_'+lastItem) !== ('stat_'+lastItem)) name = t('stat_'+lastItem);
                    if(window.showNotification) window.showNotification(`OPPONENT BANNED: ${name}`, 'red');
                }
            }
            window.PvpUI.lastBanCount = currentBans.length;
            
            // --- WINNER CHECK (Если победа пришла из базы) ---
            if (battle.winner) {
                if (battle.winner === window.PvpUI.myUid) {
                    window.PvpUI.handleGameOver(true);
                } else {
                    window.PvpUI.handleGameOver(false);
                }
                return;
            }

            if (battle.status === 'aborted') {
                window.showCustomModal("OPPONENT LEFT", "The match was cancelled.", () => window.PvpUI.leaveLobby(true));
                return;
            }

            window.RTDB.opponentId = battle[window.PvpUI.enemyKey].uid;
            window.RTDB.setDisconnectHook(battleId, window.RTDB.opponentId);
            let enData = battle[window.PvpUI.enemyKey];
            let enElo = enData.elo || 1000; // Берем эло из данных врага
            document.getElementById('lobby-vs-text').innerText = `VS ${enData.nickname} (${enElo})`;

            // --- START GAME ---
            if (battle.status === 'started') {
                const isCountdownActive = document.getElementById('pvp-countdown').style.display === 'block';
                if (gameState === 'LOBBY' && !isCountdownActive) {
                    window.PvpUI.startGameSequence(battle, window.PvpUI.enemyKey);
                }
                return;
            }

            if (battle.status !== window.PvpUI.currentPhase || battle.turn !== window.PvpUI.currentTurn) {
                window.PvpUI.currentPhase = battle.status;
                window.PvpUI.currentTurn = battle.turn;
                window.PvpUI.renderDraftScreen(battle);
            }

            let isPickPhase = (battle.status === 'pick_phase') || (battle.turn === 10);
            if (isPickPhase && window.PvpUI.myIndex === 0) {
                if (battle.player1.ready && battle.player2.ready) {
                    window.RTDB.db.ref(`battles/${battleId}/status`).set('started');
                }
            }
        });
    },

    renderDraftScreen: (battle) => {
        const turn = battle.turn || 0;
        const step = window.PvpUI.draftOrder[turn];
        if (!step) return;

        const container = document.getElementById('pvp-lobby-screen');
        let banArea = document.getElementById('ban-area');
        if (!banArea) {
            banArea = document.createElement('div');
            banArea.id = 'ban-area';
            container.insertBefore(banArea, container.lastElementChild);
        }
        banArea.innerHTML = '';

        let titleText = "";
        let isMyTurn = (step.p === window.PvpUI.myIndex);
        
        if (step.type === 'pick') {
            titleText = "PICK YOUR HERO";
            isMyTurn = true; 
        } else {
            titleText = `BAN ${step.type.toUpperCase()}`;
            titleText += isMyTurn ? " (YOUR TURN)" : " (OPPONENT'S TURN)";
        }

        let h2 = document.createElement('h2');
        h2.innerText = titleText;
        h2.style.color = isMyTurn ? '#f1c40f' : '#7f8c8d';
        if (step.type === 'pick') h2.style.color = '#2ecc71';
        banArea.appendChild(h2);

        let pool = window.PvpUI.getBanPool(step.type === 'pick' ? 'char' : step.type);
        let grid = document.createElement('div');
        grid.style.display = 'flex'; grid.style.flexWrap = 'wrap'; 
        grid.style.justifyContent = 'center'; grid.style.gap = '8px'; grid.style.maxWidth = '800px';

        pool.forEach(id => {
            // --- ДОБАВИТЬ ВОТ ЭТУ СТРОКУ ---
            if (!id) return; 
            // -------------------------------
            let item = document.createElement('div');
            item.id = `slot-${id}`;
            
            let bans = battle.bans || {};
            let isBanned = false;
            if (bans.char && bans.char.includes(id)) isBanned = true;
            if (bans.weapon && bans.weapon.includes(id)) isBanned = true;
            if (bans.item && bans.item.includes(id)) isBanned = true;
            if (bans.stat && bans.stat.includes(id)) isBanned = true;

            let imgPath = '';
            let rarityClass = 'common';
            
            if (step.type === 'char' || step.type === 'pick') {
                imgPath = `sprites/other/${id}_s.png`;
            } else if (step.type === 'stat') {
                imgPath = `sprites/map/gold1.png`; 
                item.innerHTML = `<div style="font-size:10px; color:#fff;">${t('stat_'+id)}</div>`;
            } else {
                let dbObj = (step.type === 'weapon') ? DB.weapons[id] : DB.items[id];
                let folder = (step.type === 'weapon') ? 'weapons' : 'items';
                imgPath = `sprites/${folder}/${dbObj.img}`;
                rarityClass = dbObj.rarity || 'common';
            }

            item.className = `ban-slot ${rarityClass}`;
            if (step.type !== 'stat') {
                if (step.type !== 'stat') {
                // Если картинка не грузится, пробуем загрузить логотип или заглушку
                let fallback = `this.onerror=null; this.src='sprites/other/logo_s.png'`;
                
                // Если это персонаж, пробуем альтернативный путь
                if (step.type === 'char' || step.type === 'pick') {
                     fallback = `this.onerror=null; this.src='sprites/characters/${id}/${id}1.png'`;
                }
                
                item.innerHTML = `<img src="${imgPath}" style="width:100%; height:100%; object-fit:contain;" onerror="${fallback}">`;
            }
            }

            if (step.type === 'pick') {
                let myKey = window.PvpUI.myIndex === 0 ? 'player1' : 'player2';
                if (battle[myKey].pick === id) {
                    item.classList.add('picked-local'); 
                }
            }

            if (isBanned) {
                item.classList.add('banned');
            } else if (isMyTurn) {
                item.onclick = () => window.PvpUI.makeChoice(id, step.type, battle);
            } else {
                item.style.opacity = '0.5';
                item.style.cursor = 'default';
            }
            grid.appendChild(item);
        });
        banArea.appendChild(grid);

        let statusDiv = document.createElement('div');
        statusDiv.style.marginTop = '20px'; statusDiv.style.color = '#aaa';
        
        if (step.type === 'pick') {
            let myKey = window.PvpUI.myIndex === 0 ? 'player1' : 'player2';
            if (battle[myKey].ready) statusDiv.innerText = "WAITING FOR OPPONENT...";
            else statusDiv.innerText = "CHOOSE YOUR HERO";

            let historyDiv = document.createElement('div');
            historyDiv.id = 'banned-history-container';
            historyDiv.innerHTML = '<div style="color:#c0392b; font-weight:bold; font-size:14px;">🚫 BANNED ITEMS</div>';
            
            let row = document.createElement('div');
            row.className = 'banned-row';
            let allBans = [];
            if(battle.bans) {
                if(battle.bans.char) allBans.push(...battle.bans.char.map(id => ({id, type:'char'})));
                if(battle.bans.weapon) allBans.push(...battle.bans.weapon.map(id => ({id, type:'weapon'})));
                if(battle.bans.item) allBans.push(...battle.bans.item.map(id => ({id, type:'item'})));
                if(battle.bans.stat) allBans.push(...battle.bans.stat.map(id => ({id, type:'stat'})));
            }
            allBans.forEach(b => {
                let slot = document.createElement('div');
                slot.className = 'banned-icon-small';
                if (b.type === 'stat') {
                    slot.innerHTML = `<div class="banned-stat-text">${t('stat_' + b.id)}</div>`;
                } else {
                    let src = '';
                    if(b.type === 'char') src = `sprites/other/${b.id}_s.png`;
                    else {
                        let dbObj = DB.weapons[b.id] || DB.items[b.id];
                        let folder = DB.weapons[b.id] ? 'weapons' : 'items';
                        src = `sprites/${folder}/${dbObj.img}`;
                    }
                    slot.innerHTML = `<img src="${src}">`;
                }
                row.appendChild(slot);
            });
            historyDiv.appendChild(row);
            banArea.appendChild(historyDiv);
        } else {
            statusDiv.innerText = isMyTurn ? "Select an item to BAN" : "Waiting for opponent to ban...";
        }
        banArea.appendChild(statusDiv);
    },

    makeChoice: async (id, type, battle) => {
        const slot = document.getElementById(`slot-${id}`);
        if (slot) {
            if (type === 'pick') {
                document.querySelectorAll('.ban-slot').forEach(el => el.classList.remove('picked-local'));
                slot.classList.add('picked-local');
            } else {
                slot.style.opacity = '0.5';
                slot.style.border = '2px solid red';
            }
        }

        const overlay = document.createElement('div');
        overlay.id = 'draft-blocker';
        overlay.style.position = 'absolute'; overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100%'; overlay.style.height = '100%'; overlay.style.zIndex = '999';
        document.getElementById('pvp-lobby-screen').appendChild(overlay);

        setTimeout(async () => {
            if (type !== 'pick') {
                let path = `battles/${window.RTDB.currentBattleId}/bans/${type}`;
                let snap = await window.RTDB.db.ref(path).once('value');
                let list = snap.val() || [];
                
                if (!list.includes(id)) {
                    list.push(id);
                    let nextTurn = (battle.turn || 0) + 1;
                    let updates = {};
                    updates[`battles/${window.RTDB.currentBattleId}/bans/${type}`] = list;
                    updates[`battles/${window.RTDB.currentBattleId}/turn`] = nextTurn;
                    if (nextTurn === 10) {
                        updates[`battles/${window.RTDB.currentBattleId}/status`] = 'pick_phase';
                    }
                    await window.RTDB.db.ref().update(updates);
                }
            } else {
                let myKey = window.PvpUI.myIndex === 0 ? 'player1' : 'player2';
                let updates = {};
                updates[`battles/${window.RTDB.currentBattleId}/${myKey}/pick`] = id;
                updates[`battles/${window.RTDB.currentBattleId}/${myKey}/ready`] = true;
                await window.RTDB.db.ref().update(updates);
            }
            if(overlay) overlay.remove();
        }, 1500);
    },

    startGameSequence: (battle, enemyKey) => {
        // --- СБРОС ЗАЩИТЫ ---
        window.PvpUI.isGameOverHandled = false;
        
        let myKey = window.PvpUI.myIndex === 0 ? 'player1' : 'player2';
        window.PvpUI.currentBattle = battle;
        window.PvpUI.enemyKey = enemyKey;

        document.getElementById('pvp-lobby-screen').style.display = 'none';
        const cdDiv = document.getElementById('pvp-countdown');
        cdDiv.style.display = 'block';
        
        let count = 3;
        cdDiv.innerText = count;
        
        let int = setInterval(() => {
            count--;
            if (count > 0) cdDiv.innerText = count;
            else if (count === 0) cdDiv.innerText = "FIGHT!";
            else {
                clearInterval(int);
                cdDiv.style.display = 'none';
                
                banishedList = [];
                if (battle.bans) {
                    if (battle.bans.weapon) banishedList.push(...battle.bans.weapon);
                    if (battle.bans.item) banishedList.push(...battle.bans.item);
                    if (battle.bans.stat) banishedList.push(...battle.bans.stat);
                }
                
                let myChar = battle[myKey].pick || 'knight';
                window.PvpUI.initSpyWindow(battle, enemyKey);
                startGame(myChar);
            }
        }, 1000);
    },

    initSpyWindow: (battle, enemyKey) => {
        document.getElementById('pvp-spy-window').style.display = 'block';
        document.getElementById('spy-name').innerText = battle[enemyKey].nickname;
        
        let img = document.getElementById('spy-avatar');
        let charName = battle[enemyKey].pick || 'knight';
        img.style.display = 'block'; 

        let try1 = `sprites/other/${charName}_s.png`;
        let try2 = `sprites/characters/${charName}/${charName}1.png`;
        let def = `sprites/other/knight_s.png`;

        img.src = try1;
        img.onerror = function() {
            if (this.src.includes('_s.png')) this.src = try2;
            else if (this.src.includes(charName + '1.png')) this.src = def;
            else this.style.display = 'none';
        };
        
        let enemyUid = battle[enemyKey].uid;
        if (window.PvpUI.spyListener) window.RTDB.unsubscribe(`battles/${window.RTDB.currentBattleId}/sync/${enemyUid}`);

        window.PvpUI.spyListener = window.RTDB.subscribe(`battles/${window.RTDB.currentBattleId}/sync/${enemyUid}`, (data) => {
            if (!data) return;
            window.PvpUI.lastEnemyData = data;
            // --- ВСТАВИТЬ ЭТУ СТРОКУ (для истории) ---
            if (data.items) window.PvpUI.lastEnemyBuild = data.items;
            window.PvpUI.enemyIsPaused = data.isPaused || false;
            window.PvpUI.enemyGameTime = data.gameTime || 0;

            if (battle[enemyKey].pick) {
                let currentSrc = document.getElementById('spy-avatar').getAttribute('src');
                let targetSrc = `sprites/other/${battle[enemyKey].pick}_s.png`;
                if (!currentSrc || currentSrc.indexOf(battle[enemyKey].pick) === -1) {
                     document.getElementById('spy-avatar').src = targetSrc;
                }
            }
            
            let pct = (data.hp / data.maxHp) * 100;
            if (data.isDead || data.hp <= 0) pct = 0;
            document.getElementById('spy-hp-fill').style.width = Math.max(0, pct) + '%';
            document.getElementById('spy-lvl').innerText = "Lvl " + (data.lvl || 1);
            
            let grid = document.getElementById('spy-build-grid');
            grid.innerHTML = '';
            if (data.items) {
                data.items.forEach(itemObj => {
                    let imgName = (typeof itemObj === 'string') ? itemObj : itemObj.img;
                    let lvl = (typeof itemObj === 'object') ? itemObj.lvl : 1;
                    let div = document.createElement('div');
                    div.style.position = 'relative'; div.style.width = '24px'; div.style.height = '24px';
                    let folder = 'items';
                    if (Object.values(DB.weapons).some(w => w.img === imgName)) folder = 'weapons';
                    
                    let img = document.createElement('img');
                    img.src = `sprites/${folder}/${imgName}`;
                    img.className = 'spy-item-icon'; 
                    img.onerror = function() { this.style.display = 'none'; };
                    
                    let lvlSpan = document.createElement('span');
                    lvlSpan.className = 'spy-item-lvl'; 
                    lvlSpan.innerText = lvl;

                    div.appendChild(img); div.appendChild(lvlSpan); grid.appendChild(div);
                });
            }
            
            if (data.isDead) {
                if (!window.PvpUI.myDeathTime && !window.PvpUI.targetWinTime) {
                    window.PvpUI.targetWinTime = (data.deathTime || 0) + 1; 
                    window.showNotification(`OPPONENT DIED! SURVIVE UNTIL ${window.formatTotalTime(window.PvpUI.targetWinTime)}`, 'gold');
                }
                else if (window.PvpUI.myDeathTime !== null) {
                    let myTime = window.PvpUI.myDeathTime;
                    let enemyTime = data.deathTime || 0;
                    if (myTime > enemyTime) window.PvpUI.declareVictory(); 
                    else window.PvpUI.handleGameOver(false);
                }
            }   
        });
    },

    onMyDeath: (deathTime) => {
        if (window.sendSyncData) window.sendSyncData();
        gameState = 'GAMEOVER'; 
        document.getElementById('ui-layer').style.display = 'none';
        window.PvpUI.myDeathTime = deathTime;
        const waitScreen = document.getElementById('pvp-wait-screen');
        if (waitScreen) {
            waitScreen.style.display = 'flex';
            let m = Math.floor(deathTime / 60);
            let s = Math.floor(deathTime % 60);
            document.getElementById('wait-timer-disp').innerText = "Survived: " + (m<10?'0'+m:m) + ":" + (s<10?'0'+s:s);
        }
    },

// СТАЛО (Замени функцию целиком):
surrender: async () => {
        const battleId = window.RTDB.currentBattleId;
        if (!battleId) { window.exitToMenu(); return; } 

        // Отправляем свои финальные данные перед уходом
        const finalData = {
            stats: player.stats,
            kills: kills || 0,
            lvl: player.level || 1,
            gold: Math.floor(player.gold || 0),
            items: window.getLastSyncBuild ? window.getLastSyncBuild() : []
        };
        await window.RTDB.db.ref(`battles/${battleId}/final_sync/${window.PvpUI.myUid}`).set(finalData);

        if (window.RTDB.opponentId) {
            await window.RTDB.db.ref(`battles/${battleId}/winner`).set(window.RTDB.opponentId);
        }
        window.PvpUI.handleGameOver(false);
    },

    declareVictory: async () => {
        if (!window.RTDB.currentBattleId) return;
        
        // 1. Собираем финальный пакет данных
        const finalData = {
            stats: player.stats,
            kills: kills || 0,
            lvl: player.level || 1,
            gold: Math.floor(player.gold || 0),
            items: window.getLastSyncBuild ? window.getLastSyncBuild() : []
        };

        // 2. Отправляем в специальную ветку "final_sync"
        const path = `battles/${window.RTDB.currentBattleId}/final_sync/${window.PvpUI.myUid}`;
        await window.RTDB.db.ref(path).set(finalData);

        // 3. Ставим флаг победителя и завершаем у себя
        window.RTDB.db.ref(`battles/${window.RTDB.currentBattleId}/winner`).set(window.PvpUI.myUid);
        window.PvpUI.handleGameOver(true);
    },

handleGameOver: async (isVictory) => {
        // --- 1. КРИТИЧЕСКАЯ ЗАЩИТА: ПРОВЕРЯЕМ ФЛАГ ---
        if (window.PvpUI.isGameOverHandled) return;
        window.PvpUI.isGameOverHandled = true; 
        
// ПРАВКА: Теперь и победитель, и проигравший запрашивают финальные данные оппонента
        if (window.RTDB.currentBattleId && window.RTDB.opponentId) {
            const finalPath = `battles/${window.RTDB.currentBattleId}/final_sync/${window.RTDB.opponentId}`;
            try {
                const snap = await window.RTDB.db.ref(finalPath).once('value');
                if (snap.exists()) {
                    window.PvpUI.lastEnemyData = snap.val();
                    console.log("FINAL SYNC RECEIVED");
                }
            } catch (e) {
                console.warn("Could not get final sync:", e);
            }
        }

        localStorage.removeItem('bonebound_active_battle');
        gameState = 'GAMEOVER';
        document.getElementById('ui-layer').style.display = 'none';
        document.getElementById('pvp-spy-window').style.display = 'none';
        document.getElementById('pvp-wait-screen').style.display = 'none'; 
        
        if (window.PvpUI.lastEnemyData) {
            window.PvpUI.renderWaitStats(window.PvpUI.lastEnemyData, 'pvp-result-stats');
        }

        const resScreen = document.getElementById('pvp-results-screen');
        resScreen.style.display = 'flex';
        
        document.getElementById('pvp-res-title').innerText = isVictory ? "VICTORY!" : "DEFEAT";
        document.getElementById('pvp-res-title').style.color = isVictory ? "#f1c40f" : "#c0392b";
        
        // --- 2. РАСЧЕТ ELO И СОХРАНЕНИЕ ---
        if (window.Cloud && window.Cloud.playerData) {
            let p = window.Cloud.playerData;
            
            if (typeof window.totalPlayTime !== 'undefined') p.stats.timePlayed = window.totalPlayTime;
            p.stats.kills = (p.stats.kills || 0) + kills;
            p.stats.runs = (p.stats.runs || 0) + 1;

            let battle = window.PvpUI.currentBattle;
            
            if (battle && window.PvpUI.enemyKey) {
                let enemyKey = window.PvpUI.enemyKey;
                let myKey = enemyKey === 'player1' ? 'player2' : 'player1';
                
                let myElo = (battle[myKey] && battle[myKey].elo) ? battle[myKey].elo : 1000;
                let enemyElo = (battle[enemyKey] && battle[enemyKey].elo) ? battle[enemyKey].elo : 1000;
                
                let change = isVictory ? 25 : -25;
                
                if (window.EloSystem) {
                    let res = window.EloSystem.calculateNewRating(myElo, enemyElo, isVictory ? 1 : 0);
                    change = res.change;
                }
                p.elo = myElo + change;
                
// --- СОХРАНЕНИЕ ИСТОРИИ (FIXED) ---
                if (window.Cloud.saveMatchHistory) {
                    let totalDmg = 0;
                    if (player.weapons) player.weapons.forEach(w => totalDmg += (w.totalDamage || 0));

                    // 1. Собираем статы врага (с защитой от undefined)
                    let es = {};
                    if (window.PvpUI.lastEnemyData) {
                        let src = window.PvpUI.lastEnemyData.stats || {};
                        // Копируем все ключевые статы, заменяя undefined на 0
                        const keys = ['might', 'moveSpeed', 'cooldown', 'area', 'duration', 'projSpeed', 'luck', 'growth', 'greed', 'curse', 'vampChance', 'vampPower', 'critChance', 'critDamage', 'evasion', 'amount'];
                        keys.forEach(k => es[k] = src[k] || 0);
                        
                        es.kills = window.PvpUI.lastEnemyData.kills || 0;
                        es.lvl = window.PvpUI.lastEnemyData.lvl || 1;
                        es.gold = window.PvpUI.lastEnemyData.gold || 0;
                    }

                    // 2. Билд врага
                    let enBuild = (window.PvpUI.lastEnemyData && window.PvpUI.lastEnemyData.items) ? window.PvpUI.lastEnemyData.items : [];

                    window.Cloud.saveMatchHistory({
                        result: isVictory ? 'win' : 'loss',
                        eloChange: change,
                        myChar: player.type,
                        myBuild: window.getLastSyncBuild ? window.getLastSyncBuild() : [],
                        
                        opponentNick: battle[enemyKey].nickname || "Enemy",
                        opponentChar: battle[enemyKey].pick || "?",
                        opponentBuild: enBuild,
                        opponentStats: es, // Теперь тут гарантированно нет undefined
                        
                        stats: { 
                            damage: totalDmg, 
                            kills: kills || 0,
                            gold: Math.floor(player.gold || 0),
                            level: player.level || 1,
                            // Явно прописываем все статы с защитой
                            might: player.stats.might || 0,
                            moveSpeed: player.stats.moveSpeed || 0,
                            cooldown: player.stats.cooldown || 0,
                            area: player.stats.area || 0,
                            duration: player.stats.duration || 0,
                            projSpeed: player.stats.projSpeed || 0,
                            luck: player.stats.luck || 0,
                            growth: player.stats.growth || 0,
                            greed: player.stats.greed || 0,
                            curse: player.stats.curse || 0,
                            vampChance: player.stats.vampChance || 0,
                            vampPower: player.stats.vampPower || 0,
                            critChance: player.stats.critChance || 0,
                            critDamage: player.stats.critDamage || 0,
                            evasion: player.stats.evasion || 0,
                            amount: player.stats.amount || 0
                        }
                    });
                }
                
                // Обновляем локальный объект
                window.Cloud.playerData = p;
                
                // UI обновления
                document.getElementById('pvp-res-elo-current').innerText = p.elo;
                const diffEl = document.getElementById('pvp-res-elo-diff');
                diffEl.innerText = (change > 0 ? "+" : "") + change;
                diffEl.style.color = change > 0 ? "#2ecc71" : "#e74c3c";
            } else {
                console.warn("Battle data missing for ELO calc, saving stats only.");
            }
            
            // Финальное сохранение
            window.Cloud.saveData(p);
        }

        // Аватарки
        let battle = window.PvpUI.currentBattle;
        if (battle) {
             let enemyKey = window.PvpUI.enemyKey;
             let myKey = enemyKey === 'player1' ? 'player2' : 'player1';

             if (battle[myKey] && battle[enemyKey]) {
                const myImg = document.getElementById('pvp-res-avatar');
                const enImg = document.getElementById('pvp-res-enemy-avatar');

                let myPick = battle[myKey].pick || 'logo';
                let enPick = battle[enemyKey].pick || 'logo';

                myImg.src = `sprites/other/${myPick}_s.png`;
                myImg.onerror = function() { this.src = 'sprites/other/knight_s.png'; };
                myImg.style.background = "#222"; 
                document.getElementById('pvp-res-nick').innerText = battle[myKey].nickname;
                
                enImg.src = `sprites/other/${enPick}_s.png`;
                enImg.onerror = function() { this.src = 'sprites/other/knight_s.png'; };
                enImg.style.background = "#222";
                document.getElementById('pvp-res-enemy-nick').innerText = battle[enemyKey].nickname;

                myImg.classList.remove('loser-effect');
                enImg.classList.remove('loser-effect');

                if (isVictory) {
                    enImg.classList.add('loser-effect');
                } else {
                    myImg.classList.add('loser-effect');
                }
            }
        }
        
        if (window.RTDB.currentBattleId) window.RTDB.unsubscribe(`battles/${window.RTDB.currentBattleId}`);
        window.RTDB.currentBattleId = null;
    },

        closeResults: () => {
        document.getElementById('pvp-results-screen').style.display = 'none';
        
        // --- FIX: ПРИНУДИТЕЛЬНО СКРЫВАЕМ ЛОББИ (чтобы соперник не застрял) ---
        document.getElementById('pvp-lobby-screen').style.display = 'none';
        // ---------------------------------------------------------------------

        window.exitToMenu(true); 
        window.PvpUI.openRankedHub();
    },

// game/pvp_ui.js -> leaveLobby

    leaveLobby: async (silent = false) => {
        // Если silent = false, значит это Rage Quit (выход кнопкой)
        if (!silent && window.RTDB.currentBattleId) {
            
            // 1. Ставим врага победителем в БД (чтобы у него показалась победа)
            if (window.RTDB.opponentId) {
                await window.RTDB.db.ref(`battles/${window.RTDB.currentBattleId}/winner`).set(window.RTDB.opponentId);
            } else {
                await window.RTDB.set(`battles/${window.RTDB.currentBattleId}/status`, 'aborted');
            }

            // 2. СНИМАЕМ ЭЛО СЕБЕ (Сразу же)
            if (window.Cloud && window.Cloud.playerData) {
                let p = window.Cloud.playerData;
                p.elo = (p.elo || 1000) - 25; // Штраф
                window.Cloud.playerData.elo = p.elo; // Обновляем локально
                await window.Cloud.saveData(p);      // Сохраняем в облако
                
                // Уведомление
                if(window.showNotification) window.showNotification("Lobby abandoned! -25 Elo", "red");
            }
        }

        // 3. Стандартная очистка
        if (window.RTDB.currentBattleId) {
            window.RTDB.cancelDisconnectHook(window.RTDB.currentBattleId);
            window.RTDB.unsubscribe(`battles/${window.RTDB.currentBattleId}`);
        }
        
        // Сброс переменных
        window.RTDB.currentBattleId = null;
        window.PvpUI.lobbyListener = null;
        window.PvpUI.gameStartedLocal = false; 
        if (window.PvpUI.spyListener) window.PvpUI.spyListener = null; 
        
        // Очищаем метку о битве (чтобы при рефреше не пытался вернуть)
        localStorage.removeItem('bonebound_active_battle');

        // 4. Переход в Хаб
        document.getElementById('pvp-lobby-screen').style.display = 'none';
        
        // Открываем Хаб и сразу обновляем там цифры рейтинга
        window.PvpUI.openRankedHub();
        if (window.Cloud.playerData) {
            document.getElementById('hub-elo-val').innerText = window.Cloud.playerData.elo;
        }
    },

    updateVisualTimers: () => {
        const waitDisp = document.getElementById('wait-timer-disp');
        const waitScreen = document.getElementById('pvp-wait-screen');
        
        let enemyTime = window.PvpUI.enemyGameTime || 0;
        let isPaused = window.PvpUI.enemyIsPaused || false;

        if (waitScreen && waitScreen.style.display === 'flex' && window.PvpUI.myDeathTime !== null) {
            let m = Math.floor(enemyTime / 60);
            let s = Math.floor(enemyTime % 60);
            let timeStr = (m<10?'0'+m:m)+":"+(s<10?'0'+s:s);
            let status = isPaused ? " <span style='color:yellow'>(PAUSED)</span>" : "";
            
            let myM = Math.floor(window.PvpUI.myDeathTime / 60);
            let myS = Math.floor(window.PvpUI.myDeathTime % 60);
            let myStr = (myM<10?'0'+myM:myM)+":"+(myS<10?'0'+myS:myS);
            waitDisp.innerHTML = `You survived: ${myStr}<br>Opponent: ${timeStr}${status}`;
        }

        const spyHeader = document.querySelector('#pvp-spy-window .spy-header .spy-info');
        if (spyHeader) {
            let spyTimer = document.getElementById('spy-match-time');
            if (!spyTimer) {
                spyTimer = document.createElement('div');
                spyTimer.id = 'spy-match-time';
                spyTimer.style.fontSize = '12px';
                spyTimer.style.color = '#aaa';
                spyHeader.appendChild(spyTimer);
            }
            
            let eData = window.PvpUI.lastEnemyData || {};
            let eStage = eData.stage || 1;
            let eStTime = eData.stageTime || 0;
            
            let sm = Math.floor(eStTime / 60);
            let ss = Math.floor(eStTime % 60);
            let stageTimeStr = (sm<10?'0'+sm:sm)+":"+(ss<10?'0'+ss:ss);
            
            let totalM = Math.floor(enemyTime / 60);
            let totalS = Math.floor(enemyTime % 60);
            let totalStr = (totalM<10?'0'+totalM:totalM)+":"+(totalS<10?'0'+totalS:totalS);

            if (isPaused) {
                spyTimer.innerHTML = `<span style="color:yellow; font-weight:bold;">⏸ PAUSED</span>`;
            } else {
                spyTimer.innerHTML = `${totalStr} <span style="color:#aaa; font-size:10px;">(Total)</span><br><span style="color:#f1c40f; font-weight:bold;">S${eStage}: ${stageTimeStr}</span>`;
            }
        }
    },

    renderWaitStats: (enemyData, targetId = 'pvp-result-stats') => {
        const container = document.getElementById(targetId);
        if (!container) return;
        
        container.innerHTML = '';
        if (!enemyData) { container.innerHTML = '<div style="color:#777">No data...</div>'; return; }

        // --- 1. ПОДГОТОВКА ИНВЕНТАРЕЙ ---
        
        // Мой инвентарь
        let myItems = [];
        player.weapons.forEach(w => myItems.push({img: w.img, lvl: w.level}));
        for(let k in player.items) if(DB.items[k]) myItems.push({img: DB.items[k].img, lvl: player.items[k]});

        // Хелпер: Найти ID по картинке (для тултипов)
        const findIdByImg = (imgName) => {
            for(let k in DB.weapons) if(DB.weapons[k].img === imgName) return {id: k, type: 'weapon'};
            for(let k in DB.items) if(DB.items[k].img === imgName) return {id: k, type: 'item'};
            return null;
        };

        // --- 2. ОТРИСОВКА СЕТКИ ПРЕДМЕТОВ (С ТУЛТИПАМИ) ---
        const renderGrid = (items) => {
            let html = '<div class="res-inv-grid">';
            items.forEach(it => {
                let img = (typeof it === 'string') ? it : it.img;
                let lvl = (it.lvl || 1);
                
                let folder = 'items';
                let found = findIdByImg(img);
                if(found && found.type === 'weapon') folder = 'weapons';
                
                // Тултип
                let tooltipHtml = '';
                if (found) {
                    let name = tDB(found.id, 'name');
                    let desc = window.getItemDynamicDesc ? window.getItemDynamicDesc(found.id, lvl) : tDB(found.id, 'desc');
                    tooltipHtml = `<div class="tooltip"><b style="color:#f1c40f">${name}</b> (Lvl ${lvl})<br>${desc}</div>`;
                }

                html += `
                <div class="res-icon-slot">
                    <img src="sprites/${folder}/${img}" onerror="this.style.display='none'">
                    <span class="res-lvl">${lvl}</span>
                    ${tooltipHtml}
                </div>`;
            });
            html += '</div>';
            return html;
        };

        // --- 3. ОТРИСОВКА СУМКИ ТОРГОВЦА ---
        const renderMerchantRow = (merchArray) => {
            if (!merchArray || merchArray.length === 0) return '';
            
            let counts = {};
            merchArray.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

            let html = '<div class="res-merch-row">';
            for(let id in counts) {
                let count = counts[id];
                let itemDB = DB.shopItems.find(i => i.id === id);
                if(!itemDB) continue;

                // Считаем бонус
                let bonusText = "";
                if (itemDB.stats) {
                    let bonuses = [];
                    for (let k in itemDB.stats) {
                        let val = itemDB.stats[k] * count;
                        let name = t('stat_' + k) || k;
                        let valStr = ['might','moveSpeed','projSpeed','cooldown','area','duration','critChance','evasion'].includes(k) 
                            ? `+${(val*100).toFixed(0)}%` : `+${val}`;
                        if(k==='shopDefense') name = "Def";
                        bonuses.push(`${name}: ${valStr}`);
                    }
                    bonusText = bonuses.join('<br>');
                } else if (itemDB.effect === 'heal_full_maxhp_10') bonusText = `HP: +${10 * count}`;

                let img = `sprites/merchant/${itemDB.img}`;
                let name = t(itemDB.nameKey);

                html += `
                <div class="res-merch-slot border-${itemDB.rarity || 'common'}">
                    <img src="${img}">
                    <div class="tooltip"><b>${name} x${count}</b><br><span style="color:#2ecc71">${bonusText}</span></div>
                </div>`;
            }
            html += '</div>';
            return html;
        };

        // --- 4. СБОРКА ИНВЕНТАРЯ ---
    let invHtml = `
        <div class="res-inv-container" style="margin-bottom: 5px;"> <div class="res-inv-col">
                <div class="res-col-title" style="color:#2ecc71; font-size:12px;">YOU</div>
                ${renderGrid(myItems)}
                ${renderMerchantRow(player.merchantItems || [])}
            </div>
            <div class="res-inv-sep"></div>
            <div class="res-inv-col">
                <div class="res-col-title" style="color:#e74c3c; font-size:12px;">ENEMY</div>
                ${renderGrid(enemyData.items || [])}
                ${renderMerchantRow(enemyData.merchantItems || [])}
            </div>
        </div>
        `;

        // --- 5. СТАТИСТИКА (ВСЕ ПОЛЯ ВЕРНУЛ) ---
        // Хелперы форматирования
        const fmt = (v) => ((v || 0) * 100).toFixed(1) + '%';
        const fmtX = (v) => 'x' + (v || 1.0).toFixed(3);
        const fmtI = (v) => Math.floor(v || 0);

        const row = (label, myV, enV) => `
            <div class="res-stat-row">
                <div class="res-val">${myV}</div>
                <div class="res-label">${label}</div>
                <div class="res-val">${enV}</div>
            </div>`;

        let es = enemyData.stats || {};
        let ps = player.stats;

        // Применяем КАП 30% (0.3) для отображения
        const pCrit = Math.min(ps.critChance || 0, 0.3);
        const eCrit = Math.min(es.critChance || 0, 0.3);
        const pEva = Math.min(ps.evasion || 0, 0.3);
        const eEva = Math.min(es.evasion || 0, 0.3);
        const pVamp = Math.min(ps.vampChance || 0, 0.3);
        const eVamp = Math.min(es.vampChance || 0, 0.3);

        let statsHtml = `
        <div class="res-stats-box">
            ${row('KILLS', kills || 0, enemyData.kills || 0)}
            ${row('GOLD', Math.floor(player.gold || 0), enemyData.gold || 0)}
            ${row('LEVEL', player.level || 1, enemyData.lvl || 1)}
            
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
        </div>`;

        container.innerHTML = invHtml + statsHtml;
    },
};
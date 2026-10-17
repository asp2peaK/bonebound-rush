// game/matchmaking.js

window.Matchmaking = {
    isSearching: false,
    searchTimer: null,
    searchTimeSec: 0,
    isRankedSearch: false, // Запоминаем, какой был поиск

    // НАЧАТЬ ПОИСК
    startSearch: async (isRanked) => {
        if (window.Matchmaking.isSearching) return;
        if (!window.Cloud.user) { alert("Login first!"); return; }

        gameState = 'MATCHMAKING';

        window.Matchmaking.isSearching = true;
        window.Matchmaking.isRankedSearch = isRanked;
        window.Matchmaking.searchTimeSec = 0;
        
        // Скрываем предыдущие меню
        document.getElementById('pvp-menu-screen').style.display = 'none';
        document.getElementById('pvp-ranked-hub').style.display = 'none';
        
        // Показываем поиск
        document.getElementById('matchmaking-screen').style.display = 'flex';
        document.getElementById('mm-timer').innerText = "00:00";
        document.getElementById('mm-status').innerText = isRanked ? "Searching for Worthy Opponent..." : "Looking for a Brawl...";

        clearInterval(window.Matchmaking.searchTimer);
        window.Matchmaking.searchTimer = setInterval(() => {
            window.Matchmaking.searchTimeSec++;
            let m = Math.floor(window.Matchmaking.searchTimeSec / 60);
            let s = window.Matchmaking.searchTimeSec % 60;
            document.getElementById('mm-timer').innerText = (m<10?'0'+m:m)+":"+(s<10?'0'+s:s);
        }, 1000);

        const myUid = window.Cloud.user.uid;
        const myData = window.Cloud.playerData;
        const myElo = isRanked ? (myData.elo || 1000) : 0; 

        // Очищаем старые хвосты (если вдруг остались)
        await window.RTDB.remove(`queue/${myUid}`);
        await window.RTDB.remove(`invites/${myUid}`);

        // --- ЛОГИКА ПОИСКА (БЕЗ ИЗМЕНЕНИЙ, ОНА БЫЛА ВЕРНОЙ) ---
        const queueSnap = await window.RTDB.get('queue');
        console.log("DEBUG: Queue data received:", queueSnap);
        let opponent = null;

        if (queueSnap) {
            const ids = Object.keys(queueSnap);
            for (let id of ids) {
                if (id !== myUid) { opponent = { uid: id, ...queueSnap[id] }; break; }
            }
        }

        if (opponent) {
            console.log("Opponent found:", opponent.nickname);
            await window.RTDB.remove(`queue/${opponent.uid}`);
            
            const battleId = `battle_${Date.now()}_${Math.floor(Math.random()*1000)}`;
            
            await window.RTDB.set(`battles/${battleId}`, {
                player1: { uid: myUid, nickname: myData.nickname, elo: myElo, ready: false },
                player2: { uid: opponent.uid, nickname: opponent.nickname, elo: opponent.elo, ready: false },
                status: 'ban_char',
                bans: { char: [], weapon: [], item: [] }, // Пустые массивы для банов
                created: Date.now()
            });

            await window.RTDB.set(`invites/${opponent.uid}`, { battleId: battleId });
            window.Matchmaking.joinLobby(battleId);

        } else {
            console.log("Queue empty, waiting...");
            await window.RTDB.set(`queue/${myUid}`, {
                nickname: myData.nickname,
                elo: myElo,
                timestamp: Date.now()
            });

            window.RTDB.subscribe(`invites/${myUid}`, (data) => {
                if (data && data.battleId) {
                    window.RTDB.remove(`invites/${myUid}`);
                    window.RTDB.remove(`queue/${myUid}`);
                    window.Matchmaking.joinLobby(data.battleId);
                }
            });
        }
    },

    // ОТМЕНА ПОИСКА (ИСПРАВЛЕНО)
    cancelSearch: async () => {
        window.Matchmaking.isSearching = false;
        clearInterval(window.Matchmaking.searchTimer);
        const myUid = window.Cloud.user.uid;
        
        // Удаляем из базы
        await window.RTDB.remove(`queue/${myUid}`);
        window.RTDB.unsubscribe(`invites/${myUid}`);
        
        document.getElementById('matchmaking-screen').style.display = 'none';
        
        // Возвращаемся туда, откуда пришли
        if (window.Matchmaking.isRankedSearch) {
            document.getElementById('pvp-ranked-hub').style.display = 'flex';
        } else {
            document.getElementById('pvp-menu-screen').style.display = 'flex';
        }
    },

// game/matchmaking.js -> joinLobby

    joinLobby: async (battleId) => {
        window.Matchmaking.isSearching = false;
        clearInterval(window.Matchmaking.searchTimer);
        window.RTDB.currentBattleId = battleId;
        
        localStorage.setItem('bonebound_active_battle', battleId);
        
        // --- FIX ЦВЕТА ---
        const statusEl = document.getElementById('mm-status');
        statusEl.innerText = "MATCH FOUND!";
        // Жирный зеленый шрифт Cinzel
        statusEl.style.color = "#2ecc71"; 
        statusEl.style.fontFamily = "'Cinzel', serif";
        statusEl.style.fontWeight = "900";
        statusEl.style.fontSize = "32px";
        statusEl.style.textShadow = "0 0 15px rgba(46, 204, 113, 0.5)";
        // -----------------
        // -----------------
        
        setTimeout(async () => {
            if(window.PvpUI) window.PvpUI.openLobby(battleId);
        }, 1500);
    }
};
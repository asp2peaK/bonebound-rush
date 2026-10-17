// game/firebasemanager.js

// 1. ТВОЯ КОНФИГУРАЦИЯ
const firebaseConfig = {
    apiKey: "AIzaSyB45w6PpBlMQpMzlE9oO8qfUmC-o4YpVOg",
    authDomain: "bonebound-rush.firebaseapp.com",
    projectId: "bonebound-rush",
    storageBucket: "bonebound-rush.firebasestorage.app",
    messagingSenderId: "466060036368",
    appId: "1:466060036368:web:6d65cd3cee960ee8cefd95",
    measurementId: "G-KVRTNXEM1M",
    databaseURL: "https://bonebound-rush-default-rtdb.europe-west1.firebasedatabase.app"
};

// 2. ИНИЦИАЛИЗАЦИЯ
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized!");
} else {
    console.error("Critical: Firebase libraries missing in index.html");
}

const auth = firebase.auth();
const db = firebase.firestore();


// 3. ОБЛАЧНЫЙ МЕНЕДЖЕР
window.Cloud = {
    user: null, 
    playerData: null,
    isListenerInit: false, // Флаг защиты от двойного запуска

    // Сохранение истории (Limit 5)
    saveMatchHistory: async (matchData) => {
        if (!window.Cloud.user || !window.Cloud.playerData) return;
        let p = window.Cloud.playerData;
        
        if (!p.matchHistory) p.matchHistory = [];
        
        // Добавляем дату
        matchData.timestamp = Date.now();
        
        // В начало массива
        p.matchHistory.unshift(matchData);
        
        // Обрезаем до 5
        if (p.matchHistory.length > 5) p.matchHistory = p.matchHistory.slice(0, 5);
        
        // Сохраняем в RAM и Cloud
        window.Cloud.playerData = p;
        await window.Cloud.saveData(p);
        console.log("History Saved:", matchData);
    },

    // --- РЕГИСТРАЦИЯ ---
    register: async (email, password, nickname) => {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            window.Cloud.user = userCredential.user;
            
            const newProfile = {
                nickname: nickname,
                email: email,
                gold: 0,
                stats: { kills: 0, timePlayed: 0, runs: 0 },
                records: { bestTime: 0, bestTimeChar: 'knight', maxKills: 0, maxKillsChar: 'knight' },
                codex: { enemies: {}, items: {}, world: {} },
                settings: { musicVolume: 0.5, sfxVolume: 0.5, muted: false },
                friends: []
            };

            await window.Cloud.saveData(newProfile);
            window.Cloud.playerData = newProfile;
            return { success: true };
        } catch (error) {
            console.error("Reg Error:", error);
            return { success: false, msg: error.message };
        }
    },

    // --- ВХОД ---
    login: async (email, password) => {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            window.Cloud.user = userCredential.user;
            const data = await window.Cloud.loadData();
            window.Cloud.playerData = data;
            return { success: true };
        } catch (error) {
            return { success: false, msg: error.message };
        }
    },

    // --- ВЫХОД ---
    logout: async () => {
        await auth.signOut();
        window.Cloud.user = null;
        window.Cloud.playerData = null;
        window.Cloud.isListenerInit = false;
        location.reload(); 
    },

    // --- СОХРАНЕНИЕ ---
    saveData: async (gameData) => {
        if (!window.Cloud.user) return;
        try {
            await db.collection('players').doc(window.Cloud.user.uid).set(gameData, { merge: true });
        } catch (e) { console.error("Save Error:", e); }
    },

    // --- ЗАГРУЗКА ---
    loadData: async () => {
        if (!window.Cloud.user) return null;
        try {
            const doc = await db.collection('players').doc(window.Cloud.user.uid).get();
            return doc.exists ? doc.data() : null;
        } catch (e) { return null; }
    },

    // --- ТОП ИГРОКОВ ---
getLeaderboard: async (type) => {
        try {
            // --- FIX: ДОБАВИЛИ ELO ---
            let field = 'records.bestTime';
            if (type === 'kills') field = 'records.maxKills';
            if (type === 'elo') field = 'elo';
            // -------------------------

            const snapshot = await db.collection('players').orderBy(field, 'desc').limit(10).get();
            let list = [];
            snapshot.forEach(doc => list.push(doc.data()));
            return list;
        } catch (e) {
            console.error("Leaderboard Error:", e);
            return [];
        }
    },

    // --- КОДЕКС ---
    unlockCodexEnemy: (id) => {
        if (!window.Cloud.user || !window.Cloud.playerData) return;
        let p = window.Cloud.playerData;
        if (!p.codex) p.codex = { enemies: {}, items: {}, world: {} };
        if (!p.codex.enemies) p.codex.enemies = {};

        if (!p.codex.enemies[id]) p.codex.enemies[id] = { seen: true, kills: 1 };
        else p.codex.enemies[id].kills++;
        
        if (p.codex.enemies[id].kills === 1) window.Cloud.saveData(p);
    },

    unlockCodexItem: (id, level = 1) => {
        if (!window.Cloud.user || !window.Cloud.playerData) return;
        let p = window.Cloud.playerData;
        if (!p.codex) p.codex = { enemies: {}, items: {}, world: {} };
        if (!p.codex.items) p.codex.items = {};

        if (id === 'soul_stone') {
            let currentLvl = p.codex.items[id] || 0;
            if (level > currentLvl) {
                p.codex.items[id] = level;
                window.Cloud.saveData(p);
            }
            return;
        }
        if (!p.codex.items[id]) {
            p.codex.items[id] = true;
            window.Cloud.saveData(p);
        }
    },

    unlockCodexWorld: (id) => {
        if (!window.Cloud.user || !window.Cloud.playerData) return;
        let p = window.Cloud.playerData;
        if (!p.codex) p.codex = { enemies: {}, items: {}, world: {} };
        if (!p.codex.world) p.codex.world = {};

        if (!p.codex.world[id]) {
            p.codex.world[id] = true;
            window.Cloud.saveData(p);
        }
    },

    // --- ДРУЗЬЯ (ИСПРАВЛЕННАЯ ЛОГИКА) ---
    // --- ПРОВЕРКА НЕЗАВЕРШЕННЫХ БИТВ (ПРИ ВХОДЕ) ---
    // firebasemanager.js

    checkUnfinishedBattles: async () => {
        if (!window.Cloud.user) return;
        const myUid = window.Cloud.user.uid;
        
        // Ждем инициализации RTDB
        if (!window.RTDB || !window.RTDB.db) {
            setTimeout(() => window.Cloud.checkUnfinishedBattles(), 500);
            return;
        }
        
        const lastBattleId = localStorage.getItem('bonebound_active_battle');
        if (!lastBattleId) return;

        const snap = await window.RTDB.db.ref(`battles/${lastBattleId}`).once('value');
        const battle = snap.val();

        // Если битва есть и в ней нет победителя
        // Если битва есть, и победитель — НЕ Я (значит, я проиграл или вышел)
        // Если битва есть и победитель НЕ Я (значит я ливнул, или меня выкинуло, или я проиграл и закрыл)
        if (battle && battle.winner !== myUid) {
            console.log("Unfinished battle detected. Winner is not me. Penalty needed.");
            
            // 1. Если победителя вообще нет - ставим врага
            if (!battle.winner) {
                let enemyUid = (battle.player1.uid === myUid) ? battle.player2.uid : battle.player1.uid;
                await window.RTDB.db.ref(`battles/${lastBattleId}/winner`).set(enemyUid);
            }
            
            // 2. Снимаем ЭЛО МНЕ
            let p = window.Cloud.playerData;
            let currentElo = parseInt(p.elo);
            if (isNaN(currentElo)) currentElo = 1000;
            
            p.elo = currentElo - 25;

            // Записываем лив в историю
            const shameRecord = {
                result: 'abandon',
                eloChange: -25,
                timestamp: Date.now(),
                myChar: p.records?.maxKillsChar || 'knight',
                myBuild: [], 
                opponentNick: "Unknown", // При перезагрузке мы не знаем, кто это был
                opponentChar: "?",
                opponentBuild: [],
                stats: { damage: 0 }
            };
            
            if (!p.matchHistory) p.matchHistory = [];
            p.matchHistory.unshift(shameRecord);
            if (p.matchHistory.length > 5) p.matchHistory = p.matchHistory.slice(0, 5);
            
            // Сохраняем
            window.Cloud.playerData = p; 
            await window.Cloud.saveData(p);
            
            console.log("Penalty applied: -25. New Elo:", p.elo);

            // 3. Обновляем UI с задержкой (ждем прогрузки DOM)
            setTimeout(() => {
                if (document.getElementById('hub-elo-val')) document.getElementById('hub-elo-val').innerText = p.elo;
                if (document.getElementById('rank-elo-disp')) document.getElementById('rank-elo-disp').innerText = p.elo;
                
                if(window.showNotification) window.showNotification("Match abandoned! -25 MMR Penalty", "red");
            }, 1500); // Чуть увеличил время до 1.5 сек, чтобы интерфейс точно был готов
        }
        
        // Очищаем, чтобы при следующем входе не сработало снова
        localStorage.removeItem('bonebound_active_battle');
    },
    // 0. СЛУШАТЕЛЬ СОБЫТИЙ (Real-time)
    initFriendListener: () => {
        if (!window.Cloud.user) return;
        if (window.Cloud.isListenerInit) return; // ЗАЩИТА ОТ ДВОЙНОГО ЗАПУСКА
        
        window.Cloud.isListenerInit = true;
        const myUid = window.Cloud.user.uid;
        
        console.log("Friends Listener Started");

        // A. Слушаем ВХОДЯЩИЕ заявки
        db.collection('friend_requests')
            .where('to', '==', myUid)
            .where('status', '==', 'pending')
            .onSnapshot(snapshot => {
                let count = snapshot.size;
                if(window.updateFriendBadge) window.updateFriendBadge(count);
                
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        if(window.showNotification) window.showNotification("New Friend Request!");
                    }
                });
            });

        // B. Слушаем ИСХОДЯЩИЕ заявки (Если нас приняли)
        db.collection('friend_requests')
            .where('from', '==', myUid)
            .where('status', '==', 'accepted')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added' || change.type === 'modified') {
                        if(window.showNotification) window.showNotification(`User accepted your request!`);
                        
                        // МЫ НЕ ДОБАВЛЯЕМ ДРУГА ТУТ ВРУЧНУЮ
                        // Блок C (ниже) сделает это сам, так как база обновилась
                        
                        // Просто чистим заявку
                        db.collection('friend_requests').doc(change.doc.id).delete();
                    }
                });
            });

        // C. СЛУШАЕМ СВОЙ ПРОФИЛЬ (ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ)
        // Это блок отвечает за актуальность списка друзей
        db.collection('players').doc(myUid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            const serverFriends = data.friends || [];
            
            // Просто берем то, что на сервере. Никаких дублей.
            window.Cloud.playerData.friends = serverFriends;

            // Если список открыт - обновляем его
            const listBtn = document.getElementById('btn-friend-list');
            if (listBtn && (listBtn.style.background.includes('f39c12') || listBtn.style.background.includes('rgb(243, 156, 18)'))) {
                window.loadFriendsTab('list');
            }
        });
    },

    // 1. Поиск по нику
findUserByNick: async (nick) => {
        if (!nick) return [];
        try {
            // Трюк Firebase для поиска "начинается с..."
            const end = nick + '\uf8ff';
            
            const snap = await db.collection('players')
                .where('nickname', '>=', nick)
                .where('nickname', '<=', end)
                .limit(5) // Ограничиваем до 5 результатов, чтобы не грузить лишнее
                .get();

            let found = [];
            snap.forEach(doc => { 
                found.push({ uid: doc.id, ...doc.data() }); 
            });
            return found;
        } catch (e) { 
            console.error("Search Error:", e); 
            return []; 
        }
    },

    // 2. Отправить заявку
    sendFriendRequest: async (toUid) => {
        const myUid = window.Cloud.user.uid;
        const myNick = window.Cloud.playerData.nickname;
        
        if (window.Cloud.playerData.friends && window.Cloud.playerData.friends.includes(toUid)) {
            if(window.showNotification) window.showNotification("Already friends!", "red");
            return;
        }

        await db.collection('friend_requests').add({
            from: myUid,
            fromName: myNick,
            to: toUid,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        if(window.showNotification) window.showNotification("Request sent!");
        document.getElementById('search-results').innerHTML = '';
    },

    // 3. Получить заявки
    getFriendRequests: async () => {
        const myUid = window.Cloud.user.uid;
        const snap = await db.collection('friend_requests')
            .where('to', '==', myUid)
            .where('status', '==', 'pending')
            .get();
        let list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        return list;
    },

    // 4. Принять/Отклонить (ОБНОВЛЕНО: БЕЗ РУЧНОГО PUSH)
    respondFriend: async (reqId, accept, friendUid, friendName) => {
        const reqRef = db.collection('friend_requests').doc(reqId);
        
        if (accept) {
            const myUid = window.Cloud.user.uid;
            
            // 1. Обновляем БД
            await db.collection('players').doc(myUid).update({
                friends: firebase.firestore.FieldValue.arrayUnion(friendUid)
            });
            await db.collection('players').doc(friendUid).update({
                friends: firebase.firestore.FieldValue.arrayUnion(myUid)
            });
            await reqRef.update({ status: 'accepted' });

            // Мы НЕ добавляем друга в window.Cloud.playerData.friends вручную.
            // Слушатель (Блок C) увидит изменение в базе и обновит массив сам.
            // Это предотвращает дублирование.

            if(window.showNotification) window.showNotification(`You are now friends with ${friendName}!`);
            
            // Переключаем вкладку (данные подгрузятся мгновенно через слушатель)
            setTimeout(() => window.loadFriendsTab('list'), 200); 

        } else {
            await reqRef.delete();
            if(window.showNotification) window.showNotification("Request declined.", "red");
            window.loadFriendsTab('requests');
        }
    },

    // 5. Список друзей
    getFriendsList: async () => {
        const myFriends = window.Cloud.playerData.friends || [];
        if (myFriends.length === 0) return [];
        let list = [];
        for (let uid of myFriends) {
            const doc = await db.collection('players').doc(uid).get();
            if (doc.exists) list.push({ uid: doc.id, ...doc.data() });
        }
        return list;
    },
    
    // 6. Удалить друга
    removeFriend: async (uid) => {
        const myUid = window.Cloud.user.uid;
        
        await db.collection('players').doc(myUid).update({
            friends: firebase.firestore.FieldValue.arrayRemove(uid)
        });
        await db.collection('players').doc(uid).update({
            friends: firebase.firestore.FieldValue.arrayRemove(myUid)
        });

        if(window.showNotification) window.showNotification("Friend removed.", "red");
        // Слушатель C сам обновит список и удалит друга
    }
};

// Слушатель входа
auth.onAuthStateChanged(async (user) => {
    if (user) {
        window.Cloud.user = user;
        const data = await window.Cloud.loadData();
        window.Cloud.playerData = data;
        
        window.Cloud.initFriendListener();
        
        // --- ПРОВЕРЯЕМ ЛИВЕРОВ ---
        window.Cloud.checkUnfinishedBattles(); 
        // -------------------------
        
        if(window.updateMainMenuUI) window.updateMainMenuUI();
    }
});
// game/rtdb_manager.js

// ВАЖНО: Ссылка на твою базу в Европе
const RTDB_URL = "https://bonebound-rush-default-rtdb.europe-west1.firebasedatabase.app";

window.RTDB = {
    db: null,
    currentBattleId: null,
    opponentId: null,
    isHost: false,

    // Инициализация
    init: () => {
        if (!firebase) return;
        
        try {
            // Передаем URL вторым параметром, чтобы починить ошибку региона
            window.RTDB.db = firebase.database(firebase.app(), RTDB_URL);
            console.log("RTDB Initialized with URL:", RTDB_URL);
            
            // Слушаем статус соединения
            window.RTDB.db.ref(".info/connected").on("value", (snap) => {
                if (snap.val() === true) {
                    console.log("RTDB: Connected");
                    // При разрыве соединения удаляем себя из очереди
                    if (window.Cloud.user) {
                        window.RTDB.db.ref(`queue/${window.Cloud.user.uid}`).onDisconnect().remove();
                    }
                } else {
                    console.log("RTDB: Disconnected");
                }
            });
        } catch (e) {
            console.error("RTDB Init Error:", e);
        }
    },

    // Базовые функции (остались без изменений)
    set: async (path, data) => window.RTDB.db.ref(path).set(data),
    get: async (path) => {
        const snap = await window.RTDB.db.ref(path).once('value');
        return snap.val();
    },
    subscribe: (path, callback) => {
        const ref = window.RTDB.db.ref(path);
        ref.on('value', (snap) => callback(snap.val()));
        return ref; 
    },
    unsubscribe: (path) => window.RTDB.db.ref(path).off(),
    remove: async (path) => window.RTDB.db.ref(path).remove(),
// --- ВСТАВЛЯЕМ СЮДА ---

    // Установить ловушку: если я отключусь, соперник (winnerId) победит
    setDisconnectHook: (battleId, winnerUid) => {
        if (!window.RTDB.db) return;
        // Если я пропаду, поле winner станет ID моего соперника
        window.RTDB.db.ref(`battles/${battleId}/winner`).onDisconnect().set(winnerUid);
    },

    // Убрать ловушку (когда матч завершился нормально)
    cancelDisconnectHook: (battleId) => {
        if (!window.RTDB.db) return;
        window.RTDB.db.ref(`battles/${battleId}/winner`).onDisconnect().cancel();
    }

}; // <-- Закрывающая скобка объекта window.RTDB

setTimeout(() => window.RTDB.init(), 1000);
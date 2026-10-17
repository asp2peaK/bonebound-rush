// game/friends.js

window.openFriendsMenu = function() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('friends-screen').style.display = 'flex';
    window.loadFriendsTab('list');
}

window.closeFriendsMenu = function() {
    document.getElementById('friends-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
}

// Вспомогательная функция для удаления (вызывает модалку)
window.askRemoveFriend = function(uid, name) {
    window.showCustomModal(
        "REMOVE FRIEND", 
        `Are you sure you want to remove ${name}?`, 
        () => window.Cloud.removeFriend(uid)
    );
}

window.loadFriendsTab = async function(tab) {
    const content = document.getElementById('friends-content');
    content.innerHTML = '<div style="color:#aaa; text-align:center; margin-top:20px;">Loading...</div>';
    
    ['list', 'requests', 'search'].forEach(t => {
        document.getElementById('btn-friend-'+t).style.background = (t===tab ? '#f39c12' : '#555');
    });

    if (tab === 'list') {
        const friends = await window.Cloud.getFriendsList();
        if (!friends || friends.length === 0) {
            content.innerHTML = '<div style="text-align:center; color:#777; margin-top:50px;">No friends yet.<br>Go to SEARCH to find someone!</div>';
            return;
        }
        let html = '';
        friends.forEach(f => {
            html += `
            <div class="friend-row">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="sprites/other/${f.records?.maxKillsChar || 'knight'}_s.png" style="width:32px; height:32px; border-radius:4px; background:#222; border:1px solid #444;" onerror="this.style.display='none'">
                    <div>
                        <div style="font-weight:bold; color:#f1c40f;">${f.nickname}</div>
                        <div style="font-size:12px; color:#aaa;">Offline</div>
                    </div>
                </div>
                <button class="btn-small" style="background:#c0392b" onclick="window.askRemoveFriend('${f.uid}', '${f.nickname}')">X</button>
            </div>`;
        });
        content.innerHTML = html;
    } 
    
    else if (tab === 'requests') {
        const reqs = await window.Cloud.getFriendRequests();
        if (!reqs || reqs.length === 0) {
            content.innerHTML = '<div style="text-align:center; color:#777; margin-top:50px;">No pending requests.</div>';
            return;
        }
        let html = '';
        reqs.forEach(r => {
            // Передаем ID и Имя отправителя в функцию
            html += `
            <div class="friend-row">
                <div style="font-weight:bold; color:#3498db;">${r.fromName}</div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-small" style="background:#2ecc71" onclick="window.Cloud.respondFriend('${r.id}', true, '${r.from}', '${r.fromName}')">ACCEPT</button>
                    <button class="btn-small" style="background:#c0392b" onclick="window.Cloud.respondFriend('${r.id}', false)">DECLINE</button>
                </div>
            </div>`;
        });
        content.innerHTML = html;
    }
    
    else if (tab === 'search') {
        content.innerHTML = `
            <div style="display:flex; gap:10px; justify-content:center; margin-bottom:20px;">
                <input type="text" id="friend-search-input" placeholder="Enter Nickname..." class="auth-input" style="width:200px;">
                <button class="btn" style="min-width:100px; padding:10px; margin:0;" onclick="window.searchFriend()">FIND</button>
            </div>
            <div id="search-results"></div>
        `;
    }
}

// game/friends.js -> Замени searchFriend

window.searchFriend = async function() {
    const nick = document.getElementById('friend-search-input').value;
    const resDiv = document.getElementById('search-results');
    
    if (!nick) return;

    resDiv.innerHTML = '<div style="text-align:center; color:#aaa;">Searching...</div>';
    
    // Получаем массив игроков
    const users = await window.Cloud.findUserByNick(nick);
    
    if (!users || users.length === 0) {
        resDiv.innerHTML = '<div style="color:#e74c3c; text-align:center;">No users found</div>';
        return;
    }
    
    let html = '';
    let foundSelf = false;

    users.forEach(user => {
        // Пропускаем самого себя
        if (user.uid === window.Cloud.user.uid) {
            foundSelf = true;
            return;
        }

        html += `
        <div class="friend-row" style="background:#2c3e50; margin-bottom: 5px;">
            <div style="font-weight:bold; color:#fff;">${user.nickname}</div>
            <button class="btn-small" style="background:#f39c12" onclick="window.Cloud.sendFriendRequest('${user.uid}')">ADD</button>
        </div>`;
    });

    if (html === '') {
        if (foundSelf) resDiv.innerHTML = '<div style="color:#f1c40f; text-align:center;">That is you!</div>';
        else resDiv.innerHTML = '<div style="color:#e74c3c; text-align:center;">No match found</div>';
    } else {
        resDiv.innerHTML = html;
    }
}
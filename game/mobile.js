// game/mobile.js

window.initMobileControls = function() {
    console.log("Initializing Mobile Controls...");
    
    const ui = document.getElementById('mobile-controls');
    if (ui) ui.style.display = 'block';

    // 1. ДЖОЙСТИК (NIPPLE.JS)
    const zone = document.getElementById('joystick-zone');
    if (zone && window.nipplejs) {
        const manager = nipplejs.create({
            zone: zone,
            mode: 'static',
            position: { left: '100px', bottom: '80px' }, // Позиция джойстика
            color: 'white',
            size: 120
        });

        // Обработка движения
        manager.on('move', function (evt, data) {
            if (data.angle) {
                // Превращаем угол в нажатия клавиш WASD
                // logic.js читает объект keys, поэтому мы просто меняем его
                resetMoveKeys();
                
                const deg = data.angle.degree;
                
                // Вверх (W)
                if (deg > 45 && deg < 135) keys['KeyW'] = true;
                // Вниз (S)
                if (deg > 225 && deg < 315) keys['KeyS'] = true;
                // Влево (A)
                if (deg > 135 && deg < 225) keys['KeyA'] = true;
                // Вправо (D)
                if (deg < 45 || deg > 315) keys['KeyD'] = true;
            }
        });

        // Когда отпускаем палец - сброс
        manager.on('end', function () {
            resetMoveKeys();
        });
    }

    // 2. КНОПКА ДЕЙСТВИЯ (E)
    const btnAction = document.getElementById('btn-mobile-action');
    if (btnAction) {
        btnAction.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Чтобы не было зума или скролла
            keys['KeyE'] = true;
            
            // Если мы в магазине/наковальне - это тоже работает как клик
            // Но лучше эмулировать нажатие клавиши
        });
        btnAction.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['KeyE'] = false;
        });
    }

    // 3. КНОПКА ПАУЗЫ (||)
    const btnPause = document.getElementById('btn-mobile-pause');
    if (btnPause) {
        btnPause.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (window.togglePause) window.togglePause();
        });
    }
};

// Сброс клавиш движения
function resetMoveKeys() {
    keys['KeyW'] = false;
    keys['KeyS'] = false;
    keys['KeyA'] = false;
    keys['KeyD'] = false;
    keys['ArrowUp'] = false;
    keys['ArrowDown'] = false;
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
}
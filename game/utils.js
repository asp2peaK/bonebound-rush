// game/utils.js

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Генерация ключа спрайта (base + direction)
// Используется для анимации поворота персонажей и врагов
function getSpriteKey(baseName, direction) {
    if (direction === 'left') return baseName; 
    return baseName + '_' + direction; 
}

// Перемешивание массива (Алгоритм Фишера-Йейтса)
// Используется для музыки и генерации карточек
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- ФИЗИКА И МАТЕМАТИКА ---

// 1. Проверка пересечения двух прямоугольников (AABB)
// A и B должны иметь свойства: x, y, width, height (координаты центра)
function checkRectCollision(a, b) {
    return (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
           (Math.abs(a.y - b.y) * 2 < (a.height + b.height));
}

// 2. Получает 4 угла повернутого прямоугольника
// (x, y - центр), (w, h - размеры), (angle - угол в радианах)
function getRotatedCorners(x, y, w, h, angle) {
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    let dx = w / 2;
    let dy = h / 2;

    // 4 угла относительно центра, потом поворот + смещение
    return [
        { x: x + (dx * cos - dy * sin), y: y + (dx * sin + dy * cos) }, // Нижний правый
        { x: x + (-dx * cos - dy * sin), y: y + (-dx * sin + dy * cos) }, // Нижний левый
        { x: x + (-dx * cos - -dy * sin), y: y + (-dx * sin + -dy * cos) }, // Верхний левый
        { x: x + (dx * cos - -dy * sin), y: y + (dx * sin + -dy * cos) }  // Верхний правый
    ];
}

// 3. Проверка пересечения двух наборов углов (Separating Axis Theorem)
// Используется для точных столкновений повернутых лазеров
function checkPolygonCollision(polyA, polyB) {
    let polygons = [polyA, polyB];
    for (let i = 0; i < polygons.length; i++) {
        let polygon = polygons[i];
        for (let j = 0; j < polygon.length; j++) {
            let p1 = polygon[j];
            let p2 = polygon[(j + 1) % polygon.length];
            let normal = { x: -(p2.y - p1.y), y: p2.x - p1.x }; // Нормаль
            
            let minA = Infinity, maxA = -Infinity;
            for (let p of polyA) {
                let projected = normal.x * p.x + normal.y * p.y;
                if (projected < minA) minA = projected;
                if (projected > maxA) maxA = projected;
            }

            let minB = Infinity, maxB = -Infinity;
            for (let p of polyB) {
                let projected = normal.x * p.x + normal.y * p.y;
                if (projected < minB) minB = projected;
                if (projected > maxB) maxB = projected;
            }

            if (maxA < minB || maxB < minA) return false; // Есть разделение -> нет удара
        }
    }
    return true; // Нет разделения -> есть пересечение
}
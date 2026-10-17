// game/elo.js

window.EloSystem = {
    // K-фактор определяет, как сильно меняется рейтинг
    // 32 для новичков, 16 для опытных
    getKFactor: (rating) => {
        if (rating < 2000) return 32;
        return 16;
    },

    // Расчет шанса победы (от 0 до 1)
    getExpectedScore: (ratingA, ratingB) => {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    },

    // Главная функция: возвращает новый рейтинг
    // actualScore: 1 (победа), 0 (поражение), 0.5 (ничья)
    calculateNewRating: (currentRating, opponentRating, actualScore) => {
        const k = window.EloSystem.getKFactor(currentRating);
        const expected = window.EloSystem.getExpectedScore(currentRating, opponentRating);
        const change = Math.round(k * (actualScore - expected));
        
        return {
            newRating: currentRating + change,
            change: change
        };
    }
};
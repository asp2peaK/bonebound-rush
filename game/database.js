// game/database.js

// --- КОНСТАНТЫ ---
const TILE_SIZE = 128; 
const MAP_TILES = 40; 
const WORLD_SIZE = TILE_SIZE * MAP_TILES; 
const MAX_WEAPONS = 2; 
const MAX_ITEMS = 5;

// --- ПОТОЛКИ СТАТОВ (единое место) ---
// Обычные источники (карточки, магазин, пассивки предметов) не поднимают стат выше потолка.
// Проклятия («сверх лимита») могут его превысить. Уже набранное значение никогда не уменьшается.
const STAT_CAPS = { critChance: 0.30, evasion: 0.30, vampChance: 0.30 };

function capStat(key, value) {
    return STAT_CAPS[key] !== undefined ? Math.min(value, STAT_CAPS[key]) : value;
}

function addCappedStat(stats, key, amount) {
    const cur = stats[key] || 0;
    const next = cur + amount;
    const cap = STAT_CAPS[key];
    stats[key] = (cap !== undefined && next > cap) ? Math.max(cur, cap) : next;
}

// ДЕФОЛТНЫЙ ЯЗЫК
let currentLang = 'en';

const TRANSLATIONS = {
    ru: {
        // UI
        btn_play: "ИГРАТЬ", btn_fight: "В БОЙ!",
        btn_knight: "РЫЦАРЬ", btn_mage: "МАГ", btn_thief: "ВОР", btn_butcher: "МЯСНИК", 
        btn_alchemist: "АЛХИМИК", btn_spartan: "СПАРТАНЕЦ", btn_nun: "МОНАХИНЯ", 
        btn_exorcist: "ЭКЗОРЦИСТ", btn_preacher: "ПРОПОВЕДНИК",
        btn_settings: "НАСТРОЙКИ", btn_back: "НАЗАД", btn_ranking: "РЕЙТИНГ",
        btn_resume: "ПРОДОЛЖИТЬ", btn_menu: "ГЛАВНОЕ МЕНЮ", btn_restart: "НОВЫЙ ЗАБЕГ",
        settings_title: "НАСТРОЙКИ", lang_label: "ЯЗЫК", vol_label: "ГРОМКОСТЬ",
        pause_title: "ПАУЗА", gameover_title: "ВЫ ПОГИБЛИ",
        boss_warn: "БОСС!", boss_mini: "МИНИ-БОСС",
        "FIND THE PORTAL!": "НАЙДИ ПОРТАЛ!", "SURVIVAL MODE": "РЕЖИМ ВЫЖИВАНИЯ",
        lvl: "УР:", 
        upg_title_lvl: "НОВЫЙ УРОВЕНЬ!", upg_desc_lvl: "Выберите улучшение характеристик",
        upg_title_chest: "СУНДУК", upg_title_gold: "ЗОЛОТОЙ СУНДУК",
        upg_desc_chest: "Цена следующего: {cost} зол.",
        new_item: "Новое", new_level: "Ур. {lvl}",
        scales_with: "Скейлится от:", good_for: "Подходит для:", btn_banish: "УДАЛИТЬ",
        shop_title: "СТРАНСТВУЮЩИЙ ТОРГОВЕЦ", shop_desc: "Есть редкий товар, незнакомец...",
        btn_buy: "КУПИТЬ", btn_leave_shop: "УЙТИ", btn_remove_item: "УДАЛИТЬ ПРЕДМЕТ (5000 G)", shop_sold_out: "ПРОДАНО",

        // СТАТЫ (FIX: Добавлены недостающие)
        stat_might: "Сила", stat_moveSpeed: "Скор. Бега", stat_projSpeed: "Скорость Снарядов", 
        stat_cooldown: "Скорострельность", stat_area: "Зона Поражения", stat_luck: "Удача", 
        stat_amount: "Кол-во снарядов", stat_curse: "Проклятие", 
        stat_vampChance: "Шанс Вампиризма", stat_vampPower: "Сила Вампиризма", 
        stat_growth: "Опыт (Growth)", stat_greed: "Золото (Greed)", 
        stat_duration: "Длительность", stat_critChance: "Шанс Крита", 
        stat_evasion: "Уклонение", stat_critDamage: "Крит. Урон",
        stat_maxHp: "Макс. Здоровье", stat_hpRegen: "Регенерация", 
        stat_shopDefense: "Защита (Броня)", stat_thorns: "Шипы", stat_magnet: "Магнит",

        stat_desc_might: "Урон оружия", stat_desc_moveSpeed: "Скорость передвижения героя", 
        stat_desc_projSpeed: "Ускоряет полет и вращение атак",
        stat_desc_cooldown: "Оружие атакует чаще", stat_desc_area: "Увеличивает размер атак и радиус взрывов", 
        stat_desc_luck: "Влияет на редкость предметов", stat_desc_amount: "+1 снаряд к оружию", 
        stat_desc_curse: "Сложность и кол-во врагов", stat_desc_vampChance: "Шанс лечения при ударе", 
        stat_desc_vampPower: "Лечение (+HP)", stat_desc_growth: "Бонус опыта (ед.)", 
        stat_desc_greed: "Бонус золота (ед.)", stat_desc_duration: "Атаки дольше остаются на экране",
        stat_desc_critChance: "Шанс нанести x2.0 урона", stat_desc_evasion: "Шанс полностью избежать урона", 
        stat_desc_critDamage: "Множитель урона при крите",
        
        kill_count: "Убийств", time_survived: "Время", final_stats: "Характеристики", 
        items_collected: "Снаряжение", reroll_btn: "Заменить", gold_earned: "Золото", level_reached: "Уровень",

        // ПРЕДМЕТЫ ТОРГОВЦА (Названия)
        name_shop_meal: "Сытный Ужин", desc_shop_meal: "Полное лечение + 10 Макс. HP",
        name_shop_supplies: "Припасы", desc_shop_supplies: "+1 Реролл для сундуков",
        name_shop_pepper: "Драконий Перец", desc_shop_pepper: "+5% Силы (Might)",
        name_shop_gym: "Абонемент в Зал", desc_shop_gym: "+10 Макс. HP",
        name_shop_compass: "Сломанный Компас", desc_shop_compass: "+5 Удачи (Luck)",
        name_shop_espresso: "Двойной Эспрессо", desc_shop_espresso: "+10% Скорострельности",
        name_shop_mystery: "Таинственный Свиток", desc_shop_mystery: "+1 Уровень случайному предмету",
        name_shop_map: "Древняя Карта", desc_shop_map: "+15% Зона сбора и Размер",

        // КЛАДБИЩЕ (STAGE 1)
        name_shop_bonedust: "Прах Костей", desc_shop_bonedust: "+5% Скорость Снарядов",
        name_shop_shovel: "Лопата Могильщика", desc_shop_shovel: "+6 Золота (Greed)",
        name_shop_holywater: "Святая Вода", desc_shop_holywater: "0.5 ХП регена (раз в 3 сек)",
        name_shop_shield: "Щит Паладина", desc_shop_shield: "-15% Получаемого урона",

        // ПУСТЫНЯ (STAGE 2)
        name_shop_boots: "Сапоги Путника", desc_shop_boots: "+5% Скорость Бега",
        name_shop_cactus: "Кактусовый Сок", desc_shop_cactus: "+10% Шипы (Возврат урона)",
        name_shop_scarab: "Золотой Скарабей", desc_shop_scarab: "+10 Удачи и +10 Жадности",
        name_shop_mirage: "Мираж в Бутылке", desc_shop_mirage: "+10% Уклонение (Evasion)",

        // ВУЛКАН (STAGE 3)
        name_shop_coal: "Горячий Уголь", desc_shop_coal: "+10% Длительность (Lifetime)",
        name_shop_magma: "Магматический Камень", desc_shop_magma: "+5% Шанс Крита",
        name_shop_fireheart: "Сердце Огня", desc_shop_fireheart: "+15% Сила и +15% Зона",
        name_shop_dragoneye: "Глаз Дракона", desc_shop_dragoneye: "+20% Шанс Крита и +0.25 Крит Урона",

        // ПЕЩЕРЫ (STAGE 4)
        name_shop_mushroom: "Светящийся Гриб", desc_shop_mushroom: "+20 Магнит (Радиус)",
        name_shop_geode: "Геода", desc_shop_geode: "-5% Получаемого урона",
        name_shop_focus: "Кристальный Фокус", desc_shop_focus: "+15% Скорострельности",
        name_shop_prism: "Треснувшая Призма", desc_shop_prism: "+2 Снаряда (Amount)",

        // НАКОВАЛЬНЯ И ПРОКЛЯТИЯ
        cursed_anvil_title: "ПРОКЛЯТАЯ НАКОВАЛЬНЯ", cursed_anvil_desc: "Прими тьму, чтобы обрести силу...", anvil_warning: "⚠ ВНИМАНИЕ: Прокачка предмета ЗАМОРОЗИТСЯ!",
        btn_curse: "ПРОКЛЯСТЬ!", press_e_anvil: "E - ПРОКЛЯСТЬ", need_more_power: "Нужно больше предметов (2+)...", cursed_prefix: "(ПРОКЛЯТО) ",
        
        name_c_sword: "Тяжелый Убийца", name_c_wand: "Жезл Хаоса", name_c_axe: "Топор Титана", name_c_knife: "Кинжал Ассасина",
        name_c_garlic: "Кровавый Чеснок", name_c_bible: "Запретные Тома", name_c_spear: "Лонгинус", name_c_holywater: "Адское Пламя", 
        name_c_cross: "Распятие", name_c_armor: "Проклятые Латы", // НОВЫЕ ПРОКЛЯТИЯ (Названия)
        name_c_frost_orb: "Ледник", name_c_fire_scroll: "Напалм",
        name_c_katana: "Кровавый Порыв", name_c_landmines: "Кассетная Бомба",
        // ПРОКЛЯТИЯ (Названия)
        name_c_whetstone: "Острый Осколок", name_c_mist_cloak: "Саван Теней", name_c_scope: "Туннельное Зрение", name_c_empty_bottle: "Кровавый Сосуд",
        name_c_coffee: "Передозировка", name_c_heavy_stone: "Гравитация", name_c_coin_purse: "Дырявый Карман", name_c_light_feather: "Проклятое Перо",

        cdesc_sword: "Урон x3, но Атака в 3 раза реже",
        cdesc_wand: "+3 Снаряда, но Урон -40% и Разброс",
        cdesc_axe: "Размер +50%, но летят в 2 раза медленнее",
        cdesc_knife: "Крит 50% и Пронзание, но Всегда 1 нож",
        cdesc_garlic: "Вампиризм, но Радиус -40%",
        cdesc_bible: "Бесконечная длительность, но Вращение -70%",
        cdesc_spear: "+3 Копья (Веер), но Атака реже (x1.5)",
        cdesc_holywater: "Лужи +40%, но Наносят урон ТЕБЕ",
        cdesc_cross: "Стоит на месте и крутится, не возвращается",
        cdesc_armor: "Входящий урон -50%, но Скорость Бега -30%", cdesc_spinach: "Сила +30%, но Макс. ХП -20%", cdesc_hollow_heart: "Макс. ХП +100%, но Сила -30%",
        cdesc_boots: "Скорость +30%, но Макс. ХП -30%", cdesc_candle: "Зона +30%, но Атаки реже (-20%)", cdesc_gloves: "Скорострельность +30%, но Зона -30%",
        cdesc_clover: "Удача +30, но Опыт -30%", cdesc_mask: "Вампиризм +20%, но Макс. ХП -50%", cdesc_skull_ring: "Крит +20%, но Проклятие +30%",
        // НОВЫЕ ПРОКЛЯТИЯ (Описания)
        cdesc_frost_orb: "Висит на тебе щитом (10 сек), не летит",
        cdesc_fire_scroll: "Взрыв не наносит урон, но создает Вечный Огонь",
        cdesc_katana: "Крит +20%, но Бьет медленнее в 2.5 раз",
        cdesc_landmines: "Мина распадается на 3 мелкие при взрыве",
        // ПРОКЛЯТИЯ (Описания)
        cdesc_whetstone: "+15% Крит (сверх лимита), но -30% Урон",
        cdesc_mist_cloak: "+10% Уклонение, но +25% Входящий Урон",
        cdesc_scope: "+0.5 Крит Урон, но -30% Область",
        cdesc_empty_bottle: "+30 Сила Хилла, но Шанс всегда 1%",
        cdesc_coffee: "+30% Скор. Атаки, но Косая Стрельба",
        cdesc_heavy_stone: "+30% Урон, но -50% Скорость",
        cdesc_coin_purse: "+50 Жадность, но Золото исчезает быстро",
        cdesc_light_feather: "+40% Скорость, но +25% Входящий Урон",

        name_c_spiked_pauldrons: "Шипы Мученика", name_c_ninja_headband: "Повязка Смертника", name_c_magnet_boots: "Грави-Сапоги",
        name_c_ruby_ring: "Кровавый Рубин", name_c_sapphire_amulet: "Хрупкий Сапфир", name_c_sniper_lens: "Туннельная Линза", name_c_explosive_powder: "Нестабильный Порох",

        cdesc_spiked_pauldrons: "Шипы +30%, но Скорость -40%",
        cdesc_ninja_headband: "Ск. Атаки +30%, но Макс. ХП -40%",
        cdesc_magnet_boots: "Магнит +350, но Скорость -40%",
        cdesc_ruby_ring: "Сила +30%, но Зона -40%",
        cdesc_sapphire_amulet: "Ск. Атаки +30%, но Время жизни -40%",
        cdesc_sniper_lens: "Ск. Снарядов +30%, но Зона -40%",
        cdesc_explosive_powder: "Зона +30%, но Ск. Атаки -40%",
        name_c_berserker_blood: "Ярость Безумца", name_c_golden_idol: "Проклятое Золото", name_c_glass_cannon: "Хрупкая Сила",
        name_c_adrenaline_shot: "Передозировка", name_c_mana_crystal: "Искаженный Кристалл",

        cdesc_berserker_blood: "Сила +30%, но Макс. ХП -50%",
        cdesc_golden_idol: "Рост силы x2, но теряешь золото при ударе",
        cdesc_glass_cannon: "Сила +30%, но СТАН при получении урона",
        cdesc_adrenaline_shot: "Спидхак (+Скорость/Атака), но НЕЛЬЗЯ СТОЯТЬ",
        cdesc_mana_crystal: "Скор. Атаки +30%, но Сила -40%",
                
        name_c_pandora_box: "Критическая Ошибка",
        cdesc_pandora_box: "ВСЕ статы +50%, +3 Снаряда, но HP ВСЕГДА 1.",

        // ГЕРОИ (RU)
        char_knight: "РЫЦАРЬ", desc_knight: "Закаленный ветеран. Крепкая броня и здоровье. (+40 HP)",
        char_mage: "МАГ", desc_mage: "Хрупкий, но мощный. (+20% Сила, +10% Скор, -20 HP)",
        char_thief: "ВОР", desc_thief: "Быстрый и удачливый. (6 Слотов, +30% Скор, +20 Удача, -20 HP)",
        char_butcher: "МЯСНИК", desc_butcher: "Медленный гигант. (3 Оружия, +80 HP, +30% Сила, -20% Скор)",
        char_alchemist: "АЛХИМИК", desc_alchemist: "Мастер зелий. (+30% Длит, +20% Перезарядка, +10% Зона)",
        char_spartan: "СПАРТАНЕЦ", desc_spartan: "Яростный воин. (+40% Сила, +30 HP, +50% Проклятие, Медленные атаки)",
        char_nun: "МОНАХИНЯ", desc_nun: "Святая вера. (+3 HP каждые 3 сек, +20% Опыт, +20% Скорострельность, +10% Зона, -10% Скор)",
        char_exorcist: "ЭКЗОРЦИСТ", desc_exorcist: "Охотник на демонов. (3 Оружия, 3 Предмета, +30 Удача, +20% Зона)",
        char_preacher: "ПРОПОВЕДНИК", desc_preacher: "Читает молитвы. (+30% Длит, +20 HP)"
    },
    en: {
        btn_play: "PLAY", btn_fight: "FIGHT!",
        btn_knight: "KNIGHT", btn_mage: "MAGE", btn_thief: "THIEF", btn_butcher: "BUTCHER", 
        btn_alchemist: "ALCHEMIST", btn_spartan: "SPARTAN", btn_nun: "NUN", 
        btn_exorcist: "EXORCIST", btn_preacher: "PREACHER",
        btn_settings: "SETTINGS", btn_back: "BACK", btn_ranking: "RANKING",
        btn_resume: "RESUME", btn_menu: "MAIN MENU", btn_restart: "NEW RUN",
        settings_title: "SETTINGS", lang_label: "LANGUAGE", vol_label: "VOLUME",
        pause_title: "PAUSED", gameover_title: "GAME OVER",
        boss_warn: "BOSS!", boss_mini: "MINI-BOSS",
        "FIND THE PORTAL!": "FIND THE PORTAL!", "SURVIVAL MODE": "SURVIVAL MODE",
        lvl: "LVL:", 
        upg_title_lvl: "LEVEL UP!", upg_desc_lvl: "Choose a stat upgrade",
        upg_title_chest: "CHEST", upg_title_gold: "GOLDEN CHEST",
        upg_desc_chest: "Next cost: {cost} gold",
        new_item: "New", new_level: "Lvl {lvl}",
        scales_with: "Scales with:", good_for: "Good for:", btn_banish: "BANISH",
        shop_title: "TRAVELING MERCHANT", shop_desc: "Got some rare goods, stranger...",
        btn_buy: "BUY", btn_leave_shop: "LEAVE", btn_remove_item: "REMOVE ITEM (5000 G)", shop_sold_out: "SOLD OUT",

        // STATS (FIX: Added missing keys)
        stat_might: "Might", stat_moveSpeed: "Move Speed", stat_projSpeed: "Flight Speed", 
        stat_cooldown: "Fire Rate", stat_area: "Area / Size", stat_luck: "Luck", 
        stat_amount: "Projectile Amount", stat_curse: "Curse", 
        stat_vampChance: "Vampire Chance", stat_vampPower: "Vampire Power", 
        stat_growth: "Growth", stat_greed: "Greed", stat_duration: "Lifetime", 
        stat_critChance: "Crit Chance", stat_evasion: "Evasion", stat_critDamage: "Crit Damage",
        stat_maxHp: "Max HP", stat_hpRegen: "Regeneration", 
        stat_shopDefense: "Defense", stat_thorns: "Thorns", stat_magnet: "Magnet",

        stat_desc_might: "Weapon Damage", stat_desc_moveSpeed: "Hero movement speed", stat_desc_projSpeed: "Projectiles fly and rotate faster",
        stat_desc_cooldown: "Weapons attack more often", stat_desc_area: "Increases Attack Size and Radius", stat_desc_luck: "Affects item rarity", 
        stat_desc_amount: "+1 projectile to weapons", stat_desc_curse: "Enemy Difficulty & Count", stat_desc_vampChance: "Hit heal chance", 
        stat_desc_vampPower: "Heal amount (Flat)", stat_desc_growth: "Bonus Exp (Flat)", stat_desc_greed: "Bonus Gold (Flat)", stat_desc_duration: "Attacks stay on screen longer",
        stat_desc_critChance: "Chance to deal x2.0 damage", stat_desc_evasion: "Chance to dodge incoming damage", stat_desc_critDamage: "Crit Damage multiplier",
        
        kill_count: "Kills", time_survived: "Time Survived", final_stats: "Final Stats", 
        items_collected: "Inventory", reroll_btn: "Reroll", gold_earned: "Gold Earned", level_reached: "Level Reached",

        // SHOP ITEMS
        name_shop_meal: "Hearty Meal", desc_shop_meal: "Full Heal + 10 Max HP",
        name_shop_supplies: "Supply Pack", desc_shop_supplies: "+1 Chest Reroll",
        name_shop_pepper: "Dragon Pepper", desc_shop_pepper: "+5% Might",
        name_shop_gym: "Gym Membership", desc_shop_gym: "+10 Max HP",
        name_shop_compass: "Broken Compass", desc_shop_compass: "+5 Luck",
        name_shop_espresso: "Double Espresso", desc_shop_espresso: "+10% Fire Rate",
        name_shop_mystery: "Mystery Scroll", desc_shop_mystery: "+1 Level to random item",
        name_shop_map: "Old Map", desc_shop_map: "+15% Pickup Range & Area",

        name_shop_bonedust: "Bone Dust", desc_shop_bonedust: "+5% Flight Speed",
        name_shop_shovel: "Gravedigger's Shovel", desc_shop_shovel: "+6 Greed",
        name_shop_holywater: "Holy Water Flask", desc_shop_holywater: "+0.5 HP Regen (every 3 sec)",
        name_shop_shield: "Paladin's Shield", desc_shop_shield: "-15% Incoming Damage",

        name_shop_boots: "Traveler's Boots", desc_shop_boots: "+5% Move Speed",
        name_shop_cactus: "Cactus Juice", desc_shop_cactus: "+10% Thorns (Reflect)",
        name_shop_scarab: "Golden Scarab", desc_shop_scarab: "+10 Luck & +10 Greed",
        name_shop_mirage: "Mirage Bottle", desc_shop_mirage: "+10% Evasion",

        name_shop_coal: "Hot Coal", desc_shop_coal: "+10% Lifetime",
        name_shop_magma: "Magma Stone", desc_shop_magma: "+5% Crit Chance",
        name_shop_fireheart: "Heart of Fire", desc_shop_fireheart: "+15% Might & +15% Area",
        name_shop_dragoneye: "Dragon's Eye", desc_shop_dragoneye: "+20% Crit Chance & +0.25 Crit Dmg",

        name_shop_mushroom: "Glow Mushroom", desc_shop_mushroom: "+20 Magnet Range",
        name_shop_geode: "Geode", desc_shop_geode: "-5% Incoming Damage",
        name_shop_focus: "Crystal Focus", desc_shop_focus: "+15% Fire Rate",
        name_shop_prism: "Cracked Prism", desc_shop_prism: "+2 Projectile Amount",

        // CURSES
        cursed_anvil_title: "CURSED ANVIL", cursed_anvil_desc: "Embrace the darkness to gain power...", anvil_warning: "⚠ WARNING: Item upgrades will be FROZEN!",
        btn_curse: "CURSE IT!", press_e_anvil: "PRESS E TO CURSE", need_more_power: "Need more items (2+)...", cursed_prefix: "(CURSED) ",
        
        name_c_sword: "Heavy Slayer", name_c_wand: "Chaos Wand", name_c_axe: "Titan Axe", name_c_knife: "Assassin's Dagger",
        name_c_garlic: "Blood Garlic", name_c_bible: "Forbidden Tomes", name_c_spear: "Longinus", name_c_holywater: "Hellfire", name_c_cross: "Crucifix", name_c_armor: "Cursed Plate",
        name_c_whetstone: "Sharp Shard", name_c_mist_cloak: "Shadow Shroud", name_c_scope: "Tunnel Vision", name_c_empty_bottle: "Blood Vessel",
        name_c_coffee: "Overdose", name_c_heavy_stone: "Gravity", name_c_coin_purse: "Hole in Pocket", name_c_light_feather: "Cursed Feather",
        //new
        name_c_frost_orb: "Glacier", name_c_fire_scroll: "Napalm",
        name_c_katana: "Blood Rush", name_c_landmines: "Cluster Mine",

        cdesc_sword: "Dmg x3, but Cooldown x3",
        cdesc_wand: "+3 Projectiles, but Dmg -40% & Spread",
        cdesc_axe: "Size +50%, but Flight Speed -50%",
        cdesc_knife: "Crit 50% & Pierce, but Fixed 1 knife",
        cdesc_garlic: "Vampirism, but Area -40%",
        cdesc_bible: "Infinite Duration, but Spin Speed -70%",
        cdesc_spear: "+3 Spears (Fan), but Cooldown x1.5",
        cdesc_holywater: "Size +40%, but they hurt YOU",
        cdesc_cross: "Stationary Spin, does not return",
        cdesc_armor: "Incoming Dmg -50%, but Move Speed -30%", cdesc_spinach: "Might +30%, but Max HP -20%", cdesc_hollow_heart: "Max HP +100%, but Might -30%",
        cdesc_boots: "Speed +30%, but Max HP -30%", cdesc_candle: "Area +30%, but Attacks slower (-20%)", cdesc_gloves: "Fire Rate +30%, but Area -30%",
        cdesc_clover: "Luck +30, but Exp Growth -30%", cdesc_mask: "Vampire +20%, but Max HP -50%", cdesc_skull_ring: "Crit +20%, but Curse +30%",
        // CURSES (Descriptions)
        cdesc_whetstone: "+15% Crit Chance, but -30% Might",
        cdesc_mist_cloak: "+10% Evasion, but +25% Incoming Damage",
        cdesc_scope: "+0.5 Crit Damage, but -30% Area",
        cdesc_empty_bottle: "+30 Vamp Power, but Chance is fixed at 1%",
        cdesc_coffee: "+30% Fire Rate, but Bad Accuracy",
        cdesc_heavy_stone: "+30% Might, but -50% MoveSpeed",
        cdesc_coin_purse: "+50 Greed, but Gold vanishes in 3s",
        cdesc_light_feather: "+40% MoveSpeed, but +25% Incoming Damage",
        // new
        cdesc_frost_orb: "Stationary Shield (10s), does not fly",
        cdesc_fire_scroll: "Explosion deals 0 dmg, but creates Eternal Fire",
        cdesc_katana: "Crit Chance +20%, but attacks are slower (-2.5x)",
        cdesc_landmines: "Spawns 3 mini-mines on explosion",

        // NEW ITEMS
        whetstone: "Whetstone", mist_cloak: "Mist Cloak", scope: "Scope", empty_bottle: "Empty Bottle",
        coffee: "Coffee", heavy_stone: "Heavy Stone", coin_purse: "Coin Purse", light_feather: "Light Feather",

        desc_whetstone: "+1% Crit Chance (Max 30%)", desc_mist_cloak: "+1% Evasion (Max 30%)", desc_scope: "+0.025 Crit Damage", desc_empty_bottle: "+1 Vampire Power",
        desc_coffee: "+1% MoveSpeed, +1.5% Fire Rate", desc_heavy_stone: "+4% Might, -1.5% MoveSpeed", desc_coin_purse: "+4 Greed", desc_light_feather: "+2.5% MoveSpeed",

        name_c_spiked_pauldrons: "Martyr's Spikes", name_c_ninja_headband: "Suicide Headband", name_c_magnet_boots: "Grav-Boots",
        name_c_ruby_ring: "Blood Ruby", name_c_sapphire_amulet: "Fragile Sapphire", name_c_sniper_lens: "Tunnel Lens", name_c_explosive_powder: "Unstable Powder",

        cdesc_spiked_pauldrons: "Thorns +30%, but Move Speed -40%",
        cdesc_ninja_headband: "Fire Rate +30%, but Max HP -40%",
        cdesc_magnet_boots: "Magnet +350, but Move Speed -40%",
        cdesc_ruby_ring: "Might +30%, but Area -40%",
        cdesc_sapphire_amulet: "Fire Rate +30%, but Duration -40%",
        cdesc_sniper_lens: "Proj Speed +30%, but Area -40%",
        cdesc_explosive_powder: "Area +30%, but Fire Rate -40%",
        name_c_berserker_blood: "Madman's Fury", name_c_golden_idol: "Cursed Gold", name_c_glass_cannon: "Fragile Power",
        name_c_adrenaline_shot: "Overdose", name_c_mana_crystal: "Corrupted Crystal",

        cdesc_berserker_blood: "Might +30%, but Max HP -50%",
        cdesc_golden_idol: "Double scaling, but lose Gold on hit",
        cdesc_glass_cannon: "Might +30%, but STUNNED when hit",
        cdesc_adrenaline_shot: "Speedhack (+Spd/Rate), but CANNOT STAND STILL",
        cdesc_mana_crystal: "Fire Rate +30%, but Might -40%",
        
        name_c_pandora_box: "Fatal Error",
        cdesc_pandora_box: "ALL stats +50%, +3 Amount, but HP is FIXED at 1.",
        
        // HEROES (EN)

        char_knight: "KNIGHT", desc_knight: "Battle-hardened veteran. Heavy armor. (+40 HP)",

        char_mage: "MAGE", desc_mage: "Frail but powerful. (+20% Might, +10% Speed, -20 HP)",

        char_thief: "THIEF", desc_thief: "Fast and lucky. (6 Slots, +30% Speed, +20 Luck, -20 HP)",

        char_butcher: "BUTCHER", desc_butcher: "Slow giant. (3 Weapons, +80 HP, +30% Might, -20% Speed)",

        char_alchemist: "ALCHEMIST", desc_alchemist: "Potion master. (+30% Dur, +20% CD, +10% Area)",

        char_spartan: "SPARTAN", desc_spartan: "Furious warrior. (+40% Might, +30 HP, +50% Curse, Slow Atk)",

        char_nun: "NUN", desc_nun: "Holy faith. (+3 HP every 3 sec, +20% Growth, +20% Fire Rate, +10% Area, -10% Speed)",

        char_exorcist: "EXORCIST", desc_exorcist: "Demon hunter. (3 Weapons, 3 Items, +30 Luck, +20% Area)",

        char_preacher: "PREACHER", desc_preacher: "Reads scriptures. (+30% Dur, +20 HP)"
    }
};

const DB_TEXTS = {

    ru: {

        sword: "Меч", wand: "Посох", axe: "Топор", garlic: "Чеснок", knife: "Нож", bible: "Библия", spear: "Копье", holywater: "Св. Вода", cross: "Крест",

        spinach: "Шпинат", armor: "Броня", candle: "Свеча", boots: "Сапоги", plesen: "Плесень", fireaura: "Огн. Аура", gloves: "Перчатки", crown: "Корона", clover: "Клевер", magnet: "Магнит", ring: "Кольцо", zap: "ZAP!", mask: "Маска", wings: "Крылья",

        hollow_heart: "Пустое Сердце", bracer: "Наручи", skull_ring: "Кольцо Черепа", stopwatch: "Часы", thornmail: "Шипованная Броня", phoenix: "Феникс", soul_stone: "Камень Душ",

        //new

        frost_orb: "Лед. Сфера", fire_scroll: "Свиток Огня", katana: "Катана", landmines: "Мины",

        

        desc_sword: "Базовая атака", desc_wand: "Магический снаряд", desc_axe: "Пробивающий бросок", desc_garlic: "Аура урона", desc_knife: "Быстрый бросок", desc_bible: "Кружится вокруг", desc_spear: "Пронзает врагов", desc_holywater: "Создает лужи", desc_cross: "Бумеранг",

        desc_spinach: "Увеличивает наносимый урон (2.5%)", desc_armor: "Снижает получаемый урон", desc_candle: "Увеличивает Зону Поражения (2.5%)", desc_boots: "Увеличивает скорость бега (2.5%)", 

        desc_plesen: "Накладывает стаки урона", desc_fireaura: "Оставляет огненный след", desc_gloves: "Повышает Скорострельность (5%)", desc_crown: "Увеличивает получаемый опыт", 

        desc_clover: "Повышает удачу", desc_magnet: "Радиус сбора предметов", desc_ring: "Добавляет снаряды оружию", desc_zap: "Ударяет цепной молнией", 

        desc_mask: "Дает шанс лечения при ударе", 

        // FIX: Описание крыльев (Уклонение)

        desc_wings: "Ускоряет бег и дает Уклонение",

        desc_hollow_heart: "Увеличивает макс. здоровье", desc_bracer: "Повышает Скорость Снарядов", desc_skull_ring: "Дает Шанс Крита и Проклятие",

        desc_stopwatch: "Замораживает время (90 сек КД)", desc_thornmail: "Возвращает часть урона врагам", desc_phoenix: "Воскрешение при смерти (1 раз)", desc_soul_stone: "Сила растет от убийств (Уник.)",

        //new

        desc_frost_orb: "Морозит врагов, пронзает", 

        desc_fire_scroll: "Стреляет взрывным шаром", 

        desc_katana: "Быстрые удары перед собой включает в себя 15% крит шанса", 

        desc_landmines: "Ставит мины, ждут врага",

        // НОВЫЕ ПРЕДМЕТЫ

        whetstone: "Точильный Камень", mist_cloak: "Плащ Тумана", scope: "Прицел", empty_bottle: "Пустая Бутылка",

        coffee: "Кофе", heavy_stone: "Тяжелый Камень", coin_purse: "Кошель", light_feather: "Легкое Перо",



        desc_whetstone: "+1% Крит Шанс (Макс 30%)", desc_mist_cloak: "+1% Уклонение (Макс 30%)", desc_scope: "+0.025 Крит Урон", desc_empty_bottle: "+1 Сила Вампиризма",

        desc_coffee: "+1.5% Скорость, +1% Скор. Атаки", desc_heavy_stone: "+4% Урон, -1.5% Скорость", desc_coin_purse: "+4 Жадность", desc_light_feather: "+2.5% Скорость",
        spiked_pauldrons: "Шипастые Наплечники", ninja_headband: "Повязка Ниндзя", magnet_boots: "Магнитные Ботинки",
        ruby_ring: "Рубиновое Кольцо", sapphire_amulet: "Сапфировый Амулет", sniper_lens: "Линза Снайпера", explosive_powder: "Взрывной Порох",

        desc_spiked_pauldrons: "+5% Шипы (Reflect)", desc_ninja_headband: "+3% Ск. Атаки, +2% Крит Шанс", desc_magnet_boots: "+2.5% Скор. Бега, +20 Магнит",
        desc_ruby_ring: "+2.5% Сила, +2.5% Зона", desc_sapphire_amulet: "+2.5% Ск. Атаки, +2.5% Ск. Снарядов", desc_sniper_lens: "+3.5% Ск. Снарядов, +1.5% Крит Шанс", desc_explosive_powder: "+5% Зона Поражения",

        berserker_blood: "Кровь Берсерка", golden_idol: "Золотой Идол", glass_cannon: "Стеклянная Пушка",
        adrenaline_shot: "Адреналин", mana_crystal: "Мана Кристалл",

        desc_berserker_blood: "Урон растет при низком здоровье.",
        desc_golden_idol: "Урон растет от количества золота.",
        desc_glass_cannon: "+12.5% Сила, -2.5% Макс. ХП",
        desc_adrenaline_shot: "Чем быстрее бежишь, тем быстрее стреляешь.",
        desc_mana_crystal: "+5% Скор. Атаки, +5% Длительность",
        pandora_box: "Ящик Пандоры",
        desc_pandora_box: "Дарует по +10% ко всем % статам, +1 Снаряд и +20 Удачи.",

    },

    en: {

        sword: "Sword", wand: "Wand", axe: "Axe", garlic: "Garlic", knife: "Knife", bible: "Bible", spear: "Spear", holywater: "Holy Water", cross: "Cross",

        spinach: "Spinach", armor: "Armor", candle: "Candle", boots: "Boots", plesen: "Mold", fireaura: "Fire Aura", gloves: "Gloves", crown: "Crown", clover: "Clover", magnet: "Magnet", ring: "Ring", zap: "ZAP!", mask: "Mask", wings: "Wings",

        hollow_heart: "Hollow Heart", bracer: "Bracer", skull_ring: "Skull Ring", stopwatch: "Stopwatch", thornmail: "Thornmail", phoenix: "Phoenix", soul_stone: "Soul Stone",

        //new 

        frost_orb: "Frost Orb", fire_scroll: "Fire Scroll", katana: "Katana", landmines: "Landmines",

        

        desc_sword: "Basic attack", desc_wand: "Magic missile", desc_axe: "Piercing throw", desc_garlic: "Damage aura", desc_knife: "Fast projectile", desc_bible: "Orbits around", desc_spear: "Pierces enemies", desc_holywater: "Damaging pools", desc_cross: "Boomerang",

        desc_spinach: "Increases Damage (2.5%)", desc_armor: "Reduces incoming Damage", desc_candle: "Increases Attack Radius (2.5%)", desc_boots: "Increases Move Speed (2.5%)", 

        desc_plesen: "Applies damage stacks", desc_fireaura: "Leaves a fire trail", desc_gloves: "Increases Fire Rate (5%)", desc_crown: "Increases Exp Gain", 

        desc_clover: "Increases Luck", desc_magnet: "Increases Pickup Range", desc_ring: "Adds projectiles to weapons", desc_zap: "Strikes with Chain Lightning", 

        desc_mask: "Chance to heal on hit", 

        // FIX: Wings Description

        desc_wings: "Increases Move Speed and Evasion",

        desc_hollow_heart: "Increases Max Health", desc_bracer: "Buffs Flight Speed & Lifetime", desc_skull_ring: "Increases Crit Chance, adds Curse",

        desc_stopwatch: "Freezes enemies (90s CD)", desc_thornmail: "Reflects damage to enemies (10% when you pickup)", desc_phoenix: "Revives on death (One-time)", desc_soul_stone: "Might grows with kills (Unique)",

        //new

        desc_frost_orb: "Freezes enemies, pierces", 

        desc_fire_scroll: "Shoots explosive fireball", 

        desc_katana: "Fast slashes in front including 15% of crit chance (power up your crit chance to have more chances to crit!)", 

        desc_landmines: "Places mines, waits for contact",

        // NEW ITEMS

        whetstone: "Whetstone", mist_cloak: "Mist Cloak", scope: "Scope", empty_bottle: "Empty Bottle",

        coffee: "Coffee", heavy_stone: "Heavy Stone", coin_purse: "Coin Purse", light_feather: "Light Feather",



        desc_whetstone: "+1% Crit Chance (Max 30%)", desc_mist_cloak: "+1% Evasion (Max 30%)", desc_scope: "+0.025 Crit Damage", desc_empty_bottle: "+1 Vampire Power",

        desc_coffee: "+1.5% MoveSpeed, +1% Fire Rate", desc_heavy_stone: "+4% Might, -1.5% MoveSpeed", desc_coin_purse: "+4 Greed", desc_light_feather: "+2.5% MoveSpeed",
        spiked_pauldrons: "Spiked Pauldrons", ninja_headband: "Ninja Headband", magnet_boots: "Magnet Boots",
        ruby_ring: "Ruby Ring", sapphire_amulet: "Sapphire Amulet", sniper_lens: "Sniper Lens", explosive_powder: "Explosive Powder",

        desc_spiked_pauldrons: "+5% Thorns (Reflect)", desc_ninja_headband: "+3% Fire Rate, +2% Crit Chance", desc_magnet_boots: "+2.5% Move Speed, +20 Magnet",
        desc_ruby_ring: "+2.5% Might, +2.5% Area", desc_sapphire_amulet: "+2.5% Fire Rate, +2.5% Proj Speed", desc_sniper_lens: "+3.5% Proj Speed, +1.5% Crit Chance", desc_explosive_powder: "+5% Area",
        berserker_blood: "Berserker Blood", golden_idol: "Golden Idol", glass_cannon: "Glass Cannon",
        adrenaline_shot: "Adrenaline Shot", mana_crystal: "Mana Crystal",

        desc_berserker_blood: "Damage increases as HP gets lower.",
        desc_golden_idol: "Damage increases with Gold amount.",
        desc_glass_cannon: "+12.5% Might, -2.5% Max HP",
        desc_adrenaline_shot: "Fire Rate scales with movement speed.",
        desc_mana_crystal: "+5% Fire Rate, +5% Duration",
        pandora_box: "Pandora's Box",
        desc_pandora_box: "Grants +10% to all % stats, +1 Amount and +20 Luck.",
    }

};

function t(key, params = {}) {
    let txt = TRANSLATIONS[currentLang][key] || key;
    for (let p in params) txt = txt.replace(`{${p}}`, params[p]);
    return txt;
}
function tDB(id, type) { 
    let k = (type === 'desc' ? 'desc_' : '') + id;
    return DB_TEXTS[currentLang][k] || id;
}

const DB = {
    // --- ХАРАКТЕРИСТИКИ ГЕРОЕВ ---
    characters: {
        knight:    { stats: { maxHp: 40 }, hitboxWidth: 40, hitboxHeight: 40 }, 
        mage:      { stats: { maxHp: -20, moveSpeed: 0.1, might: 0.2 }, hitboxWidth: 35, hitboxHeight: 40 },
        thief:     { stats: { maxHp: -20, moveSpeed: 0.3, luck: 20 }, hitboxWidth: 30, hitboxHeight: 37 },
        butcher:   { stats: { maxHp: 80, moveSpeed: -0.2, might: 0.3 }, hitboxWidth: 42, hitboxHeight: 55},
        alchemist: { stats: { duration: 0.3, cooldown: 0.2, area: 0.1 }, hitboxWidth: 35, hitboxHeight: 45 },
        spartan:   { stats: { maxHp: 30, might: 0.4, cooldown: -0.3, curse: 0.3 }, hitboxWidth: 37, hitboxHeight: 45 },
        nun:       { stats: { moveSpeed: -0.1, hpRegen: 3, growth: 2, cooldown: 0.2, area: 0.1 }, hitboxWidth: 33, hitboxHeight: 44 },
        exorcist:  { stats: { maxHp: -10, luck: 30, area: 0.2 }, hitboxWidth: 30, hitboxHeight: 43 }, 
        preacher:  { stats: { maxHp: 20, duration: 0.3 }, hitboxWidth: 34, hitboxHeight: 40 } 
    },

    // --- ВРАГИ И БОССЫ ---
    enemies: {
        skeleton: { hp: 25, damage: 8, speed: 1.5, exp: 1, width: 25, height: 30 },
        zombie:   { hp: 40, damage: 12, speed: 1.2, exp: 2, width: 25, height: 30 },
        boss:     { hp: 5000, damage: 30, size: 55, width: 145, height: 140, role: 'boss_charger' },
        firezombie2: { hp: 35, damage: 15, speed: 1.5, exp: 3, width: 25, height: 40 },
        sandgolem2:  { hp: 90, damage: 30, speed: 0.5, exp: 5, hitboxSize: 30, role: 'tank' },
        owl2:        { hp: 25, damage: 15, speed: 2.5, exp: 5, range: true, projectile: 'owl', size: 20, width: 40, height: 30 },
        boss2:       { hp: 12000, damage: 40, size: 60, width: 125, height: 140 },
        firegolem3: { hp: 120, damage: 15, speed: 1.8, exp: 8, hitboxSize: 30, role: 'tank' },
        firesliz3:   { hp: 60, damage: 40, speed: 3.5, exp: 5, width: 35, height: 30, role: 'flanker' },
        boss31:     { hp: 25000, size: 70, width: 145, height: 160 },
        boss32:     { hp: 25000, size: 70, width: 145, height: 170 },
        crystalserpent4: { hp: 200, damage: 20, speed: 3.5, exp: 12, range: true, projectile: 'crystal_shard4', hitboxSize: 25 },
        crystalstrider4: { hp: 350, damage: 25, speed: 2.5, exp: 15, range: true, projectile: 'crystal_orb4', width: 45, height: 60 },
        shardgolem4:     { hp: 800, damage: 40, speed: 1.5, exp: 25, width: 63, height: 77, role: 'tank' },
        boss4:           { hp: 70000, damage: 50, speed: 2.0, exp: 5000, range: true, hitboxSize: 65, width: 145, height: 165 },
        abysswraith5:   { hp: 500, damage: 30, speed: 3.0, exp: 20, range: true, projectile: 'shadow_bolt5', size: 25, width: 45, height: 55 },
        rifttitan5:     { hp: 1200, damage: 50, speed: 1.2, exp: 40, hitboxSize: 45, role: 'tank' },
        voidharbinger5: { hp: 2000, damage: 70, speed: 2.2, exp: 60, hitboxSize: 30, role: 'flanker' }, 
        boss51:         { hp: 50000, damage: 40, speed: 1.0, exp: 0,   range: true, hitboxSize: 70, width: 125, height: 190 }, 
        boss52:         { hp: 40000, damage: 60, speed: 4.0, exp: 0,   range: true, hitboxSize: 70, width: 190, height: 195 }, 
        boss53:         { hp: 60000, damage: 50, speed: 0.5, exp: 10000, range: true, hitboxSize: 70, width: 125, height: 190 }
    },

    weapons: {
        sword: { img: 'knightssword1.png', damage: 30, area: 150, cooldown: 50, rarity: 'common', tags: ['area', 'might'] },
        wand:  { img: 'mageposoh1.png', damage: 10, speed: 10, cooldown: 25, rarity: 'common', tags: ['duration', 'area', 'projSpeed'] }, 
        axe:   { img: 'axe1.png', damage: 60, cooldown: 60, knockback: 0.2, rarity: 'common', tags: ['area', 'duration', 'projSpeed'] }, 
        garlic:{ img: 'cesnok1.png', damage: 11, area: 90, cooldown: 20, rarity: 'common', tags: ['area'] },
        knife: { img: 'knife1.png', damage: 15, speed: 12, cooldown: 15, pierce: 2, rarity: 'common', tags: ['duration', 'area', 'projSpeed'] }, 
        bible: { img: 'bible1.png', damage: 15, speed: 1, area: 140, cooldown: 360, rarity: 'common', tags: ['area', 'duration', 'projSpeed'] },
        spear: { img: 'spear1.png', damage: 40, speed: 10, cooldown: 55, rarity: 'common', tags: ['area', 'duration'] },
        holywater:{ img: 'holywater1.png', damage: 10, area: 45, cooldown: 280, rarity: 'common', tags: ['duration', 'area'] },
        cross: { img: 'cross1.png', damage: 35, speed: 16, cooldown: 180, rarity: 'common', tags: ['duration', 'area', 'projSpeed'] },
        //new
        frost_orb: { img: 'frost_orb.png', damage: 8, speed: 3, cooldown: 90, duration: 150, rarity: 'common', tags: ['duration', 'projSpeed'] },
        fire_scroll: { img: 'fire_scroll.png', damage: 35, speed: 7, cooldown: 55, rarity: 'common', tags: ['area', 'projSpeed', 'might'] },
        katana: { img: 'katana.png', damage: 18, cooldown: 40, area: 90, critChance: 0.15, rarity: 'common', tags: ['cooldown', 'area', 'critChance'] },
        landmines: { img: 'mine.png', damage: 30, cooldown: 120, duration: 600, rarity: 'common', tags: ['amount', 'area', 'might'] },
    },
    items: {
        spinach: { rarity: 'common', img:'spinach1.png', goodFor: ['sword', 'axe', 'spear', 'cross'] },
        armor:   { rarity: 'common', img:'armor1.png', goodFor: [] },
        candle:  { rarity: 'common', img:'candle1.png', goodFor: ['garlic', 'bible', 'sword', 'axe', 'holywater'] },
        boots:   { rarity: 'common', img:'boots1.png', goodFor: [] },
        plesen:  { rarity: 'common', img:'plesen1.png', goodFor: ['garlic'] },
        fireaura:{ rarity: 'rare', img:'fireaura1.png', goodFor: [] }, 
        gloves:  { rarity: 'rare', img:'gloves1.png', goodFor: ['bible', 'wand', 'knife', 'garlic'] },
        crown:   { rarity: 'rare', img:'crown1.png', goodFor: [] },
        clover:  { rarity: 'rare', img:'clover1.png', goodFor: ['cross'] },
        magnet:  { rarity: 'epic', img:'magnite1.png', goodFor: [] },
        ring:    { rarity: 'epic', img:'ring1.png', goodFor: ['wand', 'knife', 'axe', 'cross', 'bible', 'spear'] },
        zap:     { rarity: 'legendary', img:'zap1.png', maxLevel: 1, goodFor: [] },
        mask:    { rarity: 'legendary', img:'mask1.png', maxLevel: 1, goodFor: [] },
        wings:   { rarity: 'epic', img:'wings1.png', goodFor: [] },
        hollow_heart: { rarity: 'rare', img:'hollowheart1.png', goodFor: [] },
        bracer:       { rarity: 'rare', img:'bracer1.png', goodFor: ['bible', 'wand', 'knife', 'cross', 'holywater'] },
        skull_ring:   { rarity: 'rare', img:'skullring1.png', goodFor: ['sword', 'axe', 'spear'] },
        stopwatch:    { rarity: 'epic', img:'stopwatch1.png', goodFor: [] },
        thornmail:    { rarity: 'epic', img:'thornmail1.png', goodFor: [] },
        phoenix:      { rarity: 'legendary', img:'phoenix1.png', maxLevel: 1, goodFor: [] },
        soul_stone:   { rarity: 'legendary', img:'soulstone1.png', maxLevel: 1, goodFor: [] },
        // --- НОВЫЕ ПРЕДМЕТЫ ---
        whetstone:    { rarity: 'common', img: 'whetstone.png', goodFor: [] },
        mist_cloak:   { rarity: 'common', img: 'mist_cloak.png', goodFor: [] },
        scope:        { rarity: 'common', img: 'scope.png', goodFor: [] },
        empty_bottle: { rarity: 'common', img: 'empty_bottle.png', goodFor: [] },
        coffee:       { rarity: 'common', img: 'coffee.png', goodFor: [] },
        heavy_stone:  { rarity: 'common', img: 'heavy_stone.png', goodFor: [] },
        coin_purse:   { rarity: 'common', img: 'coin_purse.png', goodFor: [] },
        light_feather:{ rarity: 'common', img: 'light_feather.png', goodFor: [] },
        spiked_pauldrons: { rarity: 'rare', img: 'spiked_pauldrons.png', goodFor: [] },
        ninja_headband:   { rarity: 'rare', img: 'ninja_headband.png', goodFor: [] },
        magnet_boots:     { rarity: 'rare', img: 'magnet_boots.png', goodFor: [] },
        ruby_ring:        { rarity: 'rare', img: 'ruby_ring.png', goodFor: [] },
        sapphire_amulet:  { rarity: 'rare', img: 'sapphire_amulet.png', goodFor: [] },
        sniper_lens:      { rarity: 'rare', img: 'sniper_lens.png', goodFor: [] },
        explosive_powder: { rarity: 'rare', img: 'explosive_powder.png', goodFor: [] },
        // --- EPIC ITEMS ---
        berserker_blood:  { rarity: 'epic', img: 'berserker_blood.png', goodFor: [] },
        golden_idol:      { rarity: 'epic', img: 'golden_idol.png', goodFor: [] },
        glass_cannon:     { rarity: 'epic', img: 'glass_cannon.png', goodFor: [] },
        adrenaline_shot:  { rarity: 'epic', img: 'adrenaline_shot.png', goodFor: [] },
        mana_crystal:     { rarity: 'epic', img: 'mana_crystal.png', goodFor: [] },
        // --- LEGENDARY ITEM ---
        pandora_box: { rarity: 'legendary', img: 'pandora_box.png', maxLevel: 1, goodFor: [] },
    },
    stats: {
        might: {}, moveSpeed: {}, projSpeed: {}, cooldown: {}, area: {}, luck: {}, amount: {}, curse: {}, 
        vampChance: {}, vampPower: {}, growth: {}, greed: {}, duration: {}, critChance: {}, evasion: {}, critDamage: {},
    },
    
    // --- ДАННЫЕ ПРОКЛЯТИЙ ---
    curses: {
        sword: { nameKey: 'name_c_sword', descKey: 'cdesc_sword', dmgMult: 3.0, cooldownMult: 3.0 },
        wand:  { nameKey: 'name_c_wand', descKey: 'cdesc_wand', amountFlat: 3, dmgMult: 0.6, spread: true },
        axe:   { nameKey: 'name_c_axe', descKey: 'cdesc_axe', areaMult: 1.5, projSpeedMult: 0.5 },
        knife: { nameKey: 'name_c_knife', descKey: 'cdesc_knife', critFixed: 0.5, amountFixed: 1, pierce: true },
        garlic:{ nameKey: 'name_c_garlic', descKey: 'cdesc_garlic', vampire: true, areaMult: 0.6 },
        bible: { nameKey: 'name_c_bible', descKey: 'cdesc_bible', durationInfinite: true, speedMult: 0.3 },
        spear: { nameKey: 'name_c_spear', descKey: 'cdesc_spear', amountFixed: 3, cooldownMult: 1.5 },
        holywater: { nameKey: 'name_c_holywater', descKey: 'cdesc_holywater', areaMult: 1.4, selfDamage: true },
        cross: { nameKey: 'name_c_cross', descKey: 'cdesc_cross', stationary: true, noReturn: true },
        
        armor: { 
            nameKey: 'name_c_armor', 
            descKey: 'cdesc_armor', 
            type: 'passive', 
            // shopDefense = 0.50 означает 50% снижение урона
            stats: { shopDefense: 0.50, moveSpeed: -0.30 } 
        },
        spinach: { descKey: 'cdesc_spinach', type: 'passive', stats: { might: 0.3, maxHpMult: -0.2 } },
        hollow_heart: { descKey: 'cdesc_hollow_heart', type: 'passive', stats: { maxHpMult: 1.0, might: -0.3 } },
        boots: { descKey: 'cdesc_boots', type: 'passive', stats: { moveSpeed: 0.3, maxHpMult: -0.3 } },
        candle: { descKey: 'cdesc_candle', type: 'passive', stats: { area: 0.3, cooldown: -0.2 } },
        gloves: { descKey: 'cdesc_gloves', type: 'passive', stats: { cooldown: 0.3, area: -0.3 } },
        clover: { descKey: 'cdesc_clover', type: 'passive', stats: { luck: 30, growth: -3 } },
        mask: { descKey: 'cdesc_mask', type: 'passive', stats: { vampChance: 0.2, maxHpMult: -0.5 } },
        skull_ring: { descKey: 'cdesc_skull_ring', type: 'passive', stats: { critChance: 0.2, curse: 0.3 } },
        // new
        frost_orb: { nameKey: 'name_c_frost_orb', descKey: 'cdesc_frost_orb', stationary: true, durationMult: 3.3, cooldownMult: 4.5 }, // 3s -> 10s
        fire_scroll: { nameKey: 'name_c_fire_scroll', descKey: 'cdesc_fire_scroll', napalm: true },
        katana: { nameKey: 'name_c_katana', descKey: 'cdesc_katana', cooldownMult: 2.5, critBonus: 0.2 },
        landmines: { nameKey: 'name_c_landmines', descKey: 'cdesc_landmines', cluster: true },
        // --- НОВЫЕ ПРОКЛЯТИЯ ПРЕДМЕТОВ ---
        whetstone:    { nameKey: 'name_c_whetstone', descKey: 'cdesc_whetstone', type: 'passive', stats: { critChance: 0.15, might: -0.30 } },
        mist_cloak:   { nameKey: 'name_c_mist_cloak', descKey: 'cdesc_mist_cloak', type: 'passive', stats: { evasion: 0.10 }, incDamageMult: 1.25 },
        scope:        { nameKey: 'name_c_scope', descKey: 'cdesc_scope', type: 'passive', stats: { critDamage: 0.50, area: -0.30 } },
        empty_bottle: { nameKey: 'name_c_empty_bottle', descKey: 'cdesc_empty_bottle', type: 'passive', stats: { vampPower: 30 }, fixedVampChance: true },
        coffee:       { nameKey: 'name_c_coffee', descKey: 'cdesc_coffee', type: 'passive', stats: { cooldown: 0.30 }, badAccuracy: true },
        heavy_stone:  { nameKey: 'name_c_heavy_stone', descKey: 'cdesc_heavy_stone', type: 'passive', stats: { might: 0.30, moveSpeed: -0.50 } },
        coin_purse:   { nameKey: 'name_c_coin_purse', descKey: 'cdesc_coin_purse', type: 'passive', stats: { greed: 50 }, shortGoldLife: true },
        light_feather:{ nameKey: 'name_c_light_feather', descKey: 'cdesc_light_feather', type: 'passive', stats: { moveSpeed: 0.40 }, incDamageMult: 1.25 },
        spiked_pauldrons: { nameKey: 'name_c_spiked_pauldrons', descKey: 'cdesc_spiked_pauldrons', type: 'passive', stats: { thorns: 0.30, moveSpeed: -0.40 } },
        ninja_headband:   { nameKey: 'name_c_ninja_headband', descKey: 'cdesc_ninja_headband', type: 'passive', stats: { cooldown: 0.30, maxHpMult: -0.40 } },
        magnet_boots:     { nameKey: 'name_c_magnet_boots', descKey: 'cdesc_magnet_boots', type: 'passive', stats: { magnet: 350, moveSpeed: -0.40 } },
        ruby_ring:        { nameKey: 'name_c_ruby_ring', descKey: 'cdesc_ruby_ring', type: 'passive', stats: { might: 0.30, area: -0.40 } },
        sapphire_amulet:  { nameKey: 'name_c_sapphire_amulet', descKey: 'cdesc_sapphire_amulet', type: 'passive', stats: { cooldown: 0.30, duration: -0.40 } },
        sniper_lens:      { nameKey: 'name_c_sniper_lens', descKey: 'cdesc_sniper_lens', type: 'passive', stats: { projSpeed: 0.30, area: -0.40 } },
        explosive_powder: { nameKey: 'name_c_explosive_powder', descKey: 'cdesc_explosive_powder', type: 'passive', stats: { area: 0.30, cooldown: -0.40 } },
        berserker_blood:  { nameKey: 'name_c_berserker_blood', descKey: 'cdesc_berserker_blood', type: 'passive', stats: { might: 0.30, maxHpMult: -0.40 } },
        golden_idol:      { nameKey: 'name_c_golden_idol', descKey: 'cdesc_golden_idol', type: 'passive', stats: {} }, // Логика потери золота в collision.js
        glass_cannon:     { nameKey: 'name_c_glass_cannon', descKey: 'cdesc_glass_cannon', type: 'passive', stats: { might: 0.30 } }, // Стан в collision.js
        adrenaline_shot:  { nameKey: 'name_c_adrenaline_shot', descKey: 'cdesc_adrenaline_shot', type: 'passive', stats: { cooldown: 0.15, moveSpeed: 0.15 } }, // Блок стрельбы в main.js
        mana_crystal:     { nameKey: 'name_c_mana_crystal', descKey: 'cdesc_mana_crystal', type: 'passive', stats: { cooldown: 0.30, might: -0.40 } },
        // Cursed Pandora: Most stats handled via DB, HP=1 handled in logic.js
        pandora_box: { 
            nameKey: 'name_c_pandora_box', 
            descKey: 'cdesc_pandora_box', 
            type: 'passive', 
            stats: { 
                might: 0.50, moveSpeed: 0.50, projSpeed: 0.50, cooldown: 0.50, area: 0.50, duration: 0.50, 
                critDamage: 0.50, amount: 3, 
                luck: 50, greed: 50, growth: 50, vampPower: 20,
                // Капнутые статы (ставим 0.30, чтобы сразу в потолок)
                critChance: 0.30, evasion: 0.30, vampChance: 0.30
            } 
        },
    },
    
    // --- МАГАЗИН ---
    shopItems: [
        { id: 'shop_meal', rarity: 'common', cost: 200, type: 'consumable', effect: 'heal_full_maxhp_10', img: 'shop_meal.png', nameKey: 'name_shop_meal', descKey: 'desc_shop_meal' },
        { id: 'shop_supplies', rarity: 'common', cost: 300, type: 'consumable', effect: 'add_reroll', img: 'shop_supplies.png', nameKey: 'name_shop_supplies', descKey: 'desc_shop_supplies' },
        { id: 'shop_pepper', rarity: 'common', cost: 400, type: 'stat', stats: { might: 0.05 }, img: 'shop_pepper.png', nameKey: 'name_shop_pepper', descKey: 'desc_shop_pepper' },
        { id: 'shop_gym', rarity: 'common', cost: 400, type: 'stat', stats: { maxHp: 10 }, img: 'shop_gym.png', nameKey: 'name_shop_gym', descKey: 'desc_shop_gym' },

        { id: 'shop_compass', rarity: 'rare', cost: 600, type: 'stat', stats: { luck: 5 }, img: 'shop_compass.png', nameKey: 'name_shop_compass', descKey: 'desc_shop_compass' },
        { id: 'shop_espresso', rarity: 'rare', cost: 800, type: 'stat', stats: { cooldown: 0.10 }, img: 'shop_espresso.png', nameKey: 'name_shop_espresso', descKey: 'desc_shop_espresso' },

        { id: 'shop_mystery', rarity: 'epic', cost: 1500, type: 'consumable', effect: 'random_level_up', img: 'shop_scroll.png', nameKey: 'name_shop_mystery', descKey: 'desc_shop_mystery' },
        { id: 'shop_map', rarity: 'epic', cost: 1200, type: 'stat', stats: { magnet: 20, area: 0.15 }, img: 'shop_map.png', nameKey: 'name_shop_map', descKey: 'desc_shop_map' },

        { id: 'shop_bonedust', stage: 1, rarity: 'common', cost: 300, type: 'stat', stats: { projSpeed: 0.05 }, img: 'shop_bonedust.png', nameKey: 'name_shop_bonedust', descKey: 'desc_shop_bonedust' },
        { id: 'shop_shovel', stage: 1, rarity: 'rare', cost: 600, type: 'stat', stats: { greed: 6 }, img: 'shop_shovel.png', nameKey: 'name_shop_shovel', descKey: 'desc_shop_shovel' },
        { id: 'shop_holywater', stage: 1, rarity: 'epic', cost: 1200, type: 'stat', stats: { hpRegen: 0.5 }, img: 'shop_holywater.png', nameKey: 'name_shop_holywater', descKey: 'desc_shop_holywater' },
        { id: 'shop_shield', stage: 1, rarity: 'legendary', cost: 3000, type: 'stat', stats: { shopDefense: 0.15 }, img: 'shop_shield.png', nameKey: 'name_shop_shield', descKey: 'desc_shop_shield' },

        { id: 'shop_boots', stage: 2, rarity: 'common', cost: 400, type: 'stat', stats: { moveSpeed: 0.05 }, img: 'shop_boots.png', nameKey: 'name_shop_boots', descKey: 'desc_shop_boots' },
        { id: 'shop_cactus', stage: 2, rarity: 'rare', cost: 700, type: 'stat', stats: { thorns: 0.10 }, img: 'shop_cactus.png', nameKey: 'name_shop_cactus', descKey: 'desc_shop_cactus' },
        { id: 'shop_scarab', stage: 2, rarity: 'epic', cost: 1400, type: 'stat', stats: { luck: 10, greed: 10 }, img: 'shop_scarab.png', nameKey: 'name_shop_scarab', descKey: 'desc_shop_scarab' },
        { id: 'shop_mirage', stage: 2, rarity: 'legendary', cost: 3500, type: 'stat', stats: { evasion: 0.10 }, img: 'shop_mirage.png', nameKey: 'name_shop_mirage', descKey: 'desc_shop_mirage' },

        { id: 'shop_coal', stage: 3, rarity: 'common', cost: 400, type: 'stat', stats: { duration: 0.10 }, img: 'shop_coal.png', nameKey: 'name_shop_coal', descKey: 'desc_shop_coal' },
        { id: 'shop_magma', stage: 3, rarity: 'rare', cost: 900, type: 'stat', stats: { critChance: 0.05 }, img: 'shop_magma.png', nameKey: 'name_shop_magma', descKey: 'desc_shop_magma' },
        { id: 'shop_fireheart', stage: 3, rarity: 'epic', cost: 1500, type: 'stat', stats: { might: 0.15, area: 0.15 }, img: 'shop_fireheart.png', nameKey: 'name_shop_fireheart', descKey: 'desc_shop_fireheart' },
        { id: 'shop_dragoneye', stage: 3, rarity: 'legendary', cost: 4000, type: 'stat', stats: { critChance: 0.20, critDamage: 0.25 }, img: 'shop_dragoneye.png', nameKey: 'name_shop_dragoneye', descKey: 'desc_shop_dragoneye' },

        { id: 'shop_mushroom', stage: 4, rarity: 'common', cost: 400, type: 'stat', stats: { magnet: 20 }, img: 'shop_mushroom.png', nameKey: 'name_shop_mushroom', descKey: 'desc_shop_mushroom' },
        { id: 'shop_geode', stage: 4, rarity: 'rare', cost: 1000, type: 'stat', stats: { shopDefense: 0.05 }, img: 'shop_geode.png', nameKey: 'name_shop_geode', descKey: 'desc_shop_geode' },
        { id: 'shop_focus', stage: 4, rarity: 'epic', cost: 1600, type: 'stat', stats: { cooldown: 0.15 }, img: 'shop_focus.png', nameKey: 'name_shop_focus', descKey: 'desc_shop_focus' },
        { id: 'shop_prism', stage: 4, rarity: 'legendary', cost: 5000, type: 'stat', stats: { amount: 2 }, img: 'shop_prism.png', nameKey: 'name_shop_prism', descKey: 'desc_shop_prism' }
    ]
};
// game/lore.js

// База знаний о мире (тексты, описания)
// ID должны совпадать с ключами в database.js (enemies) или items

const LORE = {
    // --- ВРАГИ (ENEMIES) ---
    enemies: {
        // === GRAVEYARD ===
        'skeleton1': {
            name: { ru: "Скелет", en: "Skeleton" },
            title: { ru: "Костяной Ходок", en: "Bonewalker" },
            desc: {
                ru: "Скелет поднимается из земли не по воле разума, а по инерции забытой магии. Его пустые глазницы не видят, но ощущают жизнь как трещину в тишине. Он никогда не останавливается — будто сама смерть пинает его вперёд.",
                en: "The skeleton rises not through will, but through leftover magic. Its hollow eye sockets do not see, yet they sense the living like a crack in the silence. It never stops—driven forward as if death itself pushes it."
            }
        },
        'zombie1': {
            name: { ru: "Зомби", en: "Zombie" },
            title: { ru: "Гниющий Странник", en: "Grave Rotter" },
            desc: {
                ru: "Сырая плоть держится на нём лоскутами, но каждый шаг он делает с пугающей уверенностью. Его присутствие пахнет сыростью могилы и стоном прошлого. Если дать ему подойти слишком близко — он рвёт жертву с неожиданной силой.",
                en: "Damp flesh clings to his body in loose patches, yet he moves with disturbing certainty. His presence smells of grave soil and the muffled groan of the past. Allow him too close, and he strikes with unexpected strength."
            }
        },
        'boss1': { // Grave Reaper
            name: { ru: "Могильный Жнец", en: "Grave Reaper" },
            title: { ru: "Страж Погоста", en: "Graveyard Guardian" },
            desc: {
                ru: "Вершина всех, кто восставал из-под земли. На его черепе следы старой войны, а капюшон впитал ночь. Когда он шагает, земля потрескивает. Победить его — значит нарушить древний покой, который он охраняет.",
                en: "The culmination of every corpse ever risen. Battle scars mark his skull, and his hood absorbed the night. When he steps, the ground cracks. Defeating him means disturbing the ancient rest he protects."
            }
        },

        // === DESERT ===
        'firezombie2': {
            name: { ru: "Огненный Зомби", en: "Fire Zombie" },
            title: { ru: "Опаленный Гуль", en: "Sunburned Ghoul" },
            desc: {
                ru: "Его кожа треснула под солнцем, открывая угли внутри. Жара пустыни не убила его, а заставила гореть медленным проклятием. Он движется быстрее, подгоняемый пламенем изнутри. Напоминание, что даже смерть не спасает от солнца.",
                en: "His skin cracked under the sun, revealing glowing embers. The heat didn’t kill him; it transformed him into a slow-burning curse. He moves fast, pushed by the flame inside. A reminder that death protects no one from the sun."
            }
        },
        'sandgolem2': {
            name: { ru: "Песчаный Голем", en: "Sand Golem" },
            title: { ru: "Живая Дюна", en: "Living Dune" },
            desc: {
                ru: "Тело из спрессованного песка и древней магии. Медленный, но каждый шаг грохочет как обвал. Он не знает жалости и не понимает слов — просто выполняет волю песков, которые его породили.",
                en: "A body of compacted sand and ancient magic. Slow, but each step booms like a falling cliff. It knows no mercy and understands no words—it merely obeys the will of the sands that birthed it."
            }
        },
        'owl2': {
            name: { ru: "Пустынная Сова", en: "Desert Owl" },
            title: { ru: "Смотрящая в Ночи", en: "Dune Watcher" },
            desc: {
                ru: "Больше похожа на ожившую статую, чем на птицу. Её глаза светятся как две луны. Она наблюдает за путниками и решает, достойны ли они пройти, обрушивая на них магию бурь. Пустыня следит за тобой.",
                en: "More like a statue awakened at night than a bird. Its eyes shine like twin moons. It judges travelers, raining storm magic upon the unworthy. The desert is watching you."
            }
        },
        'boss2': { // Desert Mage
            name: { ru: "Пророк Бури", en: "Stormbinder" },
            title: { ru: "Голос Пустыни", en: "Voice of the Desert" },
            desc: {
                ru: "Соткан из песка и ветра, глаза — чистая молния. Он владеет силой, способной разорвать облака. Он не просто колдун — он голос пустыни. Сразиться с ним — значит бросить вызов самому небу.",
                en: "Woven from sand and wind, with eyes of pure lightning. He wields power enough to tear clouds apart. He is not just a sorcerer—he is the desert’s voice. To face him is to challenge the sky itself."
            }
        },

        // === VOLCANO ===
        'firegolem3': {
            name: { ru: "Огненный Голем", en: "Fire Golem" },
            title: { ru: "Ярость Горы", en: "Mountain's Fury" },
            desc: {
                ru: "Ходячий вулкан в каменной оболочке. Пламя танцует по его спине, а земля под ногами плавится. Он медленный, но каждый удар — взрыв. Это чистая ярость горы, вырвавшаяся наружу.",
                en: "A walking volcano encased in stone. Flames dance across its back, melting the ground beneath. Slow, but every strike is an explosion. It is the mountain’s fury given form."
            }
        },
        'firesliz3': {
            name: { ru: "Огненная Слизь", en: "Fire Slime" },
            title: { ru: "Лавовая Капля", en: "Lava Drop" },
            desc: {
                ru: "Кипящая масса лавы, несущаяся с бешеной скоростью. Она не думает, она стремится к теплу, чтобы взорваться. Кто-то считает её неудачным элементалем, кто-то — слезой вулкана.",
                en: "A boiling mass of lava moving at terrifying speed. It doesn't think; it seeks heat to explode upon. Some call it a failed elemental, others—a tear of the volcano."
            }
        },
        'boss31': { // Phase 1
            name: { ru: "Пламорогий Титан", en: "Pyrehorn Titan" },
            title: { ru: "Сердце Вулкана", en: "Volcano Heart" },
            desc: {
                ru: "Сформирован из базальтовых плит, под которыми течет магма. Его рога — символ власти, а шаги вызывают землетрясения. Он проверяет врага на прочность метеоритным дождем. Это ещё не ярость, а предупреждение.",
                en: "Forged from basalt slabs covering a magma core. His horns mark his dominance, his steps cause tremors. He tests intruders with meteor showers. This is not fury yet—only a warning."
            }
        },
        // Фаза 2 технически тот же босс, но можно добавить отдельную запись, если у них разные ID в spawner.js
        // В spawner.js есть boss31 и boss32. Добавим и второго.
        'boss32': {
            name: { ru: "Титан (Форма Огня)", en: "Titan (Fire Form)" },
            title: { ru: "Катастрофа", en: "Cataclysm" },
            desc: {
                ru: "Камень треснул, огонь взял верх. Теперь он — живой шторм пламени. Он стремится уничтожить всё, восстанавливая первозданную лавовую пустошь. Это воплощение катастрофы, которую можно лишь пережить.",
                en: "The stone cracked, fire took over. Now he is a living flame storm. He seeks to erase everything, restoring the molten wasteland. He is a natural disaster that can only be survived."
            }
        },

        // === CAVES ===
        'crystalserpent4': {
            name: { ru: "Кристальный Змей", en: "Crystal Serpent" },
            title: { ru: "Живая Жила", en: "Living Vein" },
            desc: {
                ru: "Расколотая жила древнего минерала, оживленная магией. Движется с механической точностью, стреляя острыми осколками. Слышит вибрации мыслей. Чем глубже в пещеру, тем он агрессивнее.",
                en: "A fractured mineral vein animated by magic. Moves with mechanical precision, firing sharp shards. It hears the vibration of thoughts. The deeper you go, the more aggressive it becomes."
            }
        },
        'crystalstrider4': {
            name: { ru: "Кристальный Странник", en: "Crystal Strider" },
            title: { ru: "Хранитель Порядка", en: "Order Keeper" },
            desc: {
                ru: "Вырезан из бирюзы, рога как корни дерева. Он наблюдает, оценивает, а затем выпускает сферы чистой энергии, которые ищут цель. Он не чувствует злобы, но уничтожает всё, что нарушает гармонию.",
                en: "Carved from turquoise, antlers like roots. It observes, judges, then unleashes seeking spheres of pure energy. It feels no malice, yet eliminates anything that disrupts the harmony."
            }
        },
        'shardgolem4': {
            name: { ru: "Осколочный Голем", en: "Shard Golem" },
            title: { ru: "Давление Времени", en: "Time's Pressure" },
            desc: {
                ru: "Воплощение давления и времени. Тысячи лет кристаллы росли, чтобы стать им. Его шаги сотрясают пещеру, а кулаки раскалывают камень. Он защищает ядро пещер от любого вторжения.",
                en: "The embodiment of pressure and time. Crystals grew for millennia to form him. His steps shake the cave, his fists shatter stone. He defends the cave’s heart from all intrusion."
            }
        },
        'boss4': { // Crystal Monarch
            name: { ru: "Кристальный Монарх", en: "Crystal Monarch" },
            title: { ru: "Венец Эволюции", en: "Evolution's Peak" },
            desc: {
                ru: "Венец эволюции кристальной магии. Черный минерал с зелеными венами силы. Его молчание давит сильнее ударов. Он видит в тебе нарушителя мира, который существовал задолго до людей.",
                en: "The pinnacle of crystal magic evolution. Black mineral with green veins of power. His silence weighs heavier than his strikes. To him, you are a trespasser in a world older than humanity."
            }
        },

        // === VOID ===
        'abysswraith5': {
            name: { ru: "Призрак Бездны", en: "Abyss Wraith" },
            title: { ru: "Ошибка Реальности", en: "Reality Glitch" },
            desc: {
                ru: "Обрывок пустоты, случайно обретший форму. Тело из теневых пикселей. Его атаки рождены из отсутствия материи. Встреча с ним оставляет чувство, будто часть твоей души осталась позади.",
                en: "A fragment of void accidentally given shape. A body of shadow pixels. Its attacks are born from the absence of matter. Encountering it feels like leaving a piece of your soul behind."
            }
        },
        'rifttitan5': {
            name: { ru: "Титан Разлома", en: "Rift Titan" },
            title: { ru: "Разрыв", en: "The Tear" },
            desc: {
                ru: "Громада, вышедшая из разорванной реальности. Он не живой, он просто 'случился'. Его существование вызывает скрип пространства. Победить его — значит закрыть трещину, из которой он пришёл.",
                en: "A hulk emerging from torn reality. Neither alive nor crafted, it simply 'happened'. Its existence makes space creak. Defeating it momentarily seals the crack from which it came."
            }
        },
        'voidharbinger5': {
            name: { ru: "Предвестник Пустоты", en: "Void Harbinger" },
            title: { ru: "Глашатай Конца", en: "Herald of the End" },
            desc: {
                ru: "Силуэт без лица, только светящийся символ. Его магия рвёт пространство. Легенды гласят, что он проверяет, готов ли этот мир исчезнуть. Если он пришел — за ним идет нечто куда хуже.",
                en: "A faceless silhouette, only a glowing symbol. His magic tears space itself. Legends say he checks if this world is ready to vanish. If he is here—something far worse follows."
            }
        },
        'boss51': { // Void Lord Phase 1
            name: { ru: "Владыка (Тень)", en: "Void Lord (Shade)" },
            title: { ru: "Расколотая Тень", en: "Shattered Shade" },
            desc: {
                ru: "Угольно-чёрный гигант, похожий на живой метеорит. Он изучает мир перед уничтожением. Трещины на теле растут от давления силы внутри. Это лишь оболочка.",
                en: "An obsidian giant, like a living meteor. He studies the world before erasing it. Cracks on his body widen from internal pressure. This is merely a shell."
            }
        },
        'boss52': { // Void Lord Phase 2
            name: { ru: "Владыка (Разрушитель)", en: "Void Lord (Carver)" },
            title: { ru: "Высекатель Бездны", en: "Abyss Carver" },
            desc: {
                ru: "Тело расщепилось на острые пластины. Теперь он не изучает, а ломает структуру реальности. Он прожигает мир одним своим существованием.",
                en: "His body split into razor plates. He no longer observes; he dismantles reality's structure. His mere existence burns the world."
            }
        },
        'boss53': { // Void Lord Phase 3
            name: { ru: "Владыка (Истина)", en: "Void Lord (True)" },
            title: { ru: "Истинная Пустота", en: "True Void" },
            desc: {
                ru: "Чистая аннигиляция. Голос исчез, говорит сама пустота. Рядом с ним исчезают тени, звук и логика. Это не месть, а возвращение к изначальной тишине.",
                en: "Pure annihilation. The voice fades, the void speaks. Near him, shadows, sound, and logic vanish. This is not vengeance, but a return to original silence."
            }
        }
    },

    // --- ПРЕДМЕТЫ (ITEMS) - Опционально, можно добавить позже ---
    items: {
        'soul_stone': {
            name: { ru: "Камень Душ", en: "Soul Stone" },
            levels: [
                { ru: "Камень пульсирует слабым теплом...", en: "The stone pulses with weak warmth..." }, // 1
                { ru: "Свет становится ярче. Вы слышите шепот.", en: "The light grows brighter. You hear whispers." }, // 2
                { ru: "Камень жаждет большего. Ваша сила растет.", en: "The stone craves more. Your power grows." }, // 3
                { ru: "Он почти горячий. Граница миров истончается.", en: "It is nearly hot. The veil between worlds thins." }, // 4
                { ru: "АБСОЛЮТНАЯ ВЛАСТЬ. ВЫ И ЕСТЬ СМЕРТЬ.", en: "ABSOLUTE POWER. YOU ARE DEATH." } // 5 (Max)
            ]
        }
    },


    // --- ОБЪЕКТЫ МИРА (WORLD) ---
    world: {
        'merchant': {
            name: { ru: "Таинственный Торговец", en: "Mysterious Merchant" },
            title: { ru: "Странник Пустоты", en: "Void Walker" },
            desc: {
                ru: "Никто не знает, откуда он приходит. Он появляется в разгар битвы, предлагая редкие артефакты в обмен на золото. Говорят, его мешок бесконечен, как и его жадность.",
                en: "No one knows where he comes from. He appears in the heat of battle, offering rare artifacts for gold. They say his bag is endless, much like his greed."
            }
        },
        'anvil': {
            name: { ru: "Проклятая Наковальня", en: "Cursed Anvil" },
            title: { ru: "Кузница Ада", en: "Hellforge" },
            desc: {
                ru: "Эта наковальня холодна на ощупь, но металл на ней раскаляется сам собой. Она позволяет усилить оружие темной магией, но цена за такую мощь всегда высока.",
                en: "This anvil is cold to the touch, yet metal heats up upon it on its own. It allows empowering weapons with dark magic, but the price for such power is always high."
            }
        },
        'chest_normal': {
            name: { ru: "Сундук с Сокровищами", en: "Treasure Chest" },
            title: { ru: "Дар Судьбы", en: "Gift of Fate" },
            desc: {
                ru: "Оставлен павшими героями или послан богами. Внутри можно найти золото или улучшения для оружия. Иногда за удачу приходится платить.",
                en: "Left by fallen heroes or sent by gods. Inside, one can find gold or weapon upgrades. Sometimes, luck comes with a price."
            }
        },
        'chest_gold': {
            name: { ru: "Золотой Сундук", en: "Golden Chest" },
            title: { ru: "Реликвия", en: "Relic" },
            desc: {
                ru: "Сияет внутренним светом. Содержит не просто улучшения, а способность ЭВОЛЮЦИОНИРОВАТЬ оружие, раскрывая его истинный разрушительный потенциал.",
                en: "Glows with inner light. Contains not just upgrades, but the ability to EVOLVE weapons, unlocking their true destructive potential."
            }
        },
        'monument': {
            name: { ru: "Древний Монумент", en: "Ancient Monument" },
            title: { ru: "Алтарь Жертв", en: "Sacrificial Altar" },
            desc: {
                ru: "Странный обелиск, требующий крови. Если убить достаточно врагов в его круге, он дарует благословение. Но он никогда не насытится полностью.",
                en: "A strange obelisk demanding blood. If enough enemies are slain within its circle, it grants a blessing. But it will never be fully stated."
            }
        },
        'portal': {
            name: { ru: "Портал Измерений", en: "Dimensional Portal" },
            title: { ru: "Путь Дальше", en: "Way Forward" },
            desc: {
                ru: "Разрыв в пространстве, созданный смертью могущественного стража. Он ведет в следующий круг ада. Только храбрые (или безумные) решаются шагнуть в него.",
                en: "A rift in space created by the death of a powerful guardian. It leads to the next circle of hell. Only the brave (or the mad) dare to step into it."
            }
        }
    }
};

// Экспортируем для использования
window.LORE = LORE;
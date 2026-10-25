-- Una fila por partida terminada (Fase 14A). Sin IP, sin identificadores: solo lo que manda el juego.
CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    version TEXT NOT NULL,
    map TEXT NOT NULL,
    character TEXT NOT NULL,
    device TEXT NOT NULL,
    result TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    level INTEGER NOT NULL,
    kills INTEGER NOT NULL,
    killer TEXT NOT NULL,
    gear TEXT NOT NULL,
    cards TEXT NOT NULL,
    zem_used INTEGER NOT NULL,
    crits INTEGER NOT NULL,
    fps_avg REAL NOT NULL,
    fps_low REAL NOT NULL,
    resumed INTEGER NOT NULL,
    -- Añadidas en el mismo 14A (ALTER TABLE en la base ya creada).
    level_by_minute TEXT NOT NULL DEFAULT '[]',
    damage_by TEXT NOT NULL DEFAULT '{}',
    min_hp_pct INTEGER NOT NULL DEFAULT 100,
    bosses TEXT NOT NULL DEFAULT '[]',
    potions INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS runs_version ON runs (version);

-- Código de traspaso (Fase 27½): una fila por código vivo. Se borra al canjearlo o a las 24 h. Sin IP ni nada personal.
CREATE TABLE IF NOT EXISTS transfers (
    code TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL, -- milisegundos (Date.now())
    data TEXT NOT NULL           -- la partida tal cual la manda el juego (TransferPackage en JSON)
);
CREATE INDEX IF NOT EXISTS transfers_created ON transfers (created_at);

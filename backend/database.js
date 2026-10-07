const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// Quanto cada status cai por hora (0 a 100)
const DECAY_PER_HOUR = { hunger: 5, happiness: 3, energy: 2 };

const clamp = (v) => Math.max(0, Math.min(100, v));

// Efeito de cada ação nos status
const ACTIONS = {
  feed:  (p) => ({ hunger: p.hunger + 30 }),
  play:  (p) => ({ happiness: p.happiness + 25, energy: p.energy - 10 }),
  sleep: (p) => ({ energy: p.energy + 40 }),
};

class Database {
  constructor(file = path.join(__dirname, 'tamagotchi.db')) {
    this.db = new sqlite3.Database(file);
    this.ready = this.init();
  }

  // --- helpers que transformam o sqlite3 em Promises ---
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        err ? reject(err) : resolve(this);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  // --- criação / migração da tabela ---
  async init() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hunger REAL DEFAULT 100,
        happiness REAL DEFAULT 100,
        energy REAL DEFAULT 100,
        last_update INTEGER
      )
    `);

    // Bancos antigos (da versão anterior) não têm a coluna last_update
    const cols = await this.all('PRAGMA table_info(pets)');
    if (!cols.some((c) => c.name === 'last_update')) {
      await this.run('ALTER TABLE pets ADD COLUMN last_update INTEGER');
    }
    await this.run('UPDATE pets SET last_update = ? WHERE last_update IS NULL', [Date.now()]);
  }

  // --- regras do jogo ---
  // Calcula quanto os status caíram desde a última atualização
  applyDecay(pet, now = Date.now()) {
    const hours = Math.max(0, (now - pet.last_update) / 3600000);
    return {
      ...pet,
      hunger: clamp(pet.hunger - hours * DECAY_PER_HOUR.hunger),
      happiness: clamp(pet.happiness - hours * DECAY_PER_HOUR.happiness),
      energy: clamp(pet.energy - hours * DECAY_PER_HOUR.energy),
      last_update: now,
    };
  }

  async save(pet) {
    await this.run(
      'UPDATE pets SET hunger = ?, happiness = ?, energy = ?, last_update = ? WHERE id = ?',
      [pet.hunger, pet.happiness, pet.energy, pet.last_update, pet.id]
    );
    return pet;
  }

  async createPet(name) {
    await this.ready;
    const id = crypto.randomBytes(5).toString('hex');
    const now = Date.now();
    await this.run(
      'INSERT INTO pets (id, name, hunger, happiness, energy, last_update) VALUES (?, ?, 100, 100, 100, ?)',
      [id, name, now]
    );
    return this.getPet(id);
  }

  // Busca o pet já com o tempo passado aplicado
  async getPet(id) {
    await this.ready;
    const row = await this.get('SELECT * FROM pets WHERE id = ?', [id]);
    if (!row) return null;
    return this.save(this.applyDecay(row));
  }

  async doAction(id, action) {
    if (!ACTIONS[action]) {
      const err = new Error('Ação inválida');
      err.status = 400;
      throw err;
    }
    const pet = await this.getPet(id);
    if (!pet) return null;

    if (action === 'play' && pet.energy < 10) {
      const err = new Error('Seu pet está cansado demais para brincar. Deixe-o dormir!');
      err.status = 400;
      throw err;
    }

    const changes = ACTIONS[action](pet);
    for (const [key, value] of Object.entries(changes)) {
      pet[key] = clamp(value);
    }
    return this.save(pet);
  }
}

module.exports = Database;

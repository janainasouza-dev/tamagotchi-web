const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'tamagotchi.db'));
    this.init();
  }

  init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hunger INTEGER DEFAULT 100,
        happiness INTEGER DEFAULT 100,
        energy INTEGER DEFAULT 100,
        last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  createPet(name) {
    const id = Math.random().toString(36).substr(2, 9);
    const stmt = this.db.prepare(`
      INSERT INTO pets (id, name, hunger, happiness, energy, last_interaction)
      VALUES (?, ?, 100, 100, 100, datetime('now'))
    `);
    stmt.run(id, name);
    stmt.finalize();
    return this.getPet(id);
  }

  getPet(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM pets WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  updateStats(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM pets WHERE id = ?', [id], (err, pet) => {
        if (err || !pet) {
          reject(err);
          return;
        }

        const now = new Date();
        const lastInteraction = new Date(pet.last_interaction);
        const hoursPassed = (now - lastInteraction) / (1000 * 60 * 60);

        if (hoursPassed > 0) {
          const hungerDecay = Math.min(100, hoursPassed * 5);
          const happinessDecay = Math.min(100, hoursPassed * 3);
          const energyDecay = Math.min(100, hoursPassed * 2);

          const newHunger = Math.max(0, pet.hunger - hungerDecay);
          const newHappiness = Math.max(0, pet.happiness - happinessDecay);
          const newEnergy = Math.max(0, pet.energy - energyDecay);

          this.db.run(`
            UPDATE pets 
            SET hunger = ?, happiness = ?, energy = ?, last_interaction = datetime('now')
            WHERE id = ?
          `, [newHunger, newHappiness, newEnergy, id]);
          
          pet.hunger = newHunger;
          pet.happiness = newHappiness;
          pet.energy = newEnergy;
        }
        
        resolve(pet);
      });
    });
  }

  async feedPet(id) {
    const pet = await this.updateStats(id);
    const newHunger = Math.min(100, pet.hunger + 30);
    this.db.run('UPDATE pets SET hunger = ?, last_interaction = datetime("now") WHERE id = ?', [newHunger, id]);
    return this.getPet(id);
  }

  async playWithPet(id) {
    const pet = await this.updateStats(id);
    const newHappiness = Math.min(100, pet.happiness + 25);
    const newEnergy = Math.max(0, pet.energy - 10);
    this.db.run('UPDATE pets SET happiness = ?, energy = ?, last_interaction = datetime("now") WHERE id = ?', [newHappiness, newEnergy, id]);
    return this.getPet(id);
  }

  async sleepPet(id) {
    const pet = await this.updateStats(id);
    const newEnergy = Math.min(100, pet.energy + 40);
    this.db.run('UPDATE pets SET energy = ?, last_interaction = datetime("now") WHERE id = ?', [newEnergy, id]);
    return this.getPet(id);
  }
}

module.exports = Database;
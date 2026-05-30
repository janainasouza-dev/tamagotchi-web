const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Banco de dados
const db = new sqlite3.Database('./tamagotchi.db');

// Criar tabela
db.run(`
  CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hunger INTEGER DEFAULT 100,
    happiness INTEGER DEFAULT 100,
    energy INTEGER DEFAULT 100,
    last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Criar pet
app.post('/api/pet', (req, res) => {
  const { name } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  
  db.run(
    'INSERT INTO pets (id, name, hunger, happiness, energy) VALUES (?, ?, 100, 100, 100)',
    [id, name],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id, name, hunger: 100, happiness: 100, energy: 100 });
    }
  );
});

// Buscar pet
app.get('/api/pet/:id', (req, res) => {
  db.get('SELECT * FROM pets WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Pet não encontrado' });
    } else {
      res.json(row);
    }
  });
});

// Alimentar
app.post('/api/pet/:id/feed', (req, res) => {
  db.get('SELECT * FROM pets WHERE id = ?', [req.params.id], (err, pet) => {
    if (err || !pet) {
      res.status(404).json({ error: 'Pet não encontrado' });
      return;
    }
    
    const newHunger = Math.min(100, pet.hunger + 30);
    db.run('UPDATE pets SET hunger = ?, last_interaction = CURRENT_TIMESTAMP WHERE id = ?', 
      [newHunger, req.params.id]);
    res.json({ ...pet, hunger: newHunger });
  });
});

// Brincar
app.post('/api/pet/:id/play', (req, res) => {
  db.get('SELECT * FROM pets WHERE id = ?', [req.params.id], (err, pet) => {
    if (err || !pet) {
      res.status(404).json({ error: 'Pet não encontrado' });
      return;
    }
    
    const newHappiness = Math.min(100, pet.happiness + 25);
    const newEnergy = Math.max(0, pet.energy - 10);
    db.run('UPDATE pets SET happiness = ?, energy = ?, last_interaction = CURRENT_TIMESTAMP WHERE id = ?', 
      [newHappiness, newEnergy, req.params.id]);
    res.json({ ...pet, happiness: newHappiness, energy: newEnergy });
  });
});

// Dormir
app.post('/api/pet/:id/sleep', (req, res) => {
  db.get('SELECT * FROM pets WHERE id = ?', [req.params.id], (err, pet) => {
    if (err || !pet) {
      res.status(404).json({ error: 'Pet não encontrado' });
      return;
    }
    
    const newEnergy = Math.min(100, pet.energy + 40);
    db.run('UPDATE pets SET energy = ?, last_interaction = CURRENT_TIMESTAMP WHERE id = ?', 
      [newEnergy, req.params.id]);
    res.json({ ...pet, energy: newEnergy });
  });
});

// Servir arquivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🎮 Tamagotchi disponível em http://localhost:${PORT}`);
});
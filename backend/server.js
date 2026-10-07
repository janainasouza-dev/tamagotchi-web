const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const db = new Database();

app.use(cors());
app.use(express.json());
// Serve o frontend (index.html, style.css, app.js)
app.use(express.static(path.join(__dirname, 'public')));

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    if (!err.status || err.status >= 500) console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  });

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Criar pet
app.post('/api/pet', wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Informe um nome para o pet' });
  if (name.length > 20) return res.status(400).json({ error: 'O nome pode ter no máximo 20 caracteres' });
  res.status(201).json(await db.createPet(name));
}));

// Buscar pet (já com os status atualizados pelo tempo)
app.get('/api/pet/:id', wrap(async (req, res) => {
  const pet = await db.getPet(req.params.id);
  if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });
  res.json(pet);
}));

// Ações: feed (alimentar), play (brincar), sleep (dormir)
app.post('/api/pet/:id/:action', wrap(async (req, res) => {
  const pet = await db.doAction(req.params.id, req.params.action);
  if (!pet) return res.status(404).json({ error: 'Pet não encontrado' });
  res.json(pet);
}));

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🎮 Tamagotchi disponível em http://localhost:${PORT}`);
});

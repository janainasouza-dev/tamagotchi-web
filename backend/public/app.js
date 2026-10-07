const API = '/api';
const REFRESH_MS = 30000;

const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

let petId = localStorage.getItem('petId');
let toastTimer;

// ---------- utilidades ----------
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Erro inesperado');
    error.status = response.status;
    throw error;
  }
  return data;
}

function statusClass(value) {
  if (value < 30) return 'critical';
  if (value < 60) return 'warning';
  return 'good';
}

function getMood(pet) {
  if (pet.hunger < 20)    return { emoji: '🍽️😢', text: 'Está com muita fome!', anim: 'sad' };
  if (pet.happiness < 20) return { emoji: '😞',   text: 'Está muito triste...', anim: 'sad' };
  if (pet.energy < 20)    return { emoji: '😴',   text: 'Está com muito sono.', anim: 'sleeping' };
  if (pet.happiness > 80) return { emoji: '😊🎉', text: 'Está radiante!',       anim: 'happy' };
  if (pet.energy > 80)    return { emoji: '⚡😃', text: 'Cheio de energia!',    anim: 'happy' };
  return { emoji: '🐶', text: 'Está bem.', anim: 'idle' };
}

// ---------- tela de adoção ----------
function renderCreate(message) {
  app.innerHTML = `
    <div class="container">
      <h1>🐣 Tamagotchi Web</h1>
      ${message ? `<div class="banner">${message}</div>` : ''}
      <div class="create-pet">
        <input type="text" id="petNameInput" placeholder="Nome do seu pet" maxlength="20" autofocus>
        <br>
        <button id="adoptBtn">Adotar Pet</button>
      </div>
    </div>
  `;
  const input = document.getElementById('petNameInput');
  document.getElementById('adoptBtn').addEventListener('click', () => createPet(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') createPet(input.value); });
}

async function createPet(rawName) {
  const name = rawName.trim();
  if (!name) return showToast('Digite um nome para o seu pet!');
  try {
    const pet = await request('/pet', { method: 'POST', body: JSON.stringify({ name }) });
    petId = pet.id;
    localStorage.setItem('petId', petId);
    renderPetScreen();
    updateView(pet);
  } catch (error) {
    showToast(error.message === 'Failed to fetch'
      ? 'Não consegui falar com o servidor. Ele está rodando?'
      : error.message);
  }
}

// ---------- tela do pet ----------
// Monta a estrutura uma vez; depois só atualizamos os valores (assim as animações não reiniciam)
function renderPetScreen() {
  app.innerHTML = `
    <div class="container">
      <div id="banner"></div>
      <div class="pet-emoji idle" id="petEmoji">🐶</div>
      <h2 id="petName"></h2>
      <p class="pet-mood" id="petMood"></p>

      ${[
        ['hunger', '🍖 Saciedade'],
        ['happiness', '😊 Felicidade'],
        ['energy', '⚡ Energia'],
      ].map(([key, label]) => `
        <div class="status-bar">
          <div class="status-label">${label}: <span id="${key}">0</span>%</div>
          <div class="bar-container"><div class="bar good" id="${key}Bar" style="width:0%"></div></div>
        </div>
      `).join('')}

      <div class="actions">
        <button class="btn-feed"  data-action="feed">🍎 Alimentar</button>
        <button class="btn-play"  data-action="play">🎮 Brincar</button>
        <button class="btn-sleep" data-action="sleep">😴 Dormir</button>
      </div>

      <button class="btn-link" id="newPetBtn">Adotar outro pet</button>
    </div>
  `;

  document.querySelectorAll('.actions button').forEach((btn) => {
    btn.addEventListener('click', () => doAction(btn.dataset.action));
  });
  document.getElementById('newPetBtn').addEventListener('click', () => {
    if (confirm('Tem certeza? Você vai deixar este pet para trás.')) {
      localStorage.removeItem('petId');
      petId = null;
      renderCreate();
    }
  });
}

function updateView(pet) {
  const mood = getMood(pet);

  document.getElementById('petName').textContent = pet.name; // textContent evita injeção de HTML
  document.getElementById('petMood').textContent = `${pet.name} ${mood.text.charAt(0).toLowerCase()}${mood.text.slice(1)}`;

  const emoji = document.getElementById('petEmoji');
  emoji.textContent = mood.emoji;
  emoji.className = `pet-emoji ${mood.anim}`;

  for (const key of ['hunger', 'happiness', 'energy']) {
    document.getElementById(key).textContent = Math.floor(pet[key]);
    const bar = document.getElementById(`${key}Bar`);
    bar.style.width = `${pet[key]}%`;
    bar.className = `bar ${statusClass(pet[key])}`;
  }
  document.getElementById('banner').innerHTML = '';
}

async function loadPet() {
  if (!petId) return;
  try {
    updateView(await request(`/pet/${petId}`));
  } catch (error) {
    if (error.status === 404) {
      // O pet não existe mais no servidor (ex.: banco apagado)
      localStorage.removeItem('petId');
      petId = null;
      renderCreate('Seu pet anterior não foi encontrado. Que tal adotar um novo?');
    } else {
      const banner = document.getElementById('banner');
      if (banner) banner.innerHTML = '<div class="banner">⚠️ Sem conexão com o servidor. Tentando de novo...</div>';
    }
  }
}

async function doAction(type) {
  const buttons = document.querySelectorAll('.actions button');
  buttons.forEach((b) => (b.disabled = true));
  try {
    updateView(await request(`/pet/${petId}/${type}`, { method: 'POST' }));
  } catch (error) {
    if (error.status === 404) loadPet();
    else showToast(error.message === 'Failed to fetch' ? 'Sem conexão com o servidor.' : error.message);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}

// ---------- início ----------
if (petId) {
  renderPetScreen();
  loadPet();
} else {
  renderCreate();
}

setInterval(loadPet, REFRESH_MS);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadPet(); });

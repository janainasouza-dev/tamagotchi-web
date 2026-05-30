import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Tamagotchi from './components/Tamagotchi';
import StatusBar from './components/StatusBar';
import ActionsPanel from './components/ActionsPanel';
import './styles/App.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [petId, setPetId] = useState(localStorage.getItem('petId'));

  useEffect(() => {
    if (petId) {
      loadPet();
    } else {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (petId) {
      const interval = setInterval(loadPet, 30000); // Atualiza a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [petId]);

  const loadPet = async () => {
    if (!petId) return;
    try {
      const response = await axios.get(`${API_URL}/tamagotchi/${petId}`);
      setPet(response.data);
    } catch (error) {
      console.error('Erro ao carregar pet:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPet = async (name) => {
    try {
      const response = await axios.post(`${API_URL}/tamagotchi`, { name });
      const newPetId = response.data.id;
      localStorage.setItem('petId', newPetId);
      setPetId(newPetId);
    } catch (error) {
      console.error('Erro ao criar pet:', error);
    }
  };

  const action = async (actionType) => {
    if (!petId) return;
    try {
      const response = await axios.post(`${API_URL}/tamagotchi/${petId}/${actionType}`);
      setPet(response.data);
    } catch (error) {
      console.error(`Erro ao executar ${actionType}:`, error);
    }
  };

  if (loading) {
    return <div className="loading">Carregando seu Tamagotchi...</div>;
  }

  if (!petId) {
    return (
      <div className="create-pet">
        <h1>🐣 Bem-vindo ao Tamagotchi Web!</h1>
        <div className="create-form">
          <input 
            type="text" 
            placeholder="Nome do seu pet"
            id="petName"
            onKeyPress={(e) => e.key === 'Enter' && createPet(e.target.value)}
          />
          <button onClick={() => createPet(document.getElementById('petName').value)}>
            Adotar Pet
          </button>
        </div>
      </div>
    );
  }

  if (!pet) return <div className="error">Pet não encontrado!</div>;

  return (
    <div className="app">
      <h1>{pet.name} 🐾</h1>
      <Tamagotchi pet={pet} />
      <StatusBar pet={pet} />
      <ActionsPanel onAction={action} />
    </div>
  );
}

export default App;
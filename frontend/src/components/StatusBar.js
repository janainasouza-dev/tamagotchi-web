import React from 'react';

function StatusBar({ pet }) {
  const getStatusColor = (value) => {
    if (value < 30) return 'critical';
    if (value < 60) return 'warning';
    return 'good';
  };

  return (
    <div className="status-bars">
      <div className="status-item">
        <label>🍖 Fome: {Math.floor(pet.hunger)}%</label>
        <div className="bar-container">
          <div 
            className={`bar hunger ${getStatusColor(pet.hunger)}`}
            style={{ width: `${pet.hunger}%` }}
          />
        </div>
      </div>
      
      <div className="status-item">
        <label>😊 Felicidade: {Math.floor(pet.happiness)}%</label>
        <div className="bar-container">
          <div 
            className={`bar happiness ${getStatusColor(pet.happiness)}`}
            style={{ width: `${pet.happiness}%` }}
          />
        </div>
      </div>
      
      <div className="status-item">
        <label>⚡ Energia: {Math.floor(pet.energy)}%</label>
        <div className="bar-container">
          <div 
            className={`bar energy ${getStatusColor(pet.energy)}`}
            style={{ width: `${pet.energy}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default StatusBar;
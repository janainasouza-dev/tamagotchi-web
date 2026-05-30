import React from 'react';

function Tamagotchi({ pet }) {
  const getEmoji = () => {
    if (pet.hunger < 20) return '🍽️😢';
    if (pet.happiness < 20) return '😞';
    if (pet.energy < 20) return '😴';
    if (pet.happiness > 80) return '😊🎉';
    if (pet.energy > 80) return '⚡😃';
    return '🐶';
  };

  const getAnimation = () => {
    if (pet.energy < 20) return 'sleeping';
    if (pet.happiness > 80) return 'happy';
    return 'idle';
  };

  return (
    <div className={`tamagotchi ${getAnimation()}`}>
      <div className="pet-emoji">{getEmoji()}</div>
      <div className="pet-name">{pet.name}</div>
    </div>
  );
}

export default Tamagotchi;
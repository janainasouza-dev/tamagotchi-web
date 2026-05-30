import React from 'react';

function ActionsPanel({ onAction }) {
  return (
    <div className="actions-panel">
      <button onClick={() => onAction('feed')} className="action-btn feed">
        🍎 Alimentar
      </button>
      <button onClick={() => onAction('play')} className="action-btn play">
        🎮 Brincar
      </button>
      <button onClick={() => onAction('sleep')} className="action-btn sleep">
        😴 Dormir
      </button>
    </div>
  );
}

export default ActionsPanel;
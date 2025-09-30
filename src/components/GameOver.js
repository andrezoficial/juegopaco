import React from 'react';
import './GameOver.css';

const GameOver = ({ score, onRestart }) => {
  return (
    <div className="game-over-container">
      <div className="game-over-content">
        <h2>😿 Game Over</h2>
        <p className="final-score">Puntuación final: {score}</p>
        
        {score >= 100 && <p className="high-score">¡Nuevo récord! 🏆</p>}
        {score >= 50 && score < 100 && <p>¡Buen trabajo! 🎯</p>}
        {score < 50 && <p>Sigue practicando 😺</p>}
        
        <button className="restart-button" onClick={onRestart}>
          Jugar de Nuevo
        </button>
        
        <div className="cat-animation">
          <div className="sleeping-cat">😴</div>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
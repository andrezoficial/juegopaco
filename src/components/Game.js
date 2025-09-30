import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import './Game.css';

const Game = ({ onGameOver }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const {
    player,
    foods,
    obstacles,
    movePlayer,
    jumpPlayer,
    gameSpeed
  } = useGameEngine();

  // Dibujar el juego
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo (ciudad simple)
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar suelo
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 10);
    
    // Dibujar edificios de fondo
    ctx.fillStyle = '#A9A9A9';
    ctx.fillRect(50, 100, 80, 200);
    ctx.fillRect(200, 150, 100, 150);
    ctx.fillRect(350, 120, 70, 180);
    
    // Dibujar jugador (gato)
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Dibujar ojos del gato
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 5, player.y + 5, 5, 5);
    ctx.fillRect(player.x + 20, player.y + 5, 5, 5);
    
    // Dibujar cola
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(player.x - 10, player.y + 10, 10, 5);
    
    // Dibujar comida
    foods.forEach(food => {
      if (food.type === 'fish') {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(food.x, food.y, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cola del pescado
        ctx.fillStyle = '#FF8E8E';
        ctx.beginPath();
        ctx.moveTo(food.x - 10, food.y);
        ctx.lineTo(food.x - 15, food.y - 5);
        ctx.lineTo(food.x - 15, food.y + 5);
        ctx.closePath();
        ctx.fill();
      } else if (food.type === 'milk') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(food.x - 8, food.y - 12, 16, 24);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(food.x - 6, food.y - 10, 12, 15);
      } else if (food.type === 'croquettes') {
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(food.x - 6, food.y - 6, 12, 12);
        ctx.fillStyle = '#A52A2A';
        ctx.fillRect(food.x - 4, food.y - 4, 8, 8);
      }
    });
    
    // Dibujar obstáculos
    obstacles.forEach(obstacle => {
      if (obstacle.type === 'dog') {
        // Perro marrón
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Orejas
        ctx.fillRect(obstacle.x - 5, obstacle.y - 10, 10, 10);
        ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y - 10, 10, 10);
        
        // Manchas
        ctx.fillStyle = '#A52A2A';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, 8, 8);
      } else if (obstacle.type === 'box') {
        // Caja
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
      }
    });
    
    // Dibujar información del juego
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Puntos: ${score}`, 20, 30);
    ctx.fillText(`Vidas: ${lives}`, canvas.width - 100, 30);
    ctx.fillText(`Velocidad: x${gameSpeed.toFixed(1)}`, canvas.width / 2 - 50, 30);
  }, [player, foods, obstacles, score, lives, gameSpeed]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      draw();
    }, 1000 / 60); // 60 FPS
    
    return () => clearInterval(gameLoop);
  }, [draw]);

  // Manejar colisiones
  useEffect(() => {
    // Colisión con comida
    foods.forEach(food => {
      if (
        player.x < food.x + 15 &&
        player.x + player.width > food.x - 15 &&
        player.y < food.y + 15 &&
        player.y + player.height > food.y - 15
      ) {
        // Sonido de recoger comida (simulado)
        if (typeof window !== 'undefined' && window.AudioContext) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
        }
        
        setScore(prev => prev + 10);
      }
    });
    
    // Colisión con obstáculos
    obstacles.forEach(obstacle => {
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
      ) {
        // Sonido de choque
        if (typeof window !== 'undefined' && window.AudioContext) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
        }
        
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            onGameOver(score);
          }
          return newLives;
        });
      }
    });
  }, [player, foods, obstacles, score, onGameOver]);

  // Controles del teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          movePlayer('left');
          break;
        case 'ArrowRight':
          movePlayer('right');
          break;
        case 'ArrowUp':
        case ' ':
          jumpPlayer();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, jumpPlayer]);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="game-canvas"
        tabIndex={0}
      />
      
      <div className="controls-info">
        <p>← → para mover | ↑ o Espacio para saltar</p>
      </div>
    </div>
  );
};

export default Game;
import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { Header } from './components/Header';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { StartScreen } from './components/StartScreen';
import { Footer } from './components/Footer';

const App = () => {
  const {
    canvasRef,
    containerRef,
    canvasSize,
    isMobile,
    pacoImageLoaded,
    score,
    highScore,
    highestLevel,
    level,
    levelName,
    gameState,
    startGame,
    restartGame,
    togglePause,
  } = useGameEngine();

  const isPlaying = gameState === 'playing' || gameState === 'paused';

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '5px' : '20px',
        fontFamily: "'Baloo 2', sans-serif",
        overflow: 'hidden',
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
      <Header isMobile={isMobile} pacoImageLoaded={pacoImageLoaded} />

      {gameState === 'start' && (
        <StartScreen isMobile={isMobile} highScore={highScore} highestLevel={highestLevel} onStart={startGame} />
      )}

      {isPlaying && (
        <GameCanvas
          canvasRef={canvasRef}
          canvasSize={canvasSize}
          isMobile={isMobile}
          score={score}
          level={level}
          levelName={levelName}
          gameState={gameState}
          onTogglePause={togglePause}
          onRestart={restartGame}
        />
      )}

      {gameState === 'gameOver' && (
        <GameOverScreen
          score={score}
          highScore={highScore}
          level={level}
          levelName={levelName}
          highestLevel={highestLevel}
          isMobile={isMobile}
          onRestart={restartGame}
        />
      )}

      <Footer isMobile={isMobile} />
    </div>
  );
};

export default App;

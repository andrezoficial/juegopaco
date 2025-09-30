import { useState, useEffect, useCallback } from 'react';

export const useGameEngine = () => {
  const [player, setPlayer] = useState({
    x: 50,
    y: 300,
    width: 30,
    height: 30,
    velocityY: 0,
    isJumping: false
  });
  
  const [foods, setFoods] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [gameSpeed, setGameSpeed] = useState(1);

  // Mover jugador
  const movePlayer = useCallback((direction) => {
    setPlayer(prev => {
      let newX = prev.x;
      if (direction === 'left' && prev.x > 0) {
        newX = prev.x - 8;
      } else if (direction === 'right' && prev.x < 770) {
        newX = prev.x + 8;
      }
      return { ...prev, x: newX };
    });
  }, []);

  // Saltar
  const jumpPlayer = useCallback(() => {
    if (!player.isJumping) {
      setPlayer(prev => ({
        ...prev,
        velocityY: -15,
        isJumping: true
      }));
    }
  }, [player.isJumping]);

  // Gravedad
  useEffect(() => {
    const gravityInterval = setInterval(() => {
      setPlayer(prev => {
        if (prev.isJumping) {
          const newY = prev.y + prev.velocityY;
          const newVelocityY = prev.velocityY + 0.8;
          
          // Verificar si llegó al suelo
          if (newY >= 300) {
            return {
              ...prev,
              y: 300,
              velocityY: 0,
              isJumping: false
            };
          }
          
          return {
            ...prev,
            y: newY,
            velocityY: newVelocityY
          };
        }
        return prev;
      });
    }, 30);
    
    return () => clearInterval(gravityInterval);
  }, []);

  // Generar comida
  useEffect(() => {
    const foodInterval = setInterval(() => {
      const foodTypes = ['fish', 'milk', 'croquettes'];
      const type = foodTypes[Math.floor(Math.random() * foodTypes.length)];
      
      const newFood = {
        id: Date.now(),
        type,
        x: Math.random() * 700 + 50,
        y: -20,
        speed: 3 + Math.random() * 2 * gameSpeed
      };
      
      setFoods(prev => [...prev, newFood]);
    }, 2000 / gameSpeed);
    
    return () => clearInterval(foodInterval);
  }, [gameSpeed]);

  // Generar obstáculos
  useEffect(() => {
    const obstacleInterval = setInterval(() => {
      const obstacleTypes = ['dog', 'box'];
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      const newObstacle = {
        id: Date.now(),
        type,
        x: 800,
        y: type === 'dog' ? 280 : 270,
        width: type === 'dog' ? 40 : 50,
        height: type === 'dog' ? 20 : 30,
        speed: 2 + Math.random() * 2 * gameSpeed
      };
      
      setObstacles(prev => [...prev, newObstacle]);
    }, 3000 / gameSpeed);
    
    return () => clearInterval(obstacleInterval);
  }, [gameSpeed]);

  // Mover comida y obstáculos
  useEffect(() => {
    const movementInterval = setInterval(() => {
      // Mover comida
      setFoods(prev => 
        prev
          .map(food => ({
            ...food,
            y: food.y + food.speed
          }))
          .filter(food => food.y < 400) // Eliminar comida que sale de pantalla
      );
      
      // Mover obstáculos
      setObstacles(prev =>
        prev
          .map(obstacle => ({
            ...obstacle,
            x: obstacle.x - obstacle.speed
          }))
          .filter(obstacle => obstacle.x > -50) // Eliminar obstáculos que salen de pantalla
      );
    }, 30);
    
    return () => clearInterval(movementInterval);
  }, []);

  // Aumentar dificultad
  useEffect(() => {
    const difficultyInterval = setInterval(() => {
      setGameSpeed(prev => Math.min(prev + 0.1, 3)); // Máximo 3x velocidad
    }, 10000); // Cada 10 segundos
    
    return () => clearInterval(difficultyInterval);
  }, []);

  return {
    player,
    foods,
    obstacles,
    movePlayer,
    jumpPlayer,
    gameSpeed
  };
};
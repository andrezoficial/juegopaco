import { FONT_FAMILY } from '../constants';
import { roundRect } from './canvasUtils';

const PANEL_BG = 'rgba(30, 20, 60, 0.72)';
const PANEL_BORDER = 'rgba(255, 255, 255, 0.18)';

const POWERUP_HUD = {
  shield: { color: '#4a90e2', label: '🛡️ Escudo' },
  doublePoints: { color: '#ffeb3b', label: '2× Puntos' },
  slowMotion: { color: '#90ee90', label: '🐌 Cámara Lenta' },
};


function drawPanel(ctx, x, y, width, height, scale) {
  roundRect(ctx, x, y, width, height, 14 * scale);
  ctx.fillStyle = PANEL_BG;
  ctx.fill();
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeStyle = PANEL_BORDER;
  ctx.stroke();
}

export function drawHUD(ctx, canvas, scale, hudState) {
  const { score, lives, combo, showCombo, comboPosition, backgroundTheme, activePowerUps, comboBroken, level } = hudState;

  ctx.textBaseline = 'alphabetic';

  // --- Panel izquierdo: puntaje + combo/nivel ---
  const leftW = 220 * scale;
  const leftH = 54 * scale;
  drawPanel(ctx, 12 * scale, 12 * scale, leftW, leftH, scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${19 * scale}px ${FONT_FAMILY}`;
  ctx.fillText(`🐟 ${score}`, 24 * scale, 36 * scale);

  if (combo > 1) {
    ctx.fillStyle = comboBroken ? '#ff6b6b' : '#ffeb3b';
    ctx.font = `700 ${(comboBroken ? 16 : 15) * scale}px ${FONT_FAMILY}`;
    ctx.fillText(comboBroken ? '¡Combo roto! 💔' : `Combo x${combo}!`, 24 * scale, 56 * scale);
  } else if (level > 1) {
    ctx.fillStyle = '#a0e8ff';
    ctx.font = `600 ${14 * scale}px ${FONT_FAMILY}`;
    ctx.fillText(`⭐ Nivel ${level}`, 24 * scale, 56 * scale);
  }

  // --- Panel derecho: vidas + día/noche ---
  const rightW = 190 * scale;
  const rightX = canvas.width - rightW - 12 * scale;
  drawPanel(ctx, rightX, 12 * scale, rightW, leftH, scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${19 * scale}px ${FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`❤️ ${lives}`, canvas.width - 24 * scale, 36 * scale);

  ctx.fillStyle = backgroundTheme === 'day' ? '#ffeb3b' : '#8ec9ff';
  ctx.font = `600 ${14 * scale}px ${FONT_FAMILY}`;
  ctx.fillText(backgroundTheme === 'day' ? '☀️ Día' : '🌙 Noche', canvas.width - 24 * scale, 56 * scale);
  ctx.textAlign = 'left';

  // --- Pills de power-ups activos, debajo del panel derecho ---
  let powerUpY = 12 * scale + leftH + 10 * scale;
  activePowerUps.forEach((powerUp) => {
    const info = POWERUP_HUD[powerUp];
    if (!info) return;

    ctx.font = `600 ${13 * scale}px ${FONT_FAMILY}`;
    const textWidth = ctx.measureText(info.label).width;
    const pillW = textWidth + 24 * scale;
    const pillH = 26 * scale;
    const pillX = canvas.width - pillW - 12 * scale;

    roundRect(ctx, pillX, powerUpY, pillW, pillH, pillH / 2);
    ctx.fillStyle = 'rgba(20, 15, 40, 0.75)';
    ctx.fill();
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = info.color;
    ctx.stroke();

    ctx.fillStyle = info.color;
    ctx.textAlign = 'center';
    ctx.fillText(info.label, pillX + pillW / 2, powerUpY + pillH / 2 + 5 * scale);
    ctx.textAlign = 'left';

    powerUpY += pillH + 6 * scale;
  });

  if (showCombo && !comboBroken) {
    ctx.fillStyle = '#ffeb3b';
    ctx.font = `800 ${28 * scale}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(`COMBO x${combo}!`, comboPosition.x, comboPosition.y);
    ctx.textAlign = 'left';
  }
}

export function drawPauseOverlay(ctx, canvas, scale) {
  ctx.fillStyle = 'rgba(20, 15, 40, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${46 * scale}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('⏸ PAUSA', canvas.width / 2, canvas.height / 2 - 20 * scale);

  ctx.font = `500 ${17 * scale}px ${FONT_FAMILY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Presiona P o Esc para continuar', canvas.width / 2, canvas.height / 2 + 20 * scale);
  ctx.textAlign = 'left';
}

/**
 * Banner central que anuncia la subida de nivel con nombre y número.
 * Se muestra por un par de segundos (controlado desde useGameEngine).
 */
export function drawLevelUpBanner(ctx, canvas, scale, level, levelName) {
  const centerY = canvas.height / 2 - 60 * scale;
  const boxWidth = 320 * scale;
  const boxHeight = 70 * scale;

  ctx.save();
  ctx.textAlign = 'center';

  roundRect(ctx, canvas.width / 2 - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight, 18 * scale);
  ctx.fillStyle = 'rgba(20, 15, 40, 0.72)';
  ctx.fill();
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
  ctx.stroke();

  ctx.fillStyle = '#ffeb3b';
  ctx.font = `800 ${25 * scale}px ${FONT_FAMILY}`;
  ctx.fillText(`⭐ ¡Nivel ${level}!`, canvas.width / 2, centerY - 5 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${15 * scale}px ${FONT_FAMILY}`;
  ctx.fillText(levelName, canvas.width / 2, centerY + 20 * scale);

  ctx.restore();
}

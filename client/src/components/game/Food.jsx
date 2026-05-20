import './Food.css'

/** @typedef {import('./types').Food} Food */

/**
 * @typedef {Object} FoodProps
 * @property {Food} food Food location in grid coordinates
 * @property {number} cellW Grid cell width
 * @property {number} cellH Grid cell heigth
 */

/**
 * @param {FoodProps} FoodProps
 */
export default function Food({ food, cellW, cellH }) {
  let emoji = '🍊';
  let filter = 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))';

  if (food.type === 'normal') {
    emoji = '🍊';
    filter = 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))';
  } else if (food.type === 'bonus') {
    emoji = '🥝';
    filter = 'drop-shadow(0 0 8px rgba(132, 204, 22, 0.8))';
  } else if (food.type === 'extraLife') {
    emoji = '❤️';
    filter = 'drop-shadow(0 0 12px rgba(239, 68, 68, 1)) drop-shadow(0 0 24px rgba(239, 68, 68, 0.8))';
  } else if (food.type === 'speedBoost') {
    emoji = '⚡';
    filter = 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.9))';
  }

  const sizeW = cellW * 0.9;
  const sizeH = cellH * 0.9;
  const centerX = (food.x + 0.5) * cellW;
  const centerY = (food.y + 0.5) * cellH;

  // const animationDelay = -(food.x * food.y * 0.2);

  return (
    <div
      className="animate-food-popin"
      style={{
        position: 'absolute',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        width: `${sizeW}px`,
        height: `${sizeH}px`,
        left: `${centerX - sizeW / 2}px`,
        top: `${centerY - sizeH / 2}px`,
        fontSize: `${Math.min(sizeW, sizeH) * 0.9}px`,
        filter: filter,
      }}
    >
      <div className="animate-food-pulse">{emoji}</div>
    </div>
  );
}

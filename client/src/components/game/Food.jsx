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
  let className = '';

  if (food.type === 'normal') {
    className = 'normal';
  } else if (food.type === 'bonus') {
    className = 'bonus';
  } else if (food.type === 'extraLife') {
    className = 'extra-life';
  } else if (food.type === 'invulnerability') {
    className = 'invulnerability';
  }

  const centerX = (food.x + 0.5) * cellW;
  const centerY = (food.y + 0.5) * cellH;

  return (
    <div
      className="food animate-food-popin"
      style={{
        width: `${cellW}px`,
        height: `${cellH}px`,
        left: `${centerX - cellW / 2}px`,
        top: `${centerY - cellH / 2}px`,
        fontSize: `${Math.min(cellW, cellH) * 0.9}px`,
      }}
    >
      <div className={className + " animate-food-pulse"}></div>
    </div>
  );
}

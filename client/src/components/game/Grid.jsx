/**
 * @typedef {Object} GridProps
 * @property {number} cellW Grid cell width
 * @property {number} cellH Grid cell height
 */

/**
 * @param {GridProps} GridProps
 */
export default function Grid({ cellW, cellH }) {
  const borderWidth = 1;
  return (
    <div
      style={{
        position: 'absolute',
        borderRight: `${borderWidth}px solid #2a2a2a`,
        borderBottom: `${borderWidth}px solid #2a2a2a`,
        inset: 0,
        zIndex: 0,
        backgroundImage: `
          repeating-linear-gradient(to right, #2a2a2a 0, #2a2a2a ${borderWidth}px, transparent ${borderWidth}px, transparent ${cellW}px),
          repeating-linear-gradient(to bottom, #2a2a2a 0, #2a2a2a ${borderWidth}px, transparent ${borderWidth}px, transparent ${cellH}px)
        `,
        pointerEvents: 'none',
      }}
    />
  );
}

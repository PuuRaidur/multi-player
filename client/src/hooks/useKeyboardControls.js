import { useEffect } from 'react';
import socket from '../socket';

export function useKeyboardControls() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent the default OS keyboard repeat
      if (e.repeat) return;

      let direction = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
        default:
          return;
      }

      if (direction) {
        // Prevent default window scrolling when using arrow keys
        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
        }

        socket.emit('input', { direction });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
}

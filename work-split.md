# Work Division

## Magdaleena: Backend + Multiplayer + Game Logic

### Responsibilities
1. **Backend Server**
   - Node.js server setup
   - HTTP health/state endpoints
   - WebSocket endpoint for real-time gameplay

2. **Multiplayer Session Logic**
   - Player joining
   - Unique player names
   - Lead player start flow
   - Support for 2-4 players

3. **Server-Side Game Logic**
   - Snake movement rules
   - Food and bonus food scoring
   - Lives, respawn, and elimination
   - Collision detection
   - 3-minute game timer
   - Winner selection

4. **Backend Events and Tests**
   - Pause, resume, and quit broadcast messages
   - Sound cue events for frontend playback
   - Backend game logic tests

### Main Files
- `server/server.js`
- `server/config.js`
- `server/game/engine.js`
- `server/net/websocket.js`
- `test/engine.test.js`

## Developer 1: Core Game Systems

### Responsibilities
1. **Game Board Rendering**
   - DOM-based rendering of the game grid
   - Snake movement visualization
   - Food item placement and animation

2. **Player Input Handling**
   - Keyboard controls implementation
   - Key event listeners and processing
   - Direction change validation

3. **Game State Display**
   - Real-time score tracking for all players
   - Countdown timer visualization
   - Lives indicator for each player

4. **Winner Announcement**
   - End-game display showing winner
   - Final score summary screen

## Developer 2: User Interface & Features

### Responsibilities
1. **Join/Lobby Screen**
   - Player name selection form
   - Unique name validation
   - Waiting room with player list
   - Start game button (for lead player)

2. **Menu System**
   - Pause/Resume/Quit functionality
   - In-game menu overlay
   - System message broadcasting

3. **Sound Effects Integration**
   - Audio context setup
   - Sound triggers based on WebSocket events
   - Volume controls (optional)

4. **Chat Feature (Bonus)**
   - Message input field
   - Chat display area
   - Message sending/receiving

## Coordination Points

Both developers will collaborate on:
- WebSocket connection handling
- Shared state management
- RequestAnimationFrame integration
- Performance optimization

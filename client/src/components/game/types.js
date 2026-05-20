/**
 * @typedef {"up"|"right"|"down"|"left"} Direction
 */

/**
 * @typedef {Object} Grid
 * @property {string} width
 * @property {string} height
 */

/**
 * @typedef {Object} Snapshot
 * @property {"state"} type
 * @property {Phase} phase
 * @property {"tailHunt"?} gameMode
 * @property {Grid} grid
 * @property {number} minPlayers
 * @property {number} maxPlayers
 * @property {number} leadPlayerId
 * @property {number} timeRemainingMs
 * @property {Player[]} players
 * @property {Food[]} foods
 * @property {string[]} messages
 * @property {Winner?} winner
 */

/**
 * @typedef {"lobby"|"playing"|"paused"|"ended"} Phase
 */

/**
 * @typedef {Object} Winner
 * @property {string} id
 * @property {string} name
 * @property {number} score
 */

/**
 * @typedef {Object} Food
 * @property {"normal"|"bonus"|"extraLife"|"speedBoost"} type Food type
 * @property {number} x X grid coordinate
 * @property {number} y Y grid coordinate
 */

/**
 * @typedef {Object} SnakeSegment
 * @property {number} x X grid coordinate
 * @property {number} y Y grid coordinate
 */

/**
 * @typedef {SnakeSegment[]} Snake
 */

/**
 * @typedef {Object} Player
 * @property {string} id Player id
 * @property {string} name Player name
 * @property {string} color Snake color
 * @property {number} number Player number
 * @property {boolean} ready Is player ready
 * @property {boolean} connected Is player connected
 * @property {boolean} lead Is player the leading player
 * @property {number} score Player score
 * @property {number} lives Amount of lives left
 * @property {boolean} out Is player dead
 * @property {Direction} direction Direction that the snake is facing
 * @property {boolean} invulnerable Is snake invulnerable
 * @property {boolean} speedBoostActive Is speed boost active
 * @property {number} speedBoostRemainingMs Remaining time in ms
 * @property {Snake} snake Snake
 */

export { }
import Snake from '../Snake'

export default function SnakeTest() {
  const snakes = [
    // { segments: [{x: 0, y: 2}, {x: 1, y: 2}] },
    { color: "#32aacc", segments: [{x: 7, y: 3}, {x: 8, y: 3}, {x: 9, y: 3}, {x: 10, y: 3}, {x: 10, y: 2}, {x: 10, y: 1}, {x: 9, y: 1}] },
    { color: "#dc8744", segments: [{x: 2, y: 4},{x: 2, y: 5}, {x: 1, y: 5}, {x: 1, y: 4}, {x: 1, y: 3}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 3, y: 3}] },
  ]
  return (
    snakes.map((snake, i) => <Snake key={i} {...snake} />)
  )
}
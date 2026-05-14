import Food from '../components/Food'

export default function FoodTest() {
  const foods = [
    { id: "1", x: 1, y: 4, type: "normal" },
    { id: "2", x: 2, y: 3, type: "bonus" },
    { id: "3", x: 4, y: 2, type: "speed" },
    { id: "4", x: 2, y: 2, type: "life" },
  ]
  return (
    foods.map(food => <Food key={food.id} food={food} />)
  )
}
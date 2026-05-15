import InputForm from "components/InputForm.jsx"
import Button from "components/Button.jsx"
import "PreGame.css"

// TODO input form's and button's hooks and game mode choosing
export default function Lobby(isLeadPlayer) {
    if(isLeadPlayer) {
        return (
            <div className="center">
                <b>Snake Game</b>
                <InputForm placeholder="nickname"></InputForm>
                <Button>Create Room</Button>
            </div>
        )
    }
    else {
        return (
            <div className="center">
                <b>Snake Game</b>
                <InputForm placeholder="nickname"></InputForm>
                <InputForm placeholder="room code"></InputForm>
                <Button>Join Game</Button>
            </div>
        )
    }
}
import './InputForm.css';

export default function InputForm({ onSubmit }) {
  return (
    <form className="input-form" onSubmit={onSubmit}>
      <input className="input-field" type="text" placeholder="Nickname" name="nickname" required />
      <input className="input-field" type="text" placeholder="Room Code" name="room" required />
      <input className="input-field" type="text" placeholder="Message" name="message" />
    </form>
  )
}
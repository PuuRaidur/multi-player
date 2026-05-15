import './InputForm.css';

export default function InputForm({ onSubmit, placeholder }) {
  return (
    <form className="input-form" onSubmit={onSubmit}>
      <input className="input-field" type="text" placeholder={placeholder}/>
    </form>
  )
}
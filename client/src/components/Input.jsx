import { forwardRef } from 'react'
import './Input.css'

export default function InputForm({ onSubmit, className = '', children, ...rest }) {
  return (
    <form onSubmit={onSubmit} className={`input-form ${className}`.trim()} {...rest}>
      {children}
    </form>
  )
}

export const InputField = forwardRef(function InputField({ className = '', ...rest }, ref) {
  return (
    <input ref={ref} className={`input-field ${className}`.trim()} {...rest} />
  )
})

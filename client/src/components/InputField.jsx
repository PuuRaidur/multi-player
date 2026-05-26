import { forwardRef } from 'react'
import './InputField.css'

const InputField = forwardRef(function InputField({ className = '', ...rest }, ref) {
  return (
    <input ref={ref} className={`input-field ${className}`.trim()} {...rest} />
  )
})

export default InputField

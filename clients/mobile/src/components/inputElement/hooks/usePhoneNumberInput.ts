import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type PhoneInput from 'react-native-phone-number-input'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

const usePhoneNumberInput = (
  value: string,
  name: string,
  onChange: (name: string, formatted: string) => void
): {
  phoneInputRef:  React.MutableRefObject<PhoneInput>;
  isValid: boolean;
  handleChangeFormattedText: (formatted: string) => void;
  parsedValue: string;
  defaultCode: string;
} => {
  const phoneInputRef = useRef<PhoneInput>(null)
  const [isValid, setIsValid] = useState(true)
  const [parsedValue, setParsedValue] = useState('')
  const [defaultCode, setDefaultCode] = useState('BD')

  useEffect(() => {
   if (value) {
      try {
        const phoneNumber = parsePhoneNumberFromString(value)

        if (phoneNumber) {
          setDefaultCode(phoneNumber.country || 'BD')
          setParsedValue(phoneNumber.nationalNumber || '')
          const valid = phoneNumber.isValid()
          setIsValid(valid)
        }
      } catch (err) {
        setParsedValue(value)
        setIsValid(false)
      }
    }
  }, [value])

  const handleChangeFormattedText = (formatted: string): void => {
    const valid = phoneInputRef.current?.isValidNumber(formatted) || false
    setIsValid(valid)
    if (valid && onChange) {
      onChange(name, formatted)
    }
  }

  return {
    phoneInputRef,
    isValid,
    handleChangeFormattedText,
    parsedValue,
    defaultCode
  }
}

export default usePhoneNumberInput
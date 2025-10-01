import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type PhoneInput from 'react-native-phone-number-input'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import useFetchCountry from '../../../api/hooks/useFetchCountry'
import { DEFAULT_COUNTRY_CODE } from '../../../setup/constant/consts'

const usePhoneNumberInput = (
  value: string,
  name: string,
  onChange: (name: string, formatted: string) => void
): {
  phoneInputRef: React.MutableRefObject<PhoneInput>;
  isValid: boolean;
  handleChangeFormattedText: (formatted: string) => void;
  parsedValue: string;
  defaultCode: string;
  countryLoading: boolean;
} => {
  const phoneInputRef = useRef<PhoneInput>(null)
  const [isValid, setIsValid] = useState(true)
  const [parsedValue, setParsedValue] = useState('')
  const [defaultCode, setDefaultCode] = useState(DEFAULT_COUNTRY_CODE)
  const { countryInfo, loading } = useFetchCountry()

  useEffect(() => {
    if (!loading && countryInfo?.countryCode) {
      setDefaultCode(countryInfo.countryCode)
    }
  }, [countryInfo, loading])

  useEffect(() => {
    if (value) {
      try {
        const phoneNumber = parsePhoneNumberFromString(value)

        if (phoneNumber) {
          setDefaultCode(phoneNumber.country || countryInfo.countryCode || DEFAULT_COUNTRY_CODE)
          setParsedValue(phoneNumber.nationalNumber || '')
          const valid = phoneNumber.isValid()
          setIsValid(valid)
        }
      } catch (_err) {
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
    defaultCode,
    countryLoading: loading
  }
}

export default usePhoneNumberInput

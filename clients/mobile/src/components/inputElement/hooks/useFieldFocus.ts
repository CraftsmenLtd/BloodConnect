import { useState } from 'react'

type FieldFocus = {
  isFocused: boolean;
  handleFocus: () => void;
  handleBlur: () => void;
}

/**
 * Tracks focus state for an input field so the border/caret can react to it.
 * Wire `handleFocus`/`handleBlur` to the field's onFocus/onBlur and drive the
 * focus style from `isFocused`.
 */
const useFieldFocus = (): FieldFocus => {
  const [isFocused, setIsFocused] = useState(false)

  return {
    isFocused,
    handleFocus: () => { setIsFocused(true) },
    handleBlur: () => { setIsFocused(false) }
  }
}

export default useFieldFocus

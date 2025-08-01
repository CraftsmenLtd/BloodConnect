import React from 'react'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Dropdown from '../inputElement/Dropdown'

export type LanguageOption = {
  label: string;
  value: string;
}

type Position =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'center'

type Size = 'sm' | 'md' | 'lg' | 'auto'

type LanguageSwitcherProps = {
  label?: string;
  placeholder?: string;
  languages: LanguageOption[];
  position?: Position;
  size?: Size;
}

const sizeToWidth = (size: Size): number | 'auto' => {
  switch (size) {
    case 'sm':
      return 120
    case 'md':
      return 150
    case 'lg':
      return 220
    case 'auto':
    default:
      return 'auto'
  }
}

/**
 * LanguageSwitcher Component
 * ---------------------------
 * A reusable language selector component using a dropdown.
 * Built for use with `react-i18next` to change the application's active language.
 * Allows specifying dropdown size, position, and custom labels.
 *
 * Props:
 * -------
 * @param label - Optional label displayed above the dropdown.
 * @param placeholder - Optional placeholder text shown when no language is selected.
 * @param languages - Array of language options where each option includes:
 *                    - `label`: Display name (e.g., "English")
 *                    - `value`: Language code (e.g., "en")
 * @param position - Optional fixed position of the dropdown on screen. Possible values:
 *                   - 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
 *                   If not provided, no absolute positioning is applied.
 * @param size - Optional dropdown size preset that determines width. Possible values:
 *               - 'sm' = 120px, 'md' = 150px (default), 'lg' = 220px, 'auto' = auto width
 *
 * Example Usage:
 * ---------------
 * ```tsx
 * import { LanguageSwitcher } from './components/LanguageSwitcher'
 *
 * const languages = [
 *   { label: 'English', value: 'en' },
 *   { label: 'Bangla', value: 'bn' }
 * ]
 *
 * <LanguageSwitcher
 *   label="Select Language"
 *   placeholder="Choose..."
 *   languages={languages}
 *   size="sm"
 *   position="top-right"
 * />
 * ```
 *
 * Dependencies:
 * - react-i18next
 */
export const LanguageSwitcher = ({
  label,
  placeholder,
  languages,
  position,
  size = 'md'
}: LanguageSwitcherProps): React.ReactElement => {
  const { i18n } = useTranslation()

  const changeLanguage = (_: string | undefined, langCode: string): void => {
    i18n.changeLanguage(langCode)
  }

  const getPositionStyle = (): ViewStyle => {
    if (!position) return undefined

    const base: ViewStyle = { position: 'absolute' }
    switch (position) {
      case 'top-right':
        return { ...base, top: 20, right: 20 }
      case 'top-left':
        return { ...base, top: 20, left: 20 }
      case 'bottom-right':
        return { ...base, bottom: 20, right: 20 }
      case 'bottom-left':
        return { ...base, bottom: 20, left: 20 }
      case 'center':
        return { ...base, top: 20, alignSelf: 'center' }
      default:
        return base
    }
  }

  return (
    <View style={[getPositionStyle(), { width: sizeToWidth(size) }]}>
      <Dropdown
        label={label}
        name="language"
        placeholder={placeholder}
        options={languages}
        selectedValue={i18n.language}
        onChange={changeLanguage}
        isRequired={false}
        readonly={false}
        allowSearch={false}
      />
    </View>
  )
}

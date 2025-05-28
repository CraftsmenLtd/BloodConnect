import React from 'react'
import type { ViewStyle } from 'react-native';
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'

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

type LanguageSwitcherProps = {
  languages: LanguageOption[];
  position?: Position;
}

/**
 * LanguageSwitcher Component
 * --------------------------
 * A reusable language switcher component for React Native applications,
 * allowing users to change the app's language dynamically using `react-i18next`.
 * Accepts a customizable list of language options and optional positioning
 * for absolute layout on the screen.
 *
 * Props:
 * -------
 * @param languages - An array of language options. Each item should include:
 *                    - `label`: Display text (e.g., "English", "বাংলা")
 *                    - `value`: Language code used by i18n (e.g., "en", "bn")
 * @param position - Optional position for placing the switcher. Available values:
 *                   - `'top-right'` (default)
 *                   - `'top-left'`
 *                   - `'bottom-right'`
 *                   - `'bottom-left'`
 *                   - `'center'`
 *
 * Example Usage:
 * ---------------
 * ```tsx
 * import React from 'react'
 * import { View } from 'react-native'
 * import { LanguageSwitcher } from './LanguageSwitcher'
 *
 * const WelcomeScreen = () => {
 *   return (
 *     <View>
 *       <LanguageSwitcher
 *         languages={[
 *           { label: 'বাংলা', value: 'bn' },
 *           { label: 'English', value: 'en' }
 *         ]}
 *         position="top-right"
 *       />
 *     </View>
 *   )
 * }
 * ```
 *
 * Dependencies:
 * - react-i18next
 */
export const LanguageSwitcher = ({
  languages,
  position = 'top-right'
}: LanguageSwitcherProps): React.ReactElement => {
  const { i18n } = useTranslation()
  const theme = useTheme()
  const styles = createStyles(theme)

  const changeLanguage = (langCode: string): void => {
    i18n.changeLanguage(langCode)
  }

  const getPositionStyle = (): ViewStyle => {
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
    <View style={[styles.container, getPositionStyle()]}>
      {languages.map((lang, index) => (
        <React.Fragment key={lang.value}>
          <Pressable onPress={() => changeLanguage(lang.value)}>
            <Text style={[
              styles.langText,
              i18n.language === lang.value && styles.active
            ]}>
              {lang.label}
            </Text>
          </Pressable>
          {index < languages.length - 1 && (
            <Text style={styles.separator}>|</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      zIndex: 999,
    },
    langText: {
      fontSize: 14,
      color: theme.colors.textPrimary,
      paddingHorizontal: 5,
    },
    active: {
      fontWeight: 'bold',
      textDecorationLine: 'underline',
    },
    separator: {
      color: theme.colors.textPrimary,
      paddingHorizontal: 3,
    }
  })

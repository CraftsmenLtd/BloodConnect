import React from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { View, StyleSheet } from 'react-native'
import { LanguageSwitcher } from '../../components/languageSwitcher'
import { languageOptions } from '../../setup/constant/language'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'

const SettingsPage: React.FC = (): React.ReactElement => {
  const styles = createStyles(useTheme())
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <LanguageSwitcher
        label={t('fromLabel.chooseLanguage')}
        placeholder={t('placeholders.selectAppLanguage')}
        languages={languageOptions}
        size="auto"
      />
    </View>
  )
}

const createStyles = (theme: Theme): { container: StyleProp<ViewStyle> } =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.white,
    },
  })

export default SettingsPage

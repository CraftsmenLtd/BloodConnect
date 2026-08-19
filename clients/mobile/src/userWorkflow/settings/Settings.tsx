import React from 'react'
import {
  useTranslation } from 'react-i18next'
import { View,
  TouchableOpacity,
  StyleSheet
} from 'react-native'
import { Text } from '../../components/text/AppText'
import { MaterialIcons } from '@expo/vector-icons'
import { LanguageSwitcher } from '../../components/languageSwitcher'
import { languageOptions } from '../../setup/constant/language'
import { THEME_MODE } from '../../setup/constant/theme'
import type { Theme, ThemeMode } from '../../setup/theme'
import { useTheme, useThemeMode } from '../../setup/theme/hooks/useTheme'
import { openSafetyReport } from '../../utility/safetyReport'
import { spacing, radius } from '../../setup/theme/tokens'

const SettingsPage: React.FC = (): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { t } = useTranslation()
  const { mode, setMode } = useThemeMode()

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: THEME_MODE.SYSTEM, label: t('settings.themeSystem') },
    { value: THEME_MODE.LIGHT, label: t('settings.themeLight') },
    { value: THEME_MODE.DARK, label: t('settings.themeDark') }
  ]

  return (
    <View style={styles.container}>
      <LanguageSwitcher
        label={t('fromLabel.chooseLanguage')}
        placeholder={t('placeholders.selectAppLanguage')}
        languages={languageOptions}
        size="auto"
      />

      <View style={styles.themeSection}>
        <Text variant="body" style={styles.themeLabel}>{t('settings.appearance')}</Text>
        <View style={styles.segment}>
          {themeOptions.map((option) => {
            const isActive = mode === option.value

            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.segmentItem, isActive && styles.segmentItemActive]}
                onPress={() => { setMode(option.value) }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text variant="label" style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <TouchableOpacity
        style={styles.reportRow}
        onPress={() => { void openSafetyReport() }}
        accessibilityLabel={t('settings.reportSafety')}
        accessibilityHint="Opens mail app to report a safety concern"
      >
        <MaterialIcons name="flag" size={24} style={styles.reportIcon} />
        <Text variant="body" style={styles.reportText}>{t('settings.reportSafety')}</Text>
        <MaterialIcons name="open-in-new" size={20} style={styles.reportChevron} />
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
      backgroundColor: theme.colors.background,
    },
    themeSection: {
      marginTop: spacing.xxl,
    },
    themeLabel: {
      fontWeight: '500',
      color: theme.colors.textPrimary,
      marginBottom: spacing.sm,
    },
    segment: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    segmentItemActive: {
      backgroundColor: theme.colors.primary,
    },
    segmentText: {
      color: theme.colors.textSecondary,
    },
    segmentTextActive: {
      color: theme.colors.onPrimary,
    },
    reportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xxl,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    reportIcon: {
      color: theme.colors.primary,
      marginRight: spacing.md,
    },
    reportText: {
      flex: 1,
      color: theme.colors.textPrimary,
    },
    reportChevron: {
      color: theme.colors.textTertiary,
    },
  })

export default SettingsPage

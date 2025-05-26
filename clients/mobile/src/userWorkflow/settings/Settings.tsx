import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { View, StyleSheet } from 'react-native'
import Dropdown from '../../components/inputElement/Dropdown'
import { languageOptions } from '../../setup/constant/language'
import LOCAL_STORAGE_KEYS from '../../setup/constant/localStorageKeys'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import storageService from '../../utility/storageService'

const SettingsPage: React.FC = (): JSX.Element => {
  const styles = createStyles(useTheme())
  const { t, i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)

  const DEFAULT_LANGUAGE = 'en'

  useEffect(() => {
    const loadLanguage = async(): Promise<void> => {
      const savedLang = await storageService.getItem<string>(LOCAL_STORAGE_KEYS.APP_LANGUAGE)
      const validLang = languageOptions.find(opt =>
        opt.value === savedLang
      )?.value ?? DEFAULT_LANGUAGE
      setSelectedLanguage(validLang)
      if (i18n.language !== validLang) {
        await i18n.changeLanguage(validLang)
      }
    }

    loadLanguage()
  }, [])


  const handleLanguageChange = async(name: string, value: string): Promise<void> => {
    if (!languageOptions.find(opt => opt.value === value)) return
    setSelectedLanguage(value)
    await storageService.storeItem(LOCAL_STORAGE_KEYS.APP_LANGUAGE, value)
    await i18n.changeLanguage(value)
  }

  return (
    <View style={styles.container}>
      <Dropdown
        label={t('fromLabel.chooseLanguage')}
        options={languageOptions}
        name="language"
        placeholder={t('placeholders.selectAppLanguage')}
        onChange={handleLanguageChange}
        isRequired={false}
        selectedValue={selectedLanguage}
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

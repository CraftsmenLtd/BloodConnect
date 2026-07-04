import React from 'react'
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native'
import { Text } from '../components/text/AppText'
import { LanguageSwitcher } from '../components/languageSwitcher'
import { languageOptions } from '../setup/constant/language'
import type { WelcomeScreenNavigationProp } from '../setup/navigation/navigationTypes'
import { SCREENS } from '../setup/constant/screens'
import { Button } from '../components/button/Button'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import { useTranslation } from 'react-i18next'
import { spacing } from '../setup/theme/tokens'

export type WelcomeScreenProps = {
  navigation: WelcomeScreenNavigationProp;
}

const Welcome = ({ navigation }: WelcomeScreenProps): React.ReactElement => {
  const { t } = useTranslation()
  const styles = createStyles(useTheme())

  return (
    <View style={styles.container}>
      <LanguageSwitcher
        languages={languageOptions}
        position="bottom-right"
        size="sm"
      />

      <Image source={require('../../assets/images/bloodBag.png')} style={styles.image} />

      <Text variant="h2" style={styles.title}>{t('home.title')}</Text>
      <Text variant="bodySmall" style={styles.subtitle}>{t('home.subtitle')}</Text>

      <Button
        text={t('common.createAccount')}
        onPress={() => { navigation.navigate(SCREENS.REGISTER) }}
      />
      <Button
        text={t('common.logIn')}
        onPress={() => { navigation.navigate(SCREENS.LOGIN) }}
        buttonStyle={styles.loginButton} textStyle={styles.loginText} />
    </View>
  )
}

const createStyles = (theme: Theme) => {
  const { width } = useWindowDimensions()

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      backgroundColor: theme.colors.surface
    },
    image: {
      width: width * 0.4,
      height: undefined,
      aspectRatio: 1,
      alignSelf: 'center',
      marginBottom: spacing.xxxl
    },
    title: {
      textAlign: 'center',
      marginBottom: spacing.md
    },
    subtitle: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xxxxl
    },
    loginButton: {
      borderColor: theme.colors.borderStrong,
      borderWidth: 1,
      backgroundColor: theme.colors.surface
    },
    loginText: {
      color: theme.colors.textPrimary
    }
  })
}

export default Welcome

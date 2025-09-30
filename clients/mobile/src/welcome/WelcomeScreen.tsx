import React from 'react'
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native'
import { LanguageSwitcher } from '../components/languageSwitcher'
import { languageOptions } from '../setup/constant/language'
import type { WelcomeScreenNavigationProp } from '../setup/navigation/navigationTypes'
import { SCREENS } from '../setup/constant/screens'
import { Button } from '../components/button/Button'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import { useTranslation } from 'react-i18next'

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

      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Image source={require('../../assets/images/bloodBag.png')} style={styles.image} />

      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

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
      paddingHorizontal: 20,
      backgroundColor: theme.colors.white
    },
    image: {
      width: width * 0.4,
      height: undefined,
      aspectRatio: 1,
      alignSelf: 'center',
      marginBottom: 30
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 10
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.darkGrey,
      textAlign: 'center',
      marginBottom: 40
    },
    loginButton: {
      borderColor: theme.colors.lightGrey,
      borderWidth: 1,
      backgroundColor: theme.colors.white
    },
    loginText: {
      color: theme.colors.textPrimary
    }
  })
}

export default Welcome

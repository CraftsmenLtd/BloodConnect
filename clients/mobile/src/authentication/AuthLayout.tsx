import type { ReactNode } from 'react'
import React from 'react'
import { LanguageSwitcher } from '../components/languageSwitcher'
import { languageOptions } from '../setup/constant/language'
import type { Theme } from '../setup/theme'
import { useTheme } from '../setup/theme/hooks/useTheme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { spacing } from '../setup/theme/tokens'

type AuthLayoutProps = {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const styles = createStyles(useTheme())

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scrollViewContainer]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={25}
      >
        {children}
        <LanguageSwitcher
          languages={languageOptions}
          position="bottom-right"
          size="sm"
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.surface,
    paddingTop: '10%',
    paddingHorizontal: spacing.xl
  }
})

export default AuthLayout

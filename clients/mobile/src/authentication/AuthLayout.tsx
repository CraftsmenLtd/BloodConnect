import type { ReactNode } from 'react'
import React from 'react'
import { LanguageSwitcher } from '../components/languageSwitcher'
import { languageOptions } from '../setup/constant/language'
import type { Theme } from '../setup/theme'
import { useTheme } from '../setup/theme/hooks/useTheme'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, StyleSheet } from 'react-native'

type AuthLayoutProps = {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const styles = createStyles(useTheme())

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scrollViewContainer]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
        <LanguageSwitcher
          languages={languageOptions}
          position="bottom-right"
          size="sm"
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.white,
    paddingTop: '10%',
    paddingHorizontal: 20
  }
})

export default AuthLayout

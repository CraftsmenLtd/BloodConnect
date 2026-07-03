import React, { useEffect, useState } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Text } from '../../components/text/AppText'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { spacing, radius } from '../../setup/theme/tokens'

const currentYear = new Date().getFullYear()

const AboutPage: React.FC = () => {
  const styles = createStyles(useTheme())
  const [displayedText, setDisplayedText] = useState<string>('')

  const fullText = 'Tries to improve the blood donation process through connecting donors, blood banks'
    + ' and existing organizations who are assisting finding donors in times of need, by providing a platform.'
  const typingSpeed = 5

  useEffect(() => {
    let index = 0
    const intervalId = setInterval(() => {
      index += 1
      setDisplayedText(fullText.slice(0, index))
      if (index >= fullText.length) {
        clearInterval(intervalId)
      }
    }, typingSpeed)

    return () => { clearInterval(intervalId) }
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.logoTitleContainer}>
        <Image source={require('../../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>BloodConnect</Text>
      </View>

      <View style={styles.fixedDescriptionContainer}>
        <Text style={styles.description}>{displayedText}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2023-{currentYear}</Text>
        <Image source={require('../../../assets/craftsmen-logo.png')} style={styles.companyLogo} />
        <Text style={styles.footerText}>Craftsmen Ltd.</Text>
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: theme.colors.surface
  },
  logoTitleContainer: {
    position: 'absolute',
    top: 80,
    alignItems: 'center',
    zIndex: 1
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.primary,
    borderRadius: radius.xl
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: spacing.md
  },
  fixedDescriptionContainer: {
    position: 'absolute',
    top: 320,
    left: 20,
    right: 20,
    zIndex: 0
  },
  description: {
    fontSize: 20,
    textAlign: 'justify',
    color: theme.colors.textSecondary
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginHorizontal: spacing.xs
  },
  companyLogo: {
    width: 20,
    height: 20
  }
})

export default AboutPage

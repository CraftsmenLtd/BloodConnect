import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '../setup/theme/hooks/useTheme'
import { Theme } from '../setup/theme'

interface NoInternetScreenProps {
  onRetry: () => void;
  isConnected: boolean | null;
}

const NoInternetScreen = ({ onRetry, isConnected }: NoInternetScreenProps) => {
  const styles = createStyles(useTheme())
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isConnected === false ? 'Oops! No Internet' : 'Back Online!'}
      </Text>
      <Text style={styles.message}>
        {isConnected === false
          ? 'You need an internet connection to use this app. Please check your connection and try again.'
          : 'Your internet connection is restored. You can now continue using the app.'}
      </Text>
      <TouchableOpacity onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>
          {isConnected === false ? 'Retry' : 'Go Back'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.greyBG
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16
  },
  message: {
    fontSize: theme.typography.fontSize,
    textAlign: 'center',
    marginBottom: 32,
    color: theme.colors.textSecondary
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  }
})

export default NoInternetScreen

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../../components/text/AppText'
import { useDonationResponse } from './useDonationResponse'
import PostCard from '../../components/donation/PostCard'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { Button } from '../../components/button/Button'
import { spacing } from '../../setup/theme/tokens'

const DonorResponse = () => {
  const styles = createStyles(useTheme())
  const { bloodRequest, seeDetails, ignoreHandler } = useDonationResponse()
  if (bloodRequest === null || bloodRequest === undefined) return null

  return (
    <View style={styles.container}>
      <View>
        <Text variant="h3" style={styles.responseText}>{bloodRequest.donorName} responded to your request</Text>
        <PostCard post={bloodRequest} showButton={false} showDescription showHeader={false} />
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button
            text="Ignore"
            buttonStyle={styles.ignoreButton}
            textStyle={styles.buttonTextStyle}
            onPress={ignoreHandler} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button text="See Responses" onPress={seeDetails} />
        </View>
      </View>
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface
  },
  ignoreButton: {
    backgroundColor: theme.colors.surfaceVariant,
    flex: 1,
    marginRight: spacing.md,
    color: theme.colors.textPrimary
  },
  buttonTextStyle: {
    color: theme.colors.textPrimary
  },
  responseText: {
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: theme.colors.borderStrong
  },
  buttonWrapper: {
    flex: 1
  }
})

export default DonorResponse

import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useDonationResponse } from './useDonationResponse'
import PostCard from '../../components/donation/PostCard'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { Button } from '../../components/button/Button'

const DonorResponse = () => {
  const styles = createStyles(useTheme())
  const { bloodRequest, seeDetails, ignoreHandler } = useDonationResponse()
  if (bloodRequest === null || bloodRequest === undefined) return null

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.responseText}>{bloodRequest.donorName} responded to your request</Text>
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
    paddingTop: 20,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white
  },
  ignoreButton: {
    backgroundColor: theme.colors.greyBG,
    flex: 1,
    marginRight: 10,
    color: theme.colors.black
  },
  buttonTextStyle: {
    color: theme.colors.black
  },
  responseText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: theme.colors.lightGrey
  },
  buttonWrapper: {
    flex: 1
  }
})

export default DonorResponse

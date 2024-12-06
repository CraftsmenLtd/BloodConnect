import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useDonationResponse } from './useDonationResponse'
import PostCard from '../donationPosts/PostCard'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { Button } from '../../components/button/Button'

const DonorResponse = () => {
  const styles = createStyles(useTheme())
  const { bloodRequest } = useDonationResponse()
  if (bloodRequest === null || bloodRequest === undefined) return null

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.responseText}>{bloodRequest.donorName} responded to your request</Text>
        <PostCard post={bloodRequest} showButton={false} showDescription showHeader={false} updateHandler={() => { }} />
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button text="Ignore" onPress={() => { }} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button text="See Responses" onPress={() => { }} />
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
    paddingHorizontal: 12
  },
  buttonWrapper: {
    flex: 1
  }
})

export default DonorResponse

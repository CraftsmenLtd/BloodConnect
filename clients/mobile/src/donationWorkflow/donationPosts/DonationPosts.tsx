import { View, StyleSheet } from 'react-native'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { useDonationPosts } from './useDonationPosts'
import Header from './DonationHeader'
import Posts from '../../components/donation/Posts'
import { DonationPostsScreenNavigationProp } from '../../setup/navigation/navigationTypes'
import { BloodDonationRecord } from '../types'
import { COMMON_URLS } from '../../setup/constant/commonUrls'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

interface DonationPostsProps {
  navigation: DonationPostsScreenNavigationProp;
}
const DonationPosts = ({ navigation }: DonationPostsProps) => {
  const styles = createStyles(useTheme())
  const { errorMessage, createPost, updatePost, donationPosts, loading, viewDetailsHandler } = useDonationPosts()

  return (
    <View style={styles.container}>
      <Header
        profileImageUri={COMMON_URLS.PROFILE_AVATAR}
        title="Blood needed?"
        buttonLabel="Create Post"
        onButtonPress={createPost}
      />
      <Posts errorMessage={errorMessage} loading={loading} donationPosts={donationPosts} updatePost={updatePost} detailHandler={viewDetailsHandler} />
    </View>
  )
}

const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      marginBottom: 48
    }
  })
}

export default DonationPosts

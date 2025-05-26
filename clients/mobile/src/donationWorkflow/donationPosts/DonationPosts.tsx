import { View, StyleSheet, RefreshControl } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { useDonationPosts } from './useDonationPosts'
import Header from './DonationHeader'
import Posts from '../../components/donation/Posts'
import type { BloodDonationRecord } from '../types'
import { COMMON_URLS } from '../../setup/constant/commonUrls'

export type DonationData = Omit<BloodDonationRecord, 'reqPostId' | 'latitude' | 'longitude'> & {
  requestPostId: string;
}

const DonationPosts = () => {
  const theme = useTheme()
  const styles = createStyles()
  const {
    errorMessage,
    createPost,
    donationPosts,
    loading,
    viewDetailsHandler,
    refreshing,
    handleRefresh,
    bloodGroup,
    isFilteredByBloodGroup,
    filterWithBloodGroup
  } = useDonationPosts()

  return (
    <View style={styles.container}>
      <Header
        profileImageUri={COMMON_URLS.PROFILE_AVATAR}
        title="Blood needed?"
        buttonLabel="Create Request"
        onButtonPress={createPost}
        handleRefresh={handleRefresh}
        onFilterButtonPress={filterWithBloodGroup}
        bloodGroup={bloodGroup}
        isFilteredByBloodGroup={isFilteredByBloodGroup}
      />
      <Posts
        errorMessage={errorMessage}
        loading={loading}
        emptyDataMessage='No donation requests available. Pull to refresh.'
        donationPosts={donationPosts}
        detailHandler={viewDetailsHandler}
        displayOptions={{ showOptions: false, showPostUpdatedOption: false }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  )
}

const createStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1
    }
  })
}

export default DonationPosts

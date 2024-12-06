import { FlatList, Text, TouchableOpacity, View, StyleSheet, Image } from 'react-native'
import { PostCard } from './PostCard'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { useDonationPosts } from './useDonationPosts'
import { COMMON_URLS } from '../../setup/constant/commonUrls'
import Loader from '../../components/loaders/loader'

const DonationPosts = () => {
  const styles = createStyles(useTheme())
  const { createPost, updatePost, donationPosts, loading, errorMessage } = useDonationPosts()
  if (loading === true) {
    return <Loader size='large' />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftContent}>
          <Image source={{ uri: COMMON_URLS.PROFILE_AVATAR }} style={styles.profileImage} />
          <Text style={styles.bloodNeeed}>Blood needed?</Text>
        </View>
        <TouchableOpacity style={styles.createPostButton} onPress={createPost}>
          <Text style={styles.createPostText}>Create Post</Text>
        </TouchableOpacity>
      </View>
      {errorMessage !== '' && loading === false && <Text style={[styles.noDataText, styles.errorMessage]}>{errorMessage}</Text>}
      {errorMessage === '' && donationPosts.length === 0
        ? (
          <Text style={styles.noDataText}>No donation posts found.</Text>
          )
        : (
          <FlatList
            data={donationPosts}
            renderItem={({ item }) => <PostCard post={item} updateHandler={updatePost} />}
            keyExtractor={item => item.requestPostId}
            contentContainerStyle={styles.postList}
          />
          )}
    </View>
  )
}

const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingVertical: 15,
      paddingHorizontal: 15,
      backgroundColor: theme.colors.white,
      borderBottomColor: theme.colors.extraLightGray,
      borderBottomWidth: 1,
      borderTopColor: theme.colors.extraLightGray,
      borderTopWidth: 1
    },
    headerLeftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    bloodNeeed: {
      fontSize: 17,
      color: theme.colors.lightGrey
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 20
    },
    createPostButton: {
      backgroundColor: theme.colors.primary,
      padding: 10,
      borderRadius: 25
    },
    createPostText: {
      color: theme.colors.white,
      fontWeight: 'bold'
    },
    postList: {
      paddingBottom: 10
    },
    noDataText: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
      color: theme.colors.textSecondary
    },
    errorMessage: {
      color: theme.colors.primary
    }
  })
}

export default DonationPosts

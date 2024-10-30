import { FlatList, Text, TouchableOpacity, View, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { PostCard } from './PostCard'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { useDonationPosts } from './useDonationPosts'

const DonationPosts = () => {
  const styles = createStyles(useTheme())
  const { createPost, updatePost, donationPosts, loading, errorMessage } = useDonationPosts()
  if (loading === true) {
    return <ActivityIndicator size="large" color="red" style={styles.loadingIndicator} />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.profileImage} />
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
      paddingVertical: 15
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
      color: theme.colors.textSecondary,
      fontWeight: 'bold'
    },
    postList: {
      paddingBottom: 10
    },
    loadingIndicator: {
      marginTop: 20,
      color: theme.colors.primary
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

import { FlatList, Text, View, StyleSheet, ActivityIndicator } from 'react-native'
import { PostCard } from './PostCard'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { DonationData } from '../../donationWorkflow/donationPosts/useDonationPosts'

interface PostsProps {
  updatePost: (donationData: DonationData) => void;
  donationPosts: DonationData[];
  loading: boolean;
  errorMessage: string;
  detailHandler?: (donationData: DonationData) => void;
}

const Posts: React.FC<PostsProps> = ({ updatePost, donationPosts, loading, errorMessage, detailHandler }) => {
  const styles = createStyles(useTheme())
  if (loading) {
    return <ActivityIndicator size="large" color="red" style={styles.loadingIndicator} />
  }

  return (
    <View style={styles.container}>
      {errorMessage !== '' && !loading && <Text style={[styles.noDataText, styles.errorMessage]}>{errorMessage}</Text>}
      {errorMessage === '' && donationPosts.length === 0
        ? (
          <Text style={styles.noDataText}>No donation posts found.</Text>
          )
        : (
          <FlatList
            data={donationPosts}
            renderItem={({ item }) => <PostCard post={item} updateHandler={updatePost} detailHandler={detailHandler} />}
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
      // flex: 1
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

export default Posts

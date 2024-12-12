import { FlatList, StyleSheet } from 'react-native'
import { PostCard, PostCardDisplayOptions } from './PostCard'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { DonationData } from '../../donationWorkflow/donationPosts/useDonationPosts'
import React from 'react'
import StateAwareContainer from '../StateAwareContainer'

interface PostsProps {
  updatePost?: (donationData: DonationData) => void;
  donationPosts: DonationData[];
  loading: boolean;
  errorMessage: string | null;
  detailHandler?: (donationData: DonationData) => void;
  refreshControl?: React.ReactElement;
  displayOptions?: PostCardDisplayOptions;
}

const Posts: React.FC<PostsProps> = ({
  updatePost,
  donationPosts,
  loading,
  errorMessage,
  detailHandler,
  refreshControl,
  displayOptions
}) => {
  const styles = createStyles(useTheme())

  return (
    <StateAwareContainer loading={loading} errorMessage={errorMessage} data={donationPosts}>
      <FlatList
        data={donationPosts}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            updateHandler={updatePost}
            detailHandler={detailHandler}
            {...displayOptions}
          />)}
        keyExtractor={(item) => item.requestPostId}
        contentContainerStyle={styles.postList}
        refreshControl={refreshControl}
      />
    </StateAwareContainer>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
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

export default Posts

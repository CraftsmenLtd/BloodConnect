import { FlatList, StyleSheet, View, Text } from 'react-native'
import { PostCard, PostCardDisplayOptions } from './PostCard'
import { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { DonationData } from '../../donationWorkflow/donationPosts/useDonationPosts'
import React from 'react'
import StateAwareRenderer from '../StateAwareRenderer'

interface PostsProps {
  updatePost?: (donationData: DonationData) => void;
  donationPosts: DonationData[];
  loading: boolean;
  errorMessage: string | null;
  detailHandler?: (donationData: DonationData) => void;
  cancelPost?: (donationData: DonationData) => void;
  refreshControl?: React.ReactElement;
  displayOptions?: PostCardDisplayOptions;
  emptyDataMessage?: string;
}

const Posts: React.FC<PostsProps> = ({
  updatePost,
  donationPosts,
  loading,
  errorMessage,
  detailHandler,
  cancelPost,
  refreshControl,
  displayOptions,
  emptyDataMessage
}) => {
  const styles = createStyles(useTheme())

  const ViewToRender = () => <FlatList
    data={donationPosts}
    renderItem={({ item }) => (
      <PostCard
        post={item}
        updateHandler={updatePost}
        detailHandler={detailHandler}
        {...displayOptions}
      />)}
    ListEmptyComponent={
      <View style={styles.emptyDataMessage}>
        <Text>{emptyDataMessage}</Text>
      </View>
    }
    keyExtractor={(item) => item.requestPostId}
    contentContainerStyle={styles.postList}
    refreshControl={refreshControl}
  />
  return (
    <StateAwareRenderer loading={loading} errorMessage={errorMessage} data={donationPosts} ViewComponent={ViewToRender} />
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
  emptyDataMessage: {
    padding: 20,
    alignItems: 'center'
  },
  errorMessage: {
    color: theme.colors.primary
  }
})

export default Posts

import { FlatList, StyleSheet, View, Text } from 'react-native'
import type { PostCardDisplayOptions } from './PostCard';
import { PostCard } from './PostCard'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { DonationData } from '../../donationWorkflow/donationPosts/useDonationPosts'
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
        cancelHandler={cancelPost}
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

  const ErrorComponent = () => <FlatList
    data={[]}
    renderItem={null}
    keyExtractor={(_, index) => index.toString()}
    contentContainerStyle={styles.postList}
    refreshControl={refreshControl}
    ListEmptyComponent={
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    }
  />
  return (
    <StateAwareRenderer
      loading={loading}
      errorMessage={errorMessage}
      ErrorComponent={errorMessage !== null ? <ErrorComponent /> : undefined}
      data={donationPosts}
      ViewComponent={ViewToRender} />
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10
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

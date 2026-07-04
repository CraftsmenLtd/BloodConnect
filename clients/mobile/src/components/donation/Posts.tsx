import { FlatList, StyleSheet, View } from 'react-native'
import type { ListRenderItem } from 'react-native'
import { Text } from '../text/AppText'
import type { PostCardDisplayOptions } from './PostCard'
import { PostCard } from './PostCard'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { DonationData } from '../../donationWorkflow/donationPosts/useDonationPosts'
import React, { useCallback } from 'react'
import StateAwareRenderer from '../StateAwareRenderer'
import { spacing } from '../../setup/theme/tokens'

type PostsProps = {
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

  const renderItem = useCallback<ListRenderItem<DonationData>>(({ item }) => (
    <PostCard
      post={item}
      updateHandler={updatePost}
      detailHandler={detailHandler}
      cancelHandler={cancelPost}
      {...displayOptions}
    />
  ), [updatePost, detailHandler, cancelPost, displayOptions])

  const listView = (
    <FlatList
      data={donationPosts}
      renderItem={renderItem}
      ListEmptyComponent={
        <View style={styles.centeredContainer}>
          <Text variant="body" style={styles.noResultText}>{emptyDataMessage}</Text>
        </View>
      }
      keyExtractor={(item) => item.requestPostId}
      contentContainerStyle={styles.postList}
      refreshControl={refreshControl}
      initialNumToRender={6}
      maxToRenderPerBatch={8}
      windowSize={11}
      removeClippedSubviews
    />
  )

  const errorView = (
    <FlatList
      data={[]}
      renderItem={null}
      keyExtractor={(_, index) => index.toString()}
      contentContainerStyle={styles.postList}
      refreshControl={refreshControl}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text variant="body" style={styles.errorText}>{errorMessage}</Text>
        </View>
      }
    />
  )

  return (
    <StateAwareRenderer
      loading={loading}
      errorMessage={errorMessage}
      ErrorComponent={errorMessage !== null ? errorView : undefined}
      data={donationPosts}
      ViewComponent={listView} />
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  postList: {
    paddingBottom: spacing.md,
    flexGrow: 1
  },
  loadingIndicator: {
    marginTop: spacing.xl,
    color: theme.colors.primary
  },
  noDataText: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 16,
    color: theme.colors.textSecondary
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  errorText: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  emptyDataMessage: {
    padding: spacing.xl,
    alignItems: 'center'
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noResultText: {
    color: theme.colors.textTertiary,
    textAlign: 'center'
  },
  errorMessage: {
    color: theme.colors.primary
  }
})

export default Posts

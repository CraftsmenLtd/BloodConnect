import { View, StyleSheet, RefreshControl } from 'react-native'
import ToggleTabs from '../components/tab/ToggleTabs'
import { MY_ACTIVITY_TAB_CONFIG, useMyActivity } from './useMyActivity'
import { useTheme } from '../setup/theme/hooks/useTheme'
import { Theme } from '../setup/theme'
import Posts from '../components/donation/Posts'
import { useMyActivityContext } from './context/useMyActivityContext'

const MyActivityTab = () => {
  const theme = useTheme()
  const styles = createStyles(useTheme())
  const { donationPosts, errorMessage, loading } = useMyActivityContext()
  const {
    currentTab,
    handleTabPress,
    updatePost,
    detailHandler,
    myResponses,
    myResponsesLoading,
    myResponsesError,
    refreshing,
    handleRefresh
  } = useMyActivity()

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <ToggleTabs
          tabs={MY_ACTIVITY_TAB_CONFIG.tabs}
          onTabPress={handleTabPress}
          initialActiveTab={MY_ACTIVITY_TAB_CONFIG.initialTab}
        />
      </View>
      {currentTab === MY_ACTIVITY_TAB_CONFIG.initialTab
        ? <Posts
            donationPosts={donationPosts}
            loading={loading}
            updatePost={updatePost}
            errorMessage={errorMessage}
            detailHandler={detailHandler} />
        : <Posts
            donationPosts={myResponses}
            loading={myResponsesLoading}
            errorMessage={myResponsesError}
            detailHandler={detailHandler}
            displayOptions={{ showOptions: false, showButton: false }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />}
          />
      }
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 12
  },
  tabHeader: {
    paddingHorizontal: 8,
    backgroundColor: theme.colors.white,
    paddingVertical: 16,
    marginBottom: -18.5
  },
  contentContainer: {
    marginTop: 20
  }
})

export default MyActivityTab

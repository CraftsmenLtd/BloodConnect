import { useTranslation } from 'react-i18next'
import { View, StyleSheet, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import ToggleTabs from '../components/tab/ToggleTabs'
import { MY_ACTIVITY_TAB_CONFIG, useMyActivity } from './useMyActivity'
import { useTheme } from '../setup/theme/hooks/useTheme'
import type { Theme } from '../setup/theme'
import Posts from '../components/donation/Posts'
import { useMyActivityContext } from './context/useMyActivityContext'
import Toast from '../components/toast'
import { SCREENS } from '../setup/constant/screens'
import type { ChatRoomNavigationProp } from '../setup/navigation/navigationTypes'
import { useUserProfile } from '../userWorkflow/context/UserProfileContext'
import { buildChannelId } from '../chat/constants/chatConstants'
import type { DonationData } from '../donationWorkflow/donationHelpers'
import React from 'react'

const MyActivityTab = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const styles = createStyles(useTheme())
  const navigation = useNavigation<ChatRoomNavigationProp>()
  const { userProfile } = useUserProfile()

  // Donor-side entry: the current user is the donor on a request they accepted.
  const openDonorChat = (donationData: DonationData): void => {
    const channelId = buildChannelId(donationData.seekerId, donationData.requestPostId, userProfile.userId)
    navigation.navigate(SCREENS.CHAT_ROOM, {
      channelId,
      requestPostId: donationData.requestPostId,
      bloodGroup: donationData.requestedBloodGroup
    })
  }
  const {
    donationPosts,
    errorMessage,
    loading,
    fetchDonationPosts,
    myResponses,
    myResponsesError,
    myResponsesLoading
  } = useMyActivityContext()
  const {
    currentTab,
    handleTabPress,
    updatePost,
    detailHandler,
    myResponsesDetailHandler,
    cancelPost,
    refreshing,
    handleRefresh,
    showToast,
    toastAnimationFinished
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
        ? <>
          <Posts
            donationPosts={donationPosts}
            loading={loading}
            updatePost={updatePost}
            errorMessage={errorMessage}
            detailHandler={detailHandler}
            emptyDataMessage={t('donationPosts.emptyDonationPosts')}
            displayOptions={{
              showStatus: true
            }}
            cancelPost={cancelPost}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void fetchDonationPosts()
                }}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
          {showToast !== null && <Toast
            message={showToast?.message}
            type={showToast?.type}
            toastAnimationFinished={toastAnimationFinished}
          />}
        </>
        : <Posts
          donationPosts={myResponses}
          loading={myResponsesLoading}
          errorMessage={myResponsesError}
          emptyDataMessage={t('donationPosts.emptyMyDonationPosts')}
          detailHandler={myResponsesDetailHandler}
          chatHandler={openDonorChat}
          displayOptions={{ showOptions: false, showButton: true, showStatus: true, showChatButton: true }}
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
    flex: 1
  },
  tabHeader: {
    paddingHorizontal: 8,
    backgroundColor: theme.colors.white,
    paddingVertical: 16,
    borderBottomColor: theme.colors.extraLightGray,
    borderBottomWidth: 1,
    borderTopColor: theme.colors.extraLightGray,
    borderTopWidth: 1
  },
  contentContainer: {
    marginTop: 20
  }
})

export default MyActivityTab

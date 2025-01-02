import React, { useState } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import ToggleTabs from '../../../components/tab/ToggleTabs'
import { DetailPostRouteProp, DetailPostScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import PostCard from '../../../components/donation/PostCard'
import { SCREENS } from '../../../setup/constant/screens'
import { DonationData } from '../../../donationWorkflow/donationHelpers'
import DonorResponses from '../donorResponses/DonorResponses'
import { TabConfig } from '../../types'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'
import { useMyActivity } from '../../useMyActivity'
import Toast from '../../../components/toast'

interface DetailProps {
  navigation: DetailPostScreenNavigationProp;
  route: DetailPostRouteProp;
}

const DETAIL_POST_TAB_CONFIG: TabConfig = {
  tabs: ['Detail', 'Responses'],
  initialTab: 'Detail'
}

const Detail = ({ navigation, route }: DetailProps) => {
  const styles = createStyles(useTheme())
  const { cancelPost, cancelPostError, isLoading, showToast, toastAnimationFinished } = useMyActivity()
  const { data, tab } = route.params
  const [currentTab, setCurrentTab] = useState(tab ?? DETAIL_POST_TAB_CONFIG.initialTab)

  const handlePressDonor = (donorId: string) => {
    navigation.navigate(SCREENS.DONOR_PROFILE, { donorId })
  }

  const handleTabPress = (tab: string): void => {
    setCurrentTab(tab)
  }

  const updatePost = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
  }

  return (
    <View style={styles.container}>
      <View style={[styles.tabHeader, currentTab === DETAIL_POST_TAB_CONFIG.initialTab ? { marginBottom: -18.5 } : {}]}>
        <ToggleTabs
          tabs={DETAIL_POST_TAB_CONFIG.tabs}
          onTabPress={handleTabPress}
          initialActiveTab={tab}
        />
      </View>
      {currentTab === DETAIL_POST_TAB_CONFIG.initialTab
        ? <View style={styles.postCardContainer}>
            <PostCard
              post={data}
              showContactNumber
              showDescription
              showPatientName
              showTransportInfo
              showButton={false}
              showStatus={true}
              updateHandler={updatePost}
              cancelHandler={cancelPost}
              isLoading={isLoading}
            />
            {cancelPostError !== '' &&
              <Text style={styles.errorMessage}>{cancelPostError}</Text>
            }
            {showToast != null && <Toast
                message={showToast?.message}
                type={showToast?.type}
                toastAnimationFinished={toastAnimationFinished}
            />}
          </View>
        : <DonorResponses acceptedDonors={data.acceptedDonors} handlePressDonor={handlePressDonor} />
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
  postCardContainer: {
    marginTop: 20,
    backgroundColor: theme.colors.white,
    flex: 1
  },
  errorMessage: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: theme.typography.fontSize
  }
})

export default Detail

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import ToggleTabs from '../../../components/tab/ToggleTabs'
import { STATUS } from '../../../donationWorkflow/types'
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
import Button from '../../../components/button/Button'
import { useRoute } from '@react-navigation/native'

interface DetailProps {
  navigation: DetailPostScreenNavigationProp;
}

const DETAIL_POST_TAB_CONFIG: TabConfig = {
  tabs: ['Detail', 'Responses'],
  initialTab: 'Detail'
}

const Detail = ({ navigation }: DetailProps) => {
  const styles = createStyles(useTheme())
  const { cancelPost, cancelPostError, isLoading, showToast, toastAnimationFinished } = useMyActivity()
  const { data, tab, useAsDetailsPage } = useRoute<DetailPostRouteProp>().params
  const [currentTab, setCurrentTab] = useState(tab ?? DETAIL_POST_TAB_CONFIG.initialTab)
  const isDetailsPage = useAsDetailsPage !== undefined && useAsDetailsPage

  useEffect(() => {
    navigation.setOptions({ headerTitle: isDetailsPage ? 'Detail' : 'My Post' })
  }, [useAsDetailsPage])

  const handlePressDonor = (donorId: string) => {
    navigation.navigate(SCREENS.DONOR_PROFILE, { donorId })
  }

  const handleTabPress = (tab: string): void => {
    setCurrentTab(tab)
  }

  const updatePost = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
  }

  const handleCompleteRequest = () => {
    navigation.navigate(SCREENS.REQUEST_STATUS, {
      requestPostId: data.requestPostId,
      createdAt: data.createdAt
    })
  }

  return (
    <View style={styles.container}>
      {!isDetailsPage &&
        <View style={[styles.tabHeader, currentTab === DETAIL_POST_TAB_CONFIG.initialTab ? { marginBottom: -18.5 } : {}]}>
          <ToggleTabs
            tabs={DETAIL_POST_TAB_CONFIG.tabs}
            onTabPress={handleTabPress}
            initialActiveTab={tab}
          />
        </View>}

      {currentTab === DETAIL_POST_TAB_CONFIG.initialTab
        ? <View style={[styles.postCardContainer, { marginTop: isDetailsPage ? 2 : 20 }]}>
          <PostCard
            post={data}
            showContactNumber
            showDescription
            showPatientName
            showTransportInfo
            showOptions={!isDetailsPage}
            showButton={false}
            showStatus={true}
            updateHandler={updatePost}
            cancelHandler={cancelPost}
            isLoading={isLoading}
          />
          {cancelPostError !== '' && <Text style={styles.errorMessage}>{cancelPostError}</Text>}
          {showToast != null && (
            <Toast
              message={showToast?.message}
              type={showToast?.type}
              toastAnimationFinished={toastAnimationFinished}
            />
          )}
          {!isDetailsPage &&
            <View style={styles.buttonContainer}>
              <Button text="Complete Request" disabled={data.status === STATUS.COMPLETED} onPress={handleCompleteRequest} />
            </View>
          }
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
    flex: 1,
    backgroundColor: theme.colors.white
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 2,
    left: 20,
    right: 20
  },
  errorMessage: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: theme.typography.fontSize
  }
})

export default Detail

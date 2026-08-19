import React, { useEffect, useState } from 'react'
import {
  useTranslation } from 'react-i18next'
import { View,
  StyleSheet
} from 'react-native'
import { Text } from '../../../components/text/AppText'
import useDonationStatus from '../../../api/hooks/useDonationStatus'
import ToggleTabs from '../../../components/tab/ToggleTabs'
import type { StatusType } from '../../../donationWorkflow/types'
import { STATUS } from '../../../donationWorkflow/types'
import type {
  DetailPostRouteProp,
  DetailPostScreenNavigationProp
} from '../../../setup/navigation/navigationTypes'
import PostCard from '../../../components/donation/PostCard'
import { SCREENS } from '../../../setup/constant/screens'
import type { DonationData } from '../../../donationWorkflow/donationHelpers'
import {
  cancelNotification,
  handleNotification
} from '../../../setup/notification/scheduleNotification'
import DonorResponses from '../donorResponses/DonorResponses'
import type { TabConfig } from '../../types'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import type { Theme } from '../../../setup/theme'
import { useMyActivity } from '../../useMyActivity'
import Toast from '../../../components/toast'
import Button from '../../../components/button/Button'
import { log } from '../../../utility/logger'
import { spacing } from '../../../setup/theme/tokens'

type DetailProps = {
  navigation: DetailPostScreenNavigationProp;
  route: DetailPostRouteProp;
}

const DETAIL_POST_TAB_CONFIG: TabConfig = {
  tabs: ['Detail', 'Responses'],
  initialTab: 'Detail'
}

const Detail = ({ navigation, route }: DetailProps) => {
  const styles = createStyles(useTheme())
  const { t } = useTranslation()
  const {
    cancelPost,
    cancelPostError,
    isLoading,
    showToast,
    toastAnimationFinished
  } = useMyActivity()
  const {
    executeStatusRequest,
    isLoading: statusLoading,
    error: statusError
  } = useDonationStatus()
  const { data, tab, useAsDetailsPage } = route.params
  const [currentTab, setCurrentTab] = useState(tab ?? DETAIL_POST_TAB_CONFIG.initialTab)
  const isDetailsPage = useAsDetailsPage !== undefined && useAsDetailsPage
  const [localStatus, setLocalStatus] = useState<StatusType>(data.status)

  useEffect(() => {
    navigation.setOptions({ headerTitle: isDetailsPage ? 'Detail' : 'My Requests' })
  }, [useAsDetailsPage])

  const handlePressDonor = (donorId: string): void => {
    navigation.navigate(SCREENS.DONOR_PROFILE, { donorId })
  }

  const handleTabPress = (tab: string): void => {
    setCurrentTab(tab)
  }

  const updatePost = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
  }

  const handleCompleteRequest = (): void => {
    navigation.navigate(SCREENS.REQUEST_STATUS, {
      requestPostId: data.requestPostId,
      createdAt: data.createdAt
    })
  }

  const handleStatusChange = async(newStatus: StatusType): Promise<void> => {
    const previousStatus = localStatus
    setLocalStatus(newStatus)

    try {
      await executeStatusRequest({
        requestPostId: data.requestPostId,
        seekerId: data.seekerId,
        createdAt: data.createdAt,
        status: newStatus
      })
      if (newStatus === STATUS.ACCEPTED) {
        handleNotification(new Date(data.donationDateTime))
      } else {
        void cancelNotification(new Date(data.donationDateTime))
      }
    } catch (err) {
      log.error(err)
      setLocalStatus(previousStatus)
    }
  }

  return (
    <View style={styles.container}>
      {!isDetailsPage
        && <View style={[
          styles.tabHeader,
          currentTab === DETAIL_POST_TAB_CONFIG.initialTab
            ? { marginBottom: -18.5 }
            : {}
        ]}>
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
            statusValue={localStatus}
          />
          {cancelPostError !== '' && <Text style={styles.errorMessage}>{cancelPostError}</Text>}
          {showToast !== null && (
            <Toast
              message={showToast?.message}
              type={showToast?.type}
              toastAnimationFinished={toastAnimationFinished}
            />
          )}
          {!isDetailsPage
            && <View style={styles.buttonContainer}>
              <Button
                text={t('btn.completeRequest')}
                disabled={
                  localStatus === STATUS.COMPLETED
                  || localStatus === STATUS.CANCELLED
                  || localStatus === STATUS.EXPIRED
                }
                onPress={handleCompleteRequest} />
            </View>
          }
          {isDetailsPage
            && [STATUS.ACCEPTED, STATUS.IGNORED, STATUS.PENDING].includes(localStatus)
            && <View style={styles.buttonContainer}>
              {statusError !== '' && <Text style={styles.errorMessage}>{statusError}</Text>}
              <Button
                text={ localStatus === STATUS.ACCEPTED ? t('btn.ignore') : t('btn.acceptRequest') }
                onPress={() =>
                  handleStatusChange(
                    localStatus === STATUS.ACCEPTED ? STATUS.IGNORED : STATUS.ACCEPTED
                  )
                }
                loading={statusLoading}
              />
            </View>
          }
        </View>
        : <DonorResponses
          acceptedDonors={data.acceptedDonors}
          handlePressDonor={handlePressDonor}
        />
      }
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  tabHeader: {
    paddingHorizontal: spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingVertical: spacing.lg,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1
  },
  postCardContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface
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
    marginTop: spacing.lg,
    fontSize: theme.typography.fontSize
  }
})

export default Detail

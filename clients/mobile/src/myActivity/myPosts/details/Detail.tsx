import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import ToggleTabs from '../../../components/tab/ToggleTabs'
import { DetailPostRouteProp, DetailPostScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import PostCard from '../../../components/donation/PostCard'
import { SCREENS } from '../../../setup/constant/screens'
import { DonationData } from '../../../donationWorkflow/donationHelpers'
import DonorResponses from '../donorResponses/DonorResponses'
import { TabConfig } from '../../types'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'

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
  const { data, tab } = route.params
  const [currentTab, setCurrentTab] = useState(tab ?? DETAIL_POST_TAB_CONFIG.initialTab)

  const handlePressDonor = (donarId: string) => {
    navigation.navigate(SCREENS.DONAR_PROFILE, { donarId })
  }

  const handleTabPress = (tab: string): void => {
    setCurrentTab(tab)
  }

  const updatePost = (donationData: DonationData): void => {
    navigation.navigate(SCREENS.DONATION, { data: { ...donationData }, isUpdating: true })
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
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
              updateHandler={updatePost} />
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
    marginBottom: -18.5
  },
  postCardContainer: {
    marginTop: 20,
    backgroundColor: theme.colors.white,
    flex: 1
  }
})

export default Detail

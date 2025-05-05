import React from 'react'
import {
  Text, View, TouchableOpacity
} from 'react-native'
import { SCREENS } from '../../../setup/constant/screens'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import createStyles from './createStyle'
import { useNavigation } from '@react-navigation/native'
import { useAccount } from '../hooks/useAccount'
import type { ProfileScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import Loader from '../../../components/loaders/loader'
import ProfileSection from '../../components/ProfileSection'

export const Account = () => {
  const styles = createStyles(useTheme())
  const { userProfileData, loading, handleSignOut } = useAccount()
  const navigation = useNavigation<ProfileScreenNavigationProp>()

  if (loading) {
    return <Loader />
  }

  return (
    <View style={styles.container}>
      {userProfileData !== null && <ProfileSection
        name={userProfileData?.name ?? ''}
        location={userProfileData?.location ?? ''}
      ></ProfileSection>}

      <View style={styles.optionsSection}>
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => { navigation.navigate(SCREENS.PROFILE) }}
        >
          <MaterialIcons name="person-outline" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Profile</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="bloodtype" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Donor Information</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity> */}

        {/* <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="notifications-none" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => { navigation.navigate(SCREENS.ABOUT) }}
        >
          <MaterialIcons name="info-outline" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>About</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.moreSection}>
        {/* <Text style={styles.moreText}>More</Text> */}
        {/* <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="star-border" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Rate & Review</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity> */}

        {/* <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="help-outline" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Help</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.optionItem} onPress={() => { void handleSignOut() }}>
          <MaterialIcons name="logout" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>

  )
}

export default Account

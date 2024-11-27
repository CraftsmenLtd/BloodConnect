import React from 'react'
import {
  Text, View, TouchableOpacity, Image, ImageStyle, StyleProp, ActivityIndicator,
  ImageSourcePropType
} from 'react-native'
import { SCREENS } from '../../../setup/constant/screens'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import createStyles from './createStyle'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { useAccount } from '../hooks/useAccount'

export const Account = () => {
  const styles = createStyles(useTheme())
  const { userData, loading, handleSignOut } = useAccount()
  const navigation = useNavigation<NavigationProp<any>>()

  if (loading) {
    return <ActivityIndicator size="large" color="red" style={styles.loadingIndicator} />
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.imageOuterBorder}>
          <View style={styles.imageInnerBorder}>
            <Image
              style={styles.profileImage as StyleProp<ImageStyle>}
              source={{ uri: 'https://avatar.iran.liara.run/public/boy?username=Ash' }}
            />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userData?.name ?? 'User Name'}</Text>
          <View style={styles.profileLocationSection}>
            <MaterialIcons name="location-on" size={16} style={styles.iconStyle} />
            <Text style={styles.profileLocation}>{userData?.location ?? 'User Location'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.optionsSection}>
        <TouchableOpacity style={styles.optionItem} onPress={() => { navigation.navigate(SCREENS.PROFILE) }}>
          <MaterialIcons name="person-outline" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Profile</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="bloodtype" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Donor Information</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="notifications-none" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.moreSection}>
        <Text style={styles.moreText}>More</Text>
        <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="star-border" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Rate & Review</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <MaterialIcons name="help-outline" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Help</Text>
          <MaterialIcons name="chevron-right" size={24} style={styles.optionIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={() => { void handleSignOut() }}>
          <MaterialIcons name="logout" size={24} style={styles.iconStyle} />
          <Text style={styles.optionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>

  )
}

export default Account

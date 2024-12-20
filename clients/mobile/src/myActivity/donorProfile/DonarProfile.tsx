import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageStyle, StyleProp } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useDonarProfile from './useDonarProfile'
import { preferredDonationLocations } from '../../userWorkflow/services/userServices'
import { COMMON_URLS } from '../../setup/constant/commonUrls'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import StateAwareContainer from '../../components/StateAwareContainer'

const DonarProfile = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { donarProfile, loading, error, handleCall } = useDonarProfile()

  const calculateBMI = (weightKg: number, heightFeet: number): number => {
    const heightInMeters = heightFeet * 0.3048
    const bmi = weightKg / (heightInMeters ** 2)
    return parseFloat(bmi.toFixed(2))
  }

  const ViewToRender = () => <View style={styles.container}>

  <View style={styles.profileContainer}>
    <Image
      source={{ uri: COMMON_URLS.PROFILE_AVATAR }}
      style={styles.profileImage as StyleProp<ImageStyle>}
    />
    <View style={styles.bloodGroupBadge}>
      <Text style={styles.bloodGroupText}>
        {donarProfile?.bloodGroup ?? ''}(ve)
      </Text>
    </View>
  </View>

  <Text style={styles.name}>{donarProfile?.donorName ?? ''}</Text>
  <View>
    {Array.isArray(donarProfile?.preferredDonationLocations) &&
      donarProfile.preferredDonationLocations.map((location: preferredDonationLocations, index: number) => (
        <View style={styles.locationRow} key={index}>
          <Ionicons name="location-sharp" size={16} color={theme.colors.primary} />
          <Text style={styles.locationText}>
            {location?.area ?? ''}, {location?.city ?? ''}
          </Text>
        </View>
      ))}
  </View>

  <View style={styles.detailsRow}>
      <Text style={styles.detailsText}>BMI: {calculateBMI(donarProfile.height, donarProfile.weightKg)}</Text>
    </View>

  <View style={{ width: '100%' }}>
    <TouchableOpacity style={styles.callButton} onPress={() => handleCall(donarProfile.phoneNumbers)}>
      <Text style={styles.callButtonText}>Call now</Text>
    </TouchableOpacity>
  </View>
</View>

  return (
    <StateAwareContainer loading={loading} errorMessage={error} data={donarProfile} ViewComponent={ViewToRender} />
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.white
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4
    },
    locationText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.colors.textSecondary
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.white
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.primary,
      textAlign: 'center'
    },
    container: {
      borderTopColor: theme.colors.black,
      borderTopWidth: 1,
      paddingTop: 32,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.white,
      alignItems: 'center'
    },
    profileContainer: {
      position: 'relative',
      alignItems: 'center'
    },
    profileImage: {
      width: 110,
      height: 110,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.colors.primary
    },
    bloodGroupBadge: {
      position: 'absolute',
      bottom: -8,
      backgroundColor: theme.colors.goldenYellow,
      borderRadius: 12,
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary
    },
    bloodGroupText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.textSecondary
    },
    name: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 12,
      color: theme.colors.textPrimary
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8
    },
    detailsText: {
      fontSize: 14,
      color: theme.colors.grey
    },
    callButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 100,
      paddingVertical: 12,
      paddingHorizontal: 40,
      marginTop: 16
    },
    callButtonText: {
      textAlign: 'center',
      fontSize: 16,
      color: theme.colors.white,
      fontWeight: 'bold'
    }
  })

export default DonarProfile

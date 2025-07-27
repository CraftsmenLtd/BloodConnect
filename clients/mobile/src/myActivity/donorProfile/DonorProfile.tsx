import React from 'react'
import type { ImageStyle, StyleProp } from 'react-native'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useDonorProfile from './useDonorProfile'
import type { preferredDonationLocations } from '../../userWorkflow/services/userServices'
import { COMMON_URLS } from '../../setup/constant/commonUrls'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import StateAwareRenderer from '../../components/StateAwareRenderer'

const DonorProfile = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { donorProfile, loading, error, handleCall } = useDonorProfile()

  const calculateBMI = (weightKg: number, heightFeet: number | string): number => {
    const heightInFeet = typeof heightFeet === 'string' ? parseFloat(heightFeet) : heightFeet
    const heightInMeters = heightInFeet * 0.3048
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
          {donorProfile?.bloodGroup ?? ''}(ve)
        </Text>
      </View>
    </View>

    <Text style={styles.name}>{donorProfile?.donorName ?? ''}</Text>
    <View>
      {Array.isArray(donorProfile?.preferredDonationLocations)
        && donorProfile.preferredDonationLocations.map(
          (location: preferredDonationLocations, index: number) => (
            <View style={styles.locationRow} key={index}>
              <Ionicons name="location-sharp" size={16} color={theme.colors.primary} />
              <Text style={styles.locationText}>
                {location?.area ?? ''}
              </Text>
            </View>
          ))}
    </View>

    <View style={styles.detailsRow}>
      <Text style={styles.detailsText}>BMI: {
        donorProfile.weight && donorProfile.height
          ? calculateBMI(donorProfile.weight, donorProfile.height) : 'Not Available'}</Text>
    </View>

    <View style={{ width: '100%' }}>
      <TouchableOpacity style={styles.callButton} onPress={handleCall}>
        <Text style={styles.callButtonText}>Call now</Text>
      </TouchableOpacity>
    </View>
  </View>

  return (
    <StateAwareRenderer
      loading={loading} errorMessage={error} data={donorProfile} ViewComponent={ViewToRender} />
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

export default DonorProfile

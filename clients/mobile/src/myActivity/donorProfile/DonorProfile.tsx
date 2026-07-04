import React from 'react'
import type { ImageStyle, StyleProp } from 'react-native'
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { Text } from '../../components/text/AppText'
import { Ionicons } from '@expo/vector-icons'
import useDonorProfile from './useDonorProfile'
import type { preferredDonationLocations } from '../../userWorkflow/services/userServices'
import { COMMON_URLS } from '../../setup/constant/commonUrls'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import StateAwareRenderer from '../../components/StateAwareRenderer'
import { calculateBMI, getBMICategory } from '../../utility/bmi'
import { spacing, radius } from '../../setup/theme/tokens'

const DonorProfile = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { donorProfile, loading, error, handleCall } = useDonorProfile()
  const ViewToRender = () => <View style={styles.container}>
    <View style={styles.profileContainer}>
      <Image
        source={{ uri: COMMON_URLS.PROFILE_AVATAR }}
        style={styles.profileImage as StyleProp<ImageStyle>}
      />
      <View style={styles.bloodGroupBadge}>
        <Text variant="body" style={styles.bloodGroupText}>
          {donorProfile?.bloodGroup ?? ''}(ve)
        </Text>
      </View>
    </View>

    <Text variant="h2" style={styles.name}>{donorProfile?.donorName ?? ''}</Text>
    <View>
      {Array.isArray(donorProfile?.preferredDonationLocations)
        && donorProfile.preferredDonationLocations.map(
          (location: preferredDonationLocations, index: number) => (
            <View style={styles.locationRow} key={index}>
              <Ionicons name="location-sharp" size={16} color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.locationText}>
                {location?.area ?? ''}
              </Text>
            </View>
          ))}
    </View>

    <View style={styles.detailsRow}>
      <Text variant="bodySmall" style={styles.detailsText}>
        {donorProfile.weight && donorProfile.height
          ? (() => {
            const bmi = calculateBMI(donorProfile.weight, donorProfile.height)

            return `BMI: ${bmi} (${getBMICategory(bmi)})`
          })()
          : 'BMI: Not Available'}
      </Text>
    </View>

    <View style={{ width: '100%' }}>
      <TouchableOpacity style={styles.callButton} onPress={handleCall}>
        <Text variant="body" style={styles.callButtonText}>Call now</Text>
      </TouchableOpacity>
    </View>
  </View>

  return (
    <StateAwareRenderer
      loading={loading} errorMessage={error} data={donorProfile} ViewComponent={ViewToRender()} />
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.xs
    },
    locationText: {
      marginLeft: spacing.sm,
      color: theme.colors.textSecondary
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: theme.colors.surface
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.primary,
      textAlign: 'center'
    },
    container: {
      borderTopColor: theme.colors.textPrimary,
      borderTopWidth: 1,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      backgroundColor: theme.colors.surface,
      alignItems: 'center'
    },
    profileContainer: {
      position: 'relative',
      alignItems: 'center'
    },
    profileImage: {
      width: 110,
      height: 110,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: theme.colors.primary
    },
    bloodGroupBadge: {
      position: 'absolute',
      bottom: -8,
      backgroundColor: theme.colors.goldenYellow,
      borderRadius: radius.lg,
      paddingVertical: 2,
      paddingHorizontal: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.primary
    },
    bloodGroupText: {
      fontWeight: 'bold',
      color: theme.colors.textSecondary
    },
    name: {
      marginTop: spacing.md,
      color: theme.colors.textPrimary
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm
    },
    detailsText: {
      color: theme.colors.textTertiary
    },
    callButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxxxl,
      marginTop: spacing.lg
    },
    callButtonText: {
      textAlign: 'center',
      color: theme.colors.onPrimary,
      fontWeight: 'bold'
    }
  })

export default DonorProfile

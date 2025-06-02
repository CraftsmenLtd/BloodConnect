import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, ScrollView } from 'react-native'
import Badge from '../../../components/badge'
import MapView from '../../../components/mapView'
import useMapView from '../../../components/mapView/useMapView'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Button } from '../../../components/button/Button'
import type { LocationData } from '../../../utility/formatting'
import { formattedDate } from '../../../utility/formatting'
import ProfileSection from '../../components/ProfileSection'
import createStyles from './createStyle'
import { useProfile } from '../hooks/useProfile'
import { SCREENS } from '../../../setup/constant/screens'
import type { EditProfileScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { useNavigation } from '@react-navigation/native'

export type EditProfileData = {
  phone: string;
  weight: string;
  height: string;
  dateOfBirth: string;
  name: string;
  gender: string;
  lastDonationDate: string;
  preferredDonationLocations: LocationData[];
  locations: string[];
  availableForDonation: boolean;
  [key: string]: unknown;
}

const Profile: React.FC = () => {
  const styles = createStyles(useTheme())
  const { t } = useTranslation()
  const { userDetails } = useProfile()
  const { centerCoordinate, mapMarkers, zoomLevel } = useMapView(
    userDetails?.preferredDonationLocations.map(location => location.area) ?? []
  )
  const navigation = useNavigation<EditProfileScreenNavigationProp>()

  const renderDetailRow = (label: string,
    value: string = '',
    isLast: boolean = false): JSX.Element => (
    <View style={[styles.row, isLast && styles.lastRow]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )

  const handleEditPress = () => {
    if (userDetails === null) return

    navigation.navigate(SCREENS.EDIT_PROFILE, {
      userDetails: {
        ...userDetails,
        weight: userDetails.weight?.toString() ?? '',
        height: userDetails.height?.toString() ?? '',
        dateOfBirth: userDetails.dateOfBirth ?? '',
        name: userDetails.name ?? '',
        lastDonationDate: userDetails.lastDonationDate ?? '',
        preferredDonationLocations: userDetails.preferredDonationLocations ?? [],
        locations: userDetails?.preferredDonationLocations?.map(location => {
          return location.area
        }) ?? []
      }
    })
  }

  return (
    <View style={styles.container}>
      {userDetails !== null && (
        <ProfileSection
          name={userDetails.name ?? ''}
          location={userDetails.location ?? ''}
          age={userDetails.age}
          isEditing={false}
        />
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {renderDetailRow(t('fromLabel.name'), userDetails.name ?? '')}
          {renderDetailRow(t('fromLabel.dob'), formattedDate(userDetails.dateOfBirth ?? '', true))}
          {renderDetailRow(t('fromLabel.weight'), userDetails.weight !== null ?
            userDetails.weight.toString() : '')}
          {renderDetailRow(t('fromLabel.height'), userDetails.height !== undefined
            ? userDetails.height.toString() : '')}
          {renderDetailRow(t('fromLabel.phone'), userDetails.phoneNumbers !== undefined &&
            userDetails.phoneNumbers.length > 0 ?
            userDetails.phoneNumbers[0] : '')}
          {renderDetailRow(t('fromLabel.gender'), userDetails.gender.toUpperCase())}
          {userDetails?.lastDonationDate !== '' && renderDetailRow(t('fromLabel.lastDonationDate'),
            formattedDate(userDetails?.lastDonationDate ?? '', true), false)}
          <View style={[styles.row, styles.lastRow]}>
            <Text style={styles.label}>{t('fromLabel.locations')}</Text>
            <View style={styles.selectedItemContainer}>
              {userDetails?.preferredDonationLocations?.map(location => {
                return (
                  <View key={location.area} style={styles.selectedItem}>
                    <Badge text={location.area} containerStyle={styles.selectedItemText} />
                  </View>
                )
              })}
            </View>
          </View>
          <MapView
            style={styles.mapViewContainer}
            centerCoordinate={centerCoordinate}
            zoomLevel={zoomLevel}
            markers={mapMarkers}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          buttonStyle={styles.editButton}
          textStyle={styles.editButtonText}
          text='Edit'
          onPress={handleEditPress}
        />
      </View>
    </View>
  )
}

export default Profile

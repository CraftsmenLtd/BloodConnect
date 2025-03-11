import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Button } from '../../../components/button/Button'
import { formattedDate, LocationData } from '../../../utility/formatting'
import ProfileSection from '../../components/ProfileSection'
import createStyles from './createStyle'
import { useProfile } from '../hooks/useProfile'
import { SCREENS } from '../../../setup/constant/screens'
import { EditProfileScreenNavigationProp } from '../../../setup/navigation/navigationTypes'
import { useNavigation } from '@react-navigation/native'

export interface EditProfileData {
  phone: string;
  weight: string;
  height: string;
  dateOfBirth: string;
  name: string;
  gender: string;
  lastDonationDate: string;
  city: string;
  preferredDonationLocations: LocationData[];
  locations: string[];
  [key: string]: any;
}

const Profile = () => {
  const styles = createStyles(useTheme())
  const { userDetails } = useProfile()
  const navigation = useNavigation<EditProfileScreenNavigationProp>()

  const renderDetailRow = (label: string, value: string = '', isLast: boolean = false): JSX.Element => (
    <View style={[styles.row, isLast && styles.lastRow]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )

  const handleEditPress = () => {
    if (userDetails === null) return

    const { weight, height, dateOfBirth, name, ...rest } = userDetails
    navigation.navigate(SCREENS.EDIT_PROFILE, {
      userDetails: {
        ...rest,
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
          isEditing={false}
        />
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {renderDetailRow('Name', userDetails.name ?? '')}
          {renderDetailRow('Date of Birth', formattedDate(userDetails.dateOfBirth ?? '', true))}
          {renderDetailRow('Age', userDetails.age.toString())}
          {renderDetailRow('Weight (kg)', userDetails.weight !== undefined ? userDetails.weight.toString() : '')}
          {renderDetailRow('Height (feet)', userDetails.height !== undefined ? userDetails.height.toString() : '')}
          {renderDetailRow('Phone', userDetails.phoneNumbers !== undefined && userDetails.phoneNumbers.length > 0 ? userDetails.phoneNumbers[0] : '')}
          {renderDetailRow('Gender', userDetails.gender)}
          {userDetails?.lastDonationDate !== '' && renderDetailRow('Last Donation Date', formattedDate(userDetails?.lastDonationDate ?? '', true), false)}
          <View style={[styles.row, styles.lastRow]}>
            <Text style={styles.label}>{'Locations'}</Text>
            {userDetails?.preferredDonationLocations?.map(location => {
              return (
                <View key={location.area} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>
                    {location.area}
                  </Text>
                </View>
              )
            })}
          </View>
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

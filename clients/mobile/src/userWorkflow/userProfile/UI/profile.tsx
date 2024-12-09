import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Button } from '../../../components/button/Button'
import ProfileSection from '../../components/ProfileSection'
import createStyles from './createStyle'
import { useUserProfile } from '../../context/UserProfileContext'
import { useProfile } from '../hooks/useProfile'
import { UserProfileContextData } from '../../context/UserProfileContext'

type Gender = 'Male' | 'Female' | 'Other'

export interface UserProfile {
  bloodGroup: string;
  name: string;
  lastDonationDate: string;
  height: number;
  weight: number;
  gender: Gender;
  dateOfBirth: string;
  availableForDonation: string;
  lastVaccinatedDate: string;
  NIDFront: string;
  NIDBack: string;
  phoneNumbers: string[];
  preferredDonationLocations: string[];
  // location: string;
}

const Profile: React.FC = () => {
  const styles = createStyles(useTheme())
  const { userDetails } = useProfile()

  const renderDetailRow = (label: string, value: string): JSX.Element => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )

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
          {renderDetailRow('Name', userDetails.name)}
          {renderDetailRow('Date of Birth', userDetails.dateOfBirth)}
          {renderDetailRow('Age', userDetails.age.toString())}
          {renderDetailRow('Weight (kg)', userDetails.weight.toString())}
          {renderDetailRow('Height (feet)', userDetails.height.toString())}
          {renderDetailRow('Gender', userDetails.gender)}
          {renderDetailRow('Phone', userDetails.phoneNumbers[0] ?? '')}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          buttonStyle={styles.editButton}
          textStyle={styles.editButtonText}
          text='Edit'
          onPress={() => console.log('Edit button pressed')}
        />
      </View>
    </View>
  )
}

export default Profile

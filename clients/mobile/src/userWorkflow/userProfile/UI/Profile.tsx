import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Button } from '../../../components/button/Button'
import ProfileSection from '../../components/ProfileSection'
import createStyles from './createStyle'
import { useUserProfile, UserProfileContextData } from '../../context/UserProfileContext'
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
  [key: string]: any;
}

const Profile: React.FC = () => {
  const styles = createStyles(useTheme())
  const { userDetails } = useProfile()
  console.log('profile userDetails', userDetails)
  const navigation = useNavigation<EditProfileScreenNavigationProp>()

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
          {renderDetailRow('Phone', userDetails.phoneNumbers[0] ?? '')}
          {renderDetailRow('Gender', userDetails.gender)}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          buttonStyle={styles.editButton}
          textStyle={styles.editButtonText}
          text='Edit'
          onPress={() => { navigation.navigate(SCREENS.EDIT_PROFILE, { userDetails }) }}
        />
      </View>
    </View>
  )
}

export default Profile

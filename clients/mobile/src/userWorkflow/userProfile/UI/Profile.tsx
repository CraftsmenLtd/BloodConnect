import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Button } from '../../../components/button/Button'
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
  [key: string]: any;
}

const Profile: React.FC = () => {
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
        name: userDetails.name ?? ''
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
          {renderDetailRow('Date of Birth', userDetails.dateOfBirth ?? '')}
          {renderDetailRow('Age', userDetails.age.toString())}
          {renderDetailRow('Weight (kg)', userDetails.weight !== undefined ? userDetails.weight.toString() : '')}
          {renderDetailRow('Height (feet)', userDetails.height !== undefined ? userDetails.height.toString() : '')}
          {renderDetailRow('Phone', userDetails.phoneNumbers !== undefined && userDetails.phoneNumbers.length > 0 ? userDetails.phoneNumbers[0] : '')}
          {renderDetailRow('Gender', userDetails.gender, true)}
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

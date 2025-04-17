import Constants from 'expo-constants'
import React from 'react'
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import { Input } from '../../../components/inputElement/Input'
import RadioButton from '../../../components/inputElement/Radio'
import { Button } from '../../../components/button/Button'
import DateTimePickerComponent from '../../../components/inputElement/DateTimePicker'
import MapView from '../../../components/mapView'
import useMapView from '../../../components/mapView/useMapView'
import MultiSelect from '../../../components/multiSelect'
import { LocationService } from '../../../LocationService/LocationService'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import ProfileSection from '../../components/ProfileSection'
import createStyles from './createStyle'
import Warning from '../../../components/warning'
import { WARNINGS } from '../../../setup/constant/consts'
import { useEditProfile } from '../hooks/useEditProfile'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

const locationService = new LocationService(API_BASE_URL)

const EditProfile = () => {
  const styles = createStyles(useTheme())
  const {
    profileData,
    errors,
    handleInputChange,
    loading,
    isButtonDisabled,
    handleSave
  } = useEditProfile()
  const { centerCoordinate, mapMarkers, zoomLevel } = useMapView(profileData?.locations)

  return (
    <TouchableWithoutFeedback>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ProfileSection
          name={profileData.name}
          location={profileData?.location}
          isEditing={true}
        />

        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
        <View style={styles.scrollContent}>
          <View style={styles.infoContainer}>
            <View style={styles.inputFieldStyle}>
              <Input
                name="name"
                label="Name"
                value={profileData.name}
                onChangeText={handleInputChange}
                placeholder="Enter your name"
                inputStyle={styles.inputStyle}
                error={errors.name}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <DateTimePickerComponent
                label="Date of Birth"
                value={new Date(profileData.dateOfBirth)}
                onChange={(date) => handleInputChange('dateOfBirth', date)}
                isOnlyDate={true}
                inputStyle={styles.inputStyle}
                error={errors.dateOfBirth}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <Input
                name="age"
                label="Age"
                value={profileData.age.toString()}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChangeText={() => { }}
                placeholder="Enter your name"
                readOnly={true}
                inputStyle={styles.inputStyle}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <Input
                name="weight"
                label="Weight (kg)"
                value={profileData.weight.toString()}
                onChangeText={handleInputChange}
                placeholder="Enter your weight"
                keyboardType="numeric"
                inputStyle={styles.inputStyle}
                error={errors.weight}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <Input
                name="height"
                label="Height (feet)"
                value={profileData.height.toString()}
                onChangeText={handleInputChange}
                placeholder="Enter your height"
                keyboardType="numeric"
                inputStyle={styles.inputStyle}
                error={errors.height}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <Input
                name="phone"
                label="Phone"
                value={profileData.phone}
                onChangeText={handleInputChange}
                placeholder="Enter your phone number"
                keyboardType="decimal-pad"
                inputStyle={styles.inputStyle}
                error={errors.phone}
              />
              <Warning
                text={WARNINGS.PHONE_NUMBER_VISIBLE}
                showWarning={profileData.phone !== ''}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <MultiSelect
                name="locations"
                label="Select Preferred Location"
                options={[]}
                selectedValues={profileData?.locations}
                onSelect={handleInputChange}
                placeholder="Select Preferred Location"
                isRequired={false}
                enableSearch={true}
                fetchOptions={
                  async(searchText) =>
                    locationService.preferredLocationAutocomplete(searchText)
                }
                minRequiredLabel="Add minimum 1 area."
              />
              <MapView
                style={styles.mapViewContainer}
                centerCoordinate={centerCoordinate}
                zoomLevel={zoomLevel}
                markers={mapMarkers}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <DateTimePickerComponent
                label="Last Donation Date"
                value={profileData.lastDonationDate !== null && profileData.lastDonationDate !== '' ? new Date(profileData.lastDonationDate) : null}
                onChange={(date) => handleInputChange('lastDonationDate', date)}
                isOnlyDate={true}
                inputStyle={styles.inputStyle}
                error={errors.lastDonationDate}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <RadioButton
                name="gender"
                label="Gender"
                options={['female', 'male', 'other']}
                value={profileData.gender}
                onPress={handleInputChange}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              text="Save"
              loading={loading}
              onPress={handleSave}
              disabled={isButtonDisabled}
            />
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  )
}

export default EditProfile

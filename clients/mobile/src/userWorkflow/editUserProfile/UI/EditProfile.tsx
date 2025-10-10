import Constants from 'expo-constants'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import { Divider } from '../../../components/button/Divider'
import { Input } from '../../../components/inputElement/Input'
import PhoneNumberInput from '../../../components/inputElement/PhoneNumberInput'
import RadioButton from '../../../components/inputElement/Radio'
import { Button } from '../../../components/button/Button'
import DateTimePickerComponent from '../../../components/inputElement/DateTimePicker'
import MapView from '../../../components/mapView'
import useMapView from '../../../components/mapView/useMapView'
import MultiSelect from '../../../components/multiSelect'
import CustomToggle from '../../../components/toogleButton'
import { LocationService } from '../../../LocationService/LocationService'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import ProfileSection from '../../components/ProfileSection'
import createStyles from './createStyle'
import { useEditProfile } from '../hooks/useEditProfile'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

const locationService = new LocationService(API_BASE_URL)

const EditProfile = () => {
  const styles = createStyles(useTheme())
  const { t } = useTranslation()
  const {
    profileData,
    errors,
    handleInputChange,
    loading,
    isButtonDisabled,
    handleSave,
    setPendingAvailableForDonationSave
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
          age={profileData.age}
          isEditing={true}
        />

        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
        <View style={styles.scrollContent}>
          <View style={styles.infoContainer}>
            <View >
              <CustomToggle
                value={profileData.availableForDonation}
                isReadOnly={false}
                onToggle={(val) => {
                  handleInputChange('availableForDonation', val)
                  setPendingAvailableForDonationSave(true)
                }}
                direction="row"
                label={t('fromLabel.availableForDonation')}
              />
              <Divider containerStyle={styles.dividerContainer} lineStyle={styles.dividerLine} />
            </View>

            <View style={styles.inputFieldStyle}>
              <Input
                name="name"
                label={t('fromLabel.name')}
                value={profileData.name}
                onChangeText={handleInputChange}
                placeholder="Enter your name"
                inputStyle={styles.inputStyle}
                error={errors.name}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <DateTimePickerComponent
                label={t('fromLabel.dob')}
                value={new Date(profileData.dateOfBirth)}
                onChange={(date) => handleInputChange('dateOfBirth', date)}
                isOnlyDate={true}
                inputStyle={[styles.inputStyle, styles.dobMarginBottom]}
                error={errors.dateOfBirth}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <Input
                name="weight"
                label={t('fromLabel.weight')}
                value={profileData.weight?.toString() ?? ''}
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
                label={t('fromLabel.height')}
                value={profileData.height?.toString() ?? ''}
                onChangeText={handleInputChange}
                placeholder="Enter your height"
                keyboardType="numeric"
                inputStyle={styles.inputStyle}
                error={errors.height}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <PhoneNumberInput
                name='phone'
                label={t('fromLabel.phone')}
                value={profileData.phone}
                onChange={handleInputChange}
                showWarning={profileData.phone !== ''}
                isRequired={false}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <MultiSelect
                name="locations"
                label={t('fromLabel.locations')}
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
                label={t('fromLabel.lastDonationDate')}
                value={
                  profileData.lastDonationDate !== null
                  && profileData.lastDonationDate !== ''
                    ? new Date(profileData.lastDonationDate)
                    : null
                }
                onChange={(date) => handleInputChange('lastDonationDate', date)}
                isOnlyDate={true}
                inputStyle={styles.inputStyle}
                error={errors.lastDonationDate}
              />
            </View>

            <View style={styles.inputFieldStyle}>
              <RadioButton
                name="gender"
                label={t('fromLabel.gender')}
                options={['female', 'male', 'other']}
                value={profileData.gender}
                onPress={handleInputChange}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              text={t('btn.save')}
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

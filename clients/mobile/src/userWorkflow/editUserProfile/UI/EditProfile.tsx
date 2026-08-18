import Constants from 'expo-constants'
import React, { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScrollView } from 'react-native'
import { View, findNodeHandle, Alert } from 'react-native'
import { Text } from '../../../components/text/AppText'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
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
import { useProfilePictureUpload } from '../../hooks/useProfilePictureUpload'
import { calculateBMI, getBMICategory } from '../../../utility/bmi'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

const locationService = new LocationService(API_BASE_URL)

const EditProfile = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
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
  const { uploading, error: uploadError, pickAndUpload } = useProfilePictureUpload()
  const { centerCoordinate, mapMarkers, zoomLevel } = useMapView(profileData?.locations)
  const scrollRef = useRef<ScrollView>(null)
  const locationsRef = useRef<View>(null)
  const prevLocationsLength = useRef(profileData.locations?.length ?? 0)

  // Upload failures used to be set on state nobody read, so a denied permission or a failed
  // PUT looked identical to success. t() falls back to the raw string for messages that come
  // back from the API rather than as one of our keys.
  useEffect(() => {
    if (uploadError !== '') {
      Alert.alert(t('common.error'), t(uploadError))
    }
  }, [uploadError])

  useEffect(() => {
    const length = profileData.locations?.length ?? 0
    // Only scroll when a location is added (not on removal or mount).
    if (length > prevLocationsLength.current) {
      prevLocationsLength.current = length
      const timer = setTimeout(() => {
        const node = locationsRef.current
        const scroll = scrollRef.current
        if (node === null || scroll === null) return
        const scrollNode = findNodeHandle(scroll)
        if (scrollNode === null) return
        node.measureLayout(
          scrollNode,
          (_x, y) => { scroll.scrollTo({ y: Math.max(y - 20, 0), animated: true }) },
          () => { /* measure failed — skip scroll */ }
        )
      }, 250)

      return () => { clearTimeout(timer) }
    }
    prevLocationsLength.current = length
  }, [profileData.locations?.length])

  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={25}
    >
      <ProfileSection
        name={profileData.name}
        location={profileData?.location}
        age={profileData.age}
        isEditing={true}
        uploading={uploading}
        onImageUpload={() => { void pickAndUpload() }}
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

          {profileData.weight > 0 && profileData.height !== '' && (() => {
            const bmi = calculateBMI(profileData.weight, profileData.height)

            return (
              <View style={styles.inputFieldStyle}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                    BMI: {bmi} ({getBMICategory(bmi)})
                </Text>
              </View>
            )
          })()}

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

          <View ref={locationsRef} style={styles.inputFieldStyle}>
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
    </KeyboardAwareScrollView>
  )
}

export default EditProfile

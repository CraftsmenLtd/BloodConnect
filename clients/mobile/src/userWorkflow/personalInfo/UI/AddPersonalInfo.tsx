import Constants from 'expo-constants'
import React, { useRef, useEffect } from 'react'
import type { ScrollView } from 'react-native'
import {
  View,
  Text,
  StyleSheet,
  Linking
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Input } from '../../../components/inputElement/Input'
import Dropdown from '../../../components/inputElement/Dropdown'
import Checkbox from '../../../components/inputElement/Checkbox'
import { Button } from '../../../components/button/Button'
import DateTimePickerComponent from '../../../components/inputElement/DateTimePicker'
import PhoneNumberInput from '../../../components/inputElement/PhoneNumberInput'
import RadioButton from '../../../components/inputElement/Radio'
import MapView from '../../../components/mapView'
import useMapView from '../../../components/mapView/useMapView'
import CustomToggle from '../../../components/toogleButton'
import { useAddPersonalInfo } from '../hooks/useAddPersonalInfo'
import { bloodGroupOptions } from '../options'
import { calculateBMI, getBMICategory } from '../../../utility/bmi'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import type { Theme } from '../../../setup/theme'
import { LocationService } from '../../../LocationService/LocationService'
import { POLICY_URLS } from '../../../setup/constant/urls'
import MultiSelect from '../../../components/multiSelect'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

const locationService = new LocationService(API_BASE_URL)

const AddPersonalInfo = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const {
    personalInfo,
    handleInputChange,
    errors,
    isButtonDisabled,
    handleSubmit,
    loading,
    errorMessage,
    isSSO
  } = useAddPersonalInfo()
  const { centerCoordinate, mapMarkers, zoomLevel } = useMapView(personalInfo?.locations)
  const scrollRef = useRef<ScrollView>(null)
  const locationLayoutY = useRef(0)

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const openLink = (url: string) => { Linking.openURL(url).catch(() => { }) }

  useEffect(() => {
    if (personalInfo.locations.length > 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: Math.max(locationLayoutY.current - 20, 0), animated: true })
      }, 250)

      return () => { clearTimeout(timer) }
    }
  }, [personalInfo.locations.length])

  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      bottomOffset={25}
    >
      <View style={styles.fieldSpacing}>
        <Dropdown
          label='Blood Group'
          isRequired={true}
          placeholder='Select Blood Group'
          options={bloodGroupOptions}
          name='bloodGroup'
          selectedValue={personalInfo.bloodGroup}
          onChange={handleInputChange}
          error={errors.bloodGroup}
        />
      </View>

      {(Boolean(isSSO)) && (
        <View>
          <PhoneNumberInput
            name="phoneNumber"
            label="Phone Number"
            value={personalInfo.phoneNumber}
            onChange={handleInputChange}
            showWarning={personalInfo.phoneNumber !== ''}
          />
        </View>
      )}

      <View
        style={styles.fieldSpacing}
        onLayout={(event) => { locationLayoutY.current = event.nativeEvent.layout.y }}
      >
        <MultiSelect
          name='locations'
          label="Select Preferred Location"
          options={[]}
          selectedValues={personalInfo.locations}
          onSelect={handleInputChange}
          placeholder="Select Preferred Location"
          isRequired={true}
          enableSearch={true}
          fetchOptions={
            async(searchText) =>
              locationService.preferredLocationAutocomplete(searchText)
          }
          minRequiredLabel='Add minimum 1 area.'
        />
        { personalInfo.locations.length > 0 && (
          <MapView
            style={styles.mapViewContainer}
            centerCoordinate={centerCoordinate}
            zoomLevel={zoomLevel}
            markers={mapMarkers}
          />
        )}
      </View>

      <View style={styles.fieldSpacing}>
        <RadioButton
          name="gender"
          label="Gender"
          options={['female', 'male', 'other']}
          value={personalInfo.gender}
          onPress={handleInputChange}
          isRequired={true}
        />
      </View>

      <View style={styles.fieldSpacing}>
        <Input
          name="weight"
          label="Weight (kg)"
          value={personalInfo.weight?.toString() ?? ''}
          onChangeText={handleInputChange}
          placeholder="Enter your weight"
          keyboardType="numeric"
          error={errors.weight}
        />
      </View>

      <View style={styles.fieldSpacing}>
        <Input
          name="height"
          label="Height (feet)"
          value={personalInfo.height?.toString() ?? ''}
          onChangeText={handleInputChange}
          placeholder="Enter your height"
          keyboardType="numeric"
          error={errors.height}
        />
      </View>

      {personalInfo.weight && personalInfo.height
        ? (() => {
          const weight = parseFloat(personalInfo.weight)
          const height = parseFloat(personalInfo.height)

          if (!isNaN(weight) && !isNaN(height) && weight > 0 && height > 0) {
            const bmi = calculateBMI(weight, height)

            return (
              <View style={styles.fieldSpacing}>
                <Text style={styles.bmiText}>BMI: {bmi} ({getBMICategory(bmi)})</Text>
              </View>
            )
          }

          return null
        })()
        : null}

      <View style={styles.fieldSpacing}>
        <DateTimePickerComponent
          isOnlyDate={true}
          label="Date of Birth"
          value={new Date(personalInfo.dateOfBirth)}
          onChange={(date) => handleInputChange('dateOfBirth', date)}
          isRequired={true}
          error={errors.dateOfBirth}
        />
      </View>

      <View style={[styles.fieldSpacing, styles.extraTopMargin, styles.extraBottomMargin]}>
        <CustomToggle
          value={personalInfo.availableForDonation}
          label={'Are you available for a donation?'}
          isReadOnly={false}
          onToggle={(val) => {
            handleInputChange('availableForDonation', val)
          }}
          direction="row"
          isRequired={true}
        />
      </View>

      <View style={[styles.fieldSpacing, { flexDirection: 'row', alignItems: 'center' }]}>
        <Checkbox
          name='acceptPolicy'
          isChecked={personalInfo.acceptPolicy}
          checkboxColor={theme.colors.primary}
          onCheckboxChange={handleInputChange}
        >
          <Text style={[styles.termsText, { flex: 1 }]}>
              By continuing, you agree to our
            <Text style={styles.space}> </Text>
            <Text
              style={styles.linkText}
              onPress={() => { openLink(POLICY_URLS.TERMS_OF_SERVICE) }}
            >
                Terms of Service
            </Text>
            <Text style={styles.space}> </Text>
              and
            <Text style={styles.space}> </Text>
            <Text
              style={styles.linkText}
              onPress={() => { openLink(POLICY_URLS.PRIVACY_POLICY) }}
            >
                Privacy Policy
            </Text>.
          </Text>
        </Checkbox>
      </View>

      {errorMessage !== '' && (
        <View style={styles.fieldSpacing}>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          text='Save & Continue'
          disabled={isButtonDisabled}
          loading={loading}
          onPress={handleSubmit}
          buttonStyle={styles.submitButton}
        />
      </View>
    </KeyboardAwareScrollView>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: theme.colors.white
  },
  fieldSpacing: {
    marginBottom: 0
  },
  reducedSpacing: {
    marginTop: 12,
    marginBottom: -6
  },
  extraBottomMargin: {
    marginBottom: 12
  },
  extraTopMargin: {
    marginTop: 10
  },
  termsText: {
    fontSize: theme.typography.fontSize,
    color: theme.colors.textPrimary,
    textAlign: 'left'
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline'
  },
  space: {
    padding: 16
  },
  bmiText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    paddingVertical: 4
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    padding: 8,
    borderRadius: 6
  },
  buttonContainer: {
    paddingHorizontal: 8
  },
  submitButton: {
    marginTop: 15,
    paddingVertical: 16
  },
  mapViewContainer: {
    borderRadius: 6,
    borderWidth: 1.5,
    marginBottom: 15
  }
})

export default AddPersonalInfo

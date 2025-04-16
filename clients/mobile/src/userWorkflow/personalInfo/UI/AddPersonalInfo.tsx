import Constants from 'expo-constants'
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableWithoutFeedback, Linking } from 'react-native'
import Dropdown from '../../../components/inputElement/Dropdown'
import Checkbox from '../../../components/inputElement/Checkbox'
import { Button } from '../../../components/button/Button'
import DateTimePickerComponent from '../../../components/inputElement/DateTimePicker'
import MapView from '../../../components/mapView'
import useMapView from '../../../components/mapView/useMapView'
import { useAddPersonalInfo } from '../hooks/useAddPersonalInfo'
import { bloodGroupOptions, genderOptions } from '../options'
import { Input } from '../../../components/inputElement/Input'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import type { Theme } from '../../../setup/theme'
import RadioButton from '../../../components/inputElement/Radio'
import { LocationService } from '../../../LocationService/LocationService'
import Warning from '../../../components/warning'
import { WARNINGS } from '../../../setup/constant/consts'
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
  const { mapMarkers, zoomLevel } = useMapView(personalInfo?.locations)

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const openLink = (url: string) => { Linking.openURL(url).catch(() => { }) }

  return (
    <TouchableWithoutFeedback>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
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
            <Input
              name="phoneNumber"
              label="Phone Number"
              value={personalInfo.phoneNumber}
              onChangeText={handleInputChange}
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
              isRequired={true}
              error={errors.phoneNumber}
            />
            <Warning
              text={WARNINGS.PHONE_NUMBER_VISIBLE}
              showWarning={Boolean(personalInfo.phoneNumber?.trim())}
            />
          </View>
        )}

        <View style={styles.fieldSpacing}>
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
              centerCoordinate={mapMarkers.length > 0 ? mapMarkers[0].coordinate : [90.4125, 23.8103]}
              zoomLevel={zoomLevel}
              markers={mapMarkers}
            />
          )}
        </View>

        <View style={styles.fieldSpacing}>
          <Dropdown
            label='Gender'
            isRequired={true}
            placeholder='Select Gender'
            options={genderOptions}
            name='gender'
            selectedValue={personalInfo.gender}
            onChange={handleInputChange}
            error={errors.gender}
          />
        </View>

        <View style={styles.fieldSpacing}>
          <Input
            name="height"
            label="Height"
            value={personalInfo.height}
            onChangeText={handleInputChange}
            placeholder="Enter height in feet (e.g., 5.8)"
            keyboardType="numeric"
            isRequired={true}
            error={errors.height}
          />
        </View>

        <View style={styles.fieldSpacing}>
          <Input
            name="weight"
            label="Weight"
            value={personalInfo.weight}
            onChangeText={handleInputChange}
            placeholder="Enter weight in kg (e.g., 70)"
            keyboardType="numeric"
            isRequired={true}
            error={errors.weight}
          />
        </View>

        <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
          <DateTimePickerComponent
            isOnlyDate={true}
            label="Date of Birth"
            value={new Date(personalInfo.dateOfBirth)}
            onChange={(date) => handleInputChange('dateOfBirth', date)}
            isRequired={true}
            error={errors.dateOfBirth}
          />
        </View>

        <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
          <DateTimePickerComponent
            isOnlyDate={true}
            label="Last Donation Date"
            value={personalInfo.lastDonationDate !== null ? new Date(personalInfo.lastDonationDate) : null}
            onChange={(date) => handleInputChange('lastDonationDate', date)}
            error={errors.lastDonationDate}
          />
        </View>

        <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
          <DateTimePickerComponent
            isOnlyDate={true}
            label="Last Vaccinated Date"
            value={personalInfo.lastVaccinatedDate !== null ? new Date(personalInfo.lastVaccinatedDate) : null}
            onChange={(date) => handleInputChange('lastVaccinatedDate', date)}
            error={errors.lastVaccinatedDate}
          />
        </View>

        <View style={[styles.fieldSpacing, styles.extraBottomMargin, styles.extraTopMargin]}>
          <RadioButton
            name='availableForDonation'
            options={['yes', 'no']}
            value={personalInfo.availableForDonation}
            onPress={handleInputChange}
            label="Available For Donation"
            isRequired={true}
            extraInfo='Choose "Yes" if you are prepared to donate blood.'
            error={errors.availableForDonation}
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
      </ScrollView>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: theme.colors.white
  },
  fieldSpacing: {
    marginBottom: 7
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
    borderWidth: 1.5
  }
})

export default AddPersonalInfo

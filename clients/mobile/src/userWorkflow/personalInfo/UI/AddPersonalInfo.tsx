import React from 'react'
import Constants from 'expo-constants'
import { View, Text, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native'
import Dropdown from '../../../components/inputElement/Dropdown'
import Checkbox from '../../../components/inputElement/Checkbox'
import { Button } from '../../../components/button/Button'
import DateTimePickerComponent from '../../../components/inputElement/DateTimePicker'
import { useAddPersonalInfo } from '../hooks/useAddPersonalInfo'
import { bloodGroupOptions, districts, genderOptions } from '../options'
import { Input } from '../../../components/inputElement/Input'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'
import RadioButton from '../../../components/inputElement/Radio'
import SearchMultiSelect from '../../../components/inputElement/SearchMultiSelect'
import { LocationService } from '../../../LocationService/LocationService'

const { GOOGLE_MAP_API } = Constants.expoConfig?.extra ?? {}

const locationService = new LocationService(GOOGLE_MAP_API)

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
    isVisible,
    setIsVisible
  } = useAddPersonalInfo()

  return (
    <TouchableWithoutFeedback onPress={() => { setIsVisible('') }}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
            <Dropdown
              label='Blood Group'
              isRequired={true}
              placeholder='Select blood group'
              options={bloodGroupOptions}
              name='bloodGroup'
              selectedValue={personalInfo.bloodGroup}
              onChange={handleInputChange}
              error={errors.bloodGroup}
            />
          </View>

          <View style={styles.fieldSpacing}>
            <Dropdown
              label='Preferred District for Donating Blood'
              isRequired={true}
              placeholder='Select city'
              options={districts}
              name='city'
              selectedValue={personalInfo.city}
              onChange={handleInputChange}
              error={errors.city}
            />
          </View>

          <View style={styles.fieldSpacing}>
            <SearchMultiSelect
              name="locations"
              label="Search Location"
              isVisible={isVisible}
              setIsVisible={setIsVisible}
              onChange={handleInputChange}
              editable={personalInfo.city.length > 0}
              error={errors.locations}
              multiSelect={true}
              isRequired={true}
              fetchOptions={async(searchText) => locationService.preferredLocationAutocomplete(searchText, personalInfo.city)}
              extraInfo='Add minimum 1 area.'
            />
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
              name='lastDonationDate'
              isOnlyDate={true}
              label="Last donation date"
              value={new Date(personalInfo.lastDonationDate)}
              onChange={(date) => handleInputChange('lastDonationDate', date)}
              isRequired={true}
              error={errors.lastDonationDate}
            />
          </View>

          <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
            <DateTimePickerComponent
              name='dateOfBirth'
              isOnlyDate={true}
              label="Date of birth"
              value={new Date(personalInfo.dateOfBirth)}
              onChange={(date) => handleInputChange('dateOfBirth', date)}
              isRequired={true}
              error={errors.dateOfBirth}
            />
          </View>

          <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
            <DateTimePickerComponent
              name='lastVaccinatedDate'
              isOnlyDate={true}
              label="Last vaccinated date"
              value={new Date(personalInfo.lastVaccinatedDate)}
              onChange={(date) => handleInputChange('lastVaccinatedDate', date)}
              isRequired={true}
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

          <View
            style={styles.fieldSpacing}>
            <Checkbox
              name='acceptPolicy'
              isChecked={personalInfo.acceptPolicy}
              checkboxColor={theme.colors.primary}
              onCheckboxChange={handleInputChange}
            >
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.link}>Terms of Service</Text>{' '}
                and{' '}
                <Text style={styles.link}>Privacy Policy</Text>
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
      </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
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
    flexWrap: 'wrap',
    flex: 1,
    color: theme.colors.textPrimary
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline'
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#FFF3F3',
    borderRadius: 6
  },
  buttonContainer: {
    paddingHorizontal: 8
  },
  submitButton: {
    marginTop: 15,
    paddingVertical: 16
  }
})

export default AddPersonalInfo

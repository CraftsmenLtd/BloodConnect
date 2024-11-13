import React from 'react'
import Constants from 'expo-constants'
import { View, Text, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native'
import Dropdown from '../../../components/inputElement/Dropdown'
import TermsAndPrivacy from '../../../components/inputElement/Checkbox'
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
        <ScrollView showsVerticalScrollIndicator={false}>
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
          <Dropdown
            label='Preferred area for donating blood'
            isRequired={true}
            placeholder='Select city'
            options={districts}
            name='city'
            selectedValue={personalInfo.city}
            onChange={handleInputChange}
            error={errors.city}
          />
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
            fetchOptions={async(searchText) => locationService.preferedLocationAutocomplete(searchText, personalInfo.city)}
            extraInfo='Add minimim 1 area.'
          />
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
          <DateTimePickerComponent
            name='lastDonationDate'
            isOnlyDate={true}
            label="Last donation date"
            value={new Date(personalInfo.lastDonationDate)}
            onChange={(date) => handleInputChange('lastDonationDate', date)}
            isRequired={true}
            error={errors.lastDonationDate}
          />
          <DateTimePickerComponent
            name='dateOfBirth'
            isOnlyDate={true}
            label="Date of birth"
            value={new Date(personalInfo.dateOfBirth)}
            onChange={(date) => handleInputChange('dateOfBirth', date)}
            isRequired={true}
            error={errors.dateOfBirth}
          />
          <DateTimePickerComponent
            name='lastVaccinatedDate'
            isOnlyDate={true}
            label="Last vaccinated date"
            value={new Date(personalInfo.lastVaccinatedDate)}
            onChange={(date) => handleInputChange('lastVaccinatedDate', date)}
            isRequired={true}
            error={errors.lastVaccinatedDate}
          />
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
          <TermsAndPrivacy
            name='acceptPolicy'
            isChecked={personalInfo.acceptPolicy}
            checkboxColor={theme.colors.primary}
            onCheckboxChange={handleInputChange}>
            <Text style={styles.text}>
              By continuing, you accept our terms and policies.
            </Text>
          </TermsAndPrivacy>
          {errorMessage !== '' && <Text style={{ color: 'red' }}>{errorMessage}</Text>}
          <Button text='Save & Continue' disabled={isButtonDisabled} loading={loading} onPress={handleSubmit} />
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: theme.colors.white
  },
  checkboxContainer: {
    marginRight: 10
  },
  text: {
    fontSize: theme.typography.fontSize,
    flexWrap: 'wrap',
    flex: 1
  },
  link: {
    textDecorationLine: 'underline',
    color: theme.colors.primary
  }
})

export default AddPersonalInfo

import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import Dropdown from '../../../components/inputElement/Dropdown'
import MultiSelectDropdown from '../../../components/inputElement/MultiSelectDropdown'
import TermsAndPrivacy from '../../../components/inputElement/Checkbox'
import { Button } from '../../../components/button/Button'
import DateTimePickerComponent from '../../../components/inputElement/DateTimePicker'
import { useAddPersonalInfo } from '../hooks/useAddPersonalInfo'
import { bloodGroupOptions, districts, genderOptions } from '../options'
import { Input } from '../../../components/inputElement/Input'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'
import RadioButton from '../../../components/inputElement/Radio'

const AddPersonalInfo = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { personalInfo, handleInputChange, errors, isButtonDisabled, handleSubmit, loading, errorMessage } = useAddPersonalInfo()

  return (
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
        <View style={{ marginTop: -24, marginBottom: 12 }}>
          <MultiSelectDropdown
            label=''
            isRequired={false}
            placeholder={`Select area (${personalInfo.locations.length})`}
            options={districts}
            name='locations'
            selectedValue={personalInfo.locations}
            onChange={handleInputChange}
            error={errors.locations}
            extraInfo='Add minimim 1 area.'
          />
        </View>

        <DateTimePickerComponent
          name='lastDonationDate'
          isOnlyDate={true}
          label="Last donation date"
          value={new Date(personalInfo.lastDonationDate)}
          onChange={(date) => handleInputChange('lastDonationDate', date)}
          isRequired={true}
        />
        <DateTimePickerComponent
          name='dateOfBirth'
          isOnlyDate={true}
          label="Date of birth"
          value={new Date(personalInfo.dateOfBirth)}
          onChange={(date) => handleInputChange('dateOfBirth', date)}
          isRequired={true}
        />
        <DateTimePickerComponent
          name='lastVaccinatedDate'
          isOnlyDate={true}
          label="Last vaccinated date"
          value={new Date(personalInfo.lastVaccinatedDate)}
          onChange={(date) => handleInputChange('lastVaccinatedDate', date)}
          isRequired={true}
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
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    padding: 10
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

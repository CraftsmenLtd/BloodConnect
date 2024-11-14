import React, { useState } from 'react'
import Constants from 'expo-constants'
import { Text, StyleSheet, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import RadioButton from '../../components/inputElement/Radio'
import { TextArea } from '../../components/inputElement/TextArea'
import { Input } from '../../components/inputElement/Input'
import { Button } from '../../components/button/Button'
import { DONATION_DATE_TIME_INPUT_NAME, useBloodRequest } from './useBloodRequest'
// import { CustomDropdown } from '../../components/inputElement/CustomDropdown'
import { bloodGroupOptions, bloodBagOptions, transportationOptions } from './donationOption'
import DateTimePickerComponent from '../../components/inputElement/DateTimePicker'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import SearchMultiSelect from '../../components/inputElement/SearchMultiSelect'
import { LocationService } from '../../LocationService/LocationService'
import { districts } from '../../userWorkflow/personalInfo/options'
import Dropdown from '../../components/inputElement/Dropdown'
const { GOOGLE_MAP_API } = Constants.expoConfig?.extra ?? {}

const locationService = new LocationService(GOOGLE_MAP_API)

const CreateBloodRequest = () => {
  const styles = createStyles(useTheme())
  const [isVisible, setIsVisible] = useState<string>('')
  const {
    isUpdating,
    errors,
    isButtonDisabled,
    bloodRequestData,
    handleInputChange,
    handlePostNow,
    loading,
    errorMessage
  } = useBloodRequest()

  return (
    <TouchableWithoutFeedback onPress={() => { setIsVisible('') }}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <RadioButton
            name='urgencyLevel'
            options={['regular', 'urgent']}
            value={bloodRequestData.urgencyLevel}
            onPress={handleInputChange}
            label="Urgency"
            isRequired={true}
            extraInfo='Select "urgent" if the blood is needed on the same day'
          />

          <Dropdown
            label='Blood Group'
            isRequired={true}
            placeholder='Select Blood Group'
            options={bloodGroupOptions}
            readonly={isUpdating}
            name='neededBloodGroup'
            selectedValue={bloodRequestData.neededBloodGroup}
            onChange={handleInputChange}
            error={errors.neededBloodGroup}
          />

          <Dropdown
            label='Unit'
            isRequired={true}
            placeholder='Select Unit'
            options={bloodBagOptions}
            name='bloodQuantity'
            selectedValue={bloodRequestData.bloodQuantity}
            onChange={handleInputChange}
            error={errors.bloodQuantity}
          />

          <DateTimePickerComponent
            name={DONATION_DATE_TIME_INPUT_NAME}
            label="Time and Date"
            value={new Date(bloodRequestData.donationDateTime)}
            onChange={(date) => handleInputChange(DONATION_DATE_TIME_INPUT_NAME, date)}
            error={errors.donationDateTime}
            isRequired={true}
            isOnlyDate={false}
          />

          <Dropdown
            label='Select City'
            isRequired={true}
            placeholder='Select City'
            options={districts}
            readonly={isUpdating}
            name='city'
            selectedValue={bloodRequestData.city}
            onChange={handleInputChange}
            error={errors.city}
          />

          <SearchMultiSelect
            name="location"
            label="Donation Point"
            isVisible={isVisible}
            setIsVisible={setIsVisible}
            onChange={handleInputChange}
            initialValue={bloodRequestData.location}
            editable={isUpdating !== true}
            error={errors.location}
            multiSelect={false}
            isRequired={true}
            fetchOptions={async(searchText) => locationService.healthLocationAutocomplete(searchText)}
          />

          <Input
            name="contactNumber"
            label="Contact Number"
            value={bloodRequestData.contactNumber}
            onChangeText={handleInputChange}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
            error={errors.contactNumber}
            isRequired={true}
          />

          <Input
            name="patientName"
            label="Name of the Patient"
            value={bloodRequestData.patientName}
            onChangeText={handleInputChange}
            placeholder="Enter patient's name"
            keyboardType="twitter"
            error=''
          />

          <TextArea
            name='shortDescription'
            placeholder="Write a short description"
            label='Short Description of the Problem'
            value={bloodRequestData.shortDescription}
            error={null}
            onChangeText={handleInputChange}
            maxLength={200}
          />

          <Dropdown
            label='Transportation Facility for the Donor'
            isRequired={false}
            placeholder='Select Transportation Option'
            options={transportationOptions}
            name='transportationInfo'
            selectedValue={bloodRequestData.transportationInfo}
            onChange={handleInputChange}
            error={null}
          />

          {errorMessage !== '' && <Text style={{ color: 'red', textAlign: 'center', marginBottom: 12 }}>{errorMessage}</Text>}
          <Button text={isUpdating === true ? 'Update Post' : 'Post Now'} onPress={handlePostNow} disabled={isButtonDisabled} loading={loading} />
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: theme.colors.white
  }
})

export default CreateBloodRequest

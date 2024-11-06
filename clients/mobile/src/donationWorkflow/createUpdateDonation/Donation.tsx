import React, { useState } from 'react'
import { Text, StyleSheet, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import RadioButton from '../../components/inputElement/Radio'
import { TextArea } from '../../components/inputElement/TextArea'
import { Input } from '../../components/inputElement/Input'
import { Button } from '../../components/button/Button'
import { DONATION_DATE_TIME_INPUT_NAME, useBloodRequest } from './useBloodRequest'
import { CustomDropdown } from '../../components/inputElement/CustomDropdown'
import { bloodGroupOptions, bloodBagOptions, transportationOptions } from './donationOption'
import DateTimePickerComponent from '../../components/inputElement/DateTimePicker'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'

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
            extraInfo='Select “urgent” if the blood is needed on the same day'
          />
          <CustomDropdown
            placeholder=''
            label='Blood Group'
            options={bloodGroupOptions}
            name='neededBloodGroup'
            value={bloodRequestData.neededBloodGroup}
            onChangeText={handleInputChange}
            isVisible={isVisible}
            setIsVisible={setIsVisible}
            error={errors.neededBloodGroup}
            isRequired={true}
            readOnly={isUpdating}
          />

          <CustomDropdown
            placeholder=''
            name='bloodQuantity'
            label='Unit'
            value={bloodRequestData.bloodQuantity}
            onChangeText={handleInputChange}
            options={bloodBagOptions}
            isVisible={isVisible}
            setIsVisible={setIsVisible}
            error={errors.bloodQuantity}
            isRequired={true}
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
          <Input
            name="location"
            label="Location"
            value={bloodRequestData.location}
            onChangeText={handleInputChange}
            placeholder="Search Location"
            keyboardType='default'
            error={errors.location}
            isRequired={true}
            readOnly={isUpdating}
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

          <CustomDropdown
            placeholder=''
            name='transportationInfo'
            label='Transportation Facility for the Donor'
            value={bloodRequestData.transportationInfo}
            onChangeText={handleInputChange}
            options={transportationOptions}
            isVisible={isVisible}
            setIsVisible={setIsVisible}
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

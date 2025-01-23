import React, { useState } from 'react'
import Constants from 'expo-constants'
import { ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import RadioButton from '../../components/inputElement/Radio'
import { TextArea } from '../../components/inputElement/TextArea'
import { Input } from '../../components/inputElement/Input'
import { Button } from '../../components/button/Button'
import Warning from '../../components/warning'
import { WARNINGS } from '../../setup/constant/consts'
import { DONATION_DATE_TIME_INPUT_NAME, SHORT_DESCRIPTION_MAX_LENGTH, useBloodRequest } from './useBloodRequest'
import { bloodBagOptions, bloodGroupOptions, transportationOptions } from './donationOption'
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
    <TouchableWithoutFeedback>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <RadioButton
            name='urgencyLevel'
            options={['regular', 'urgent']}
            value={bloodRequestData.urgencyLevel}
            onPress={handleInputChange}
            label="Urgency"
            isRequired={true}
            extraInfo='Select "urgent" if the blood is needed on the same day'
          />

          <View style={styles.fieldSpacing}>
            <Dropdown
              label='Blood Group'
              isRequired={true}
              placeholder='Select Blood Group'
              options={bloodGroupOptions}
              readonly={isUpdating}
              name='requestedBloodGroup'
              selectedValue={bloodRequestData.requestedBloodGroup}
              onChange={handleInputChange}
              error={errors.requestedBloodGroup}
            />
          </View>

          <View style={styles.fieldSpacing}>
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
          </View>

          <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
            <DateTimePickerComponent
              label="Donation Date and Time"
              value={new Date(bloodRequestData.donationDateTime)}
              onChange={(date) => handleInputChange(DONATION_DATE_TIME_INPUT_NAME, date)}
              error={errors.donationDateTime}
              isRequired={true}
              isOnlyDate={false}
            />
          </View>

          <View style={[styles.fieldSpacing]}>
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
              allowSearch={true}
            />
          </View>

          <View style={[styles.fieldSpacing, styles.extraBottomMargin]}>
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
          </View>

          <View style={styles.fieldSpacing}>
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
            <Warning
              text={WARNINGS.PHONE_NUMBER_VISIBLE}
              showWarning={bloodRequestData.contactNumber !== ''}
            />
          </View>

          <View style={[styles.fieldSpacing, styles.reducedSpacing]}>
            <Input
              name="patientName"
              label="Name of the Patient"
              value={bloodRequestData.patientName}
              onChangeText={handleInputChange}
              placeholder="Enter patient's name"
              keyboardType="twitter"
              error=''
            />
          </View>

          <View style={styles.fieldSpacing}>
            <TextArea
              name='shortDescription'
              placeholder="Write a short description"
              label='Short Description of the Problem'
              value={bloodRequestData.shortDescription}
              error={errors.shortDescription}
              onChangeText={handleInputChange}
              maxLength={SHORT_DESCRIPTION_MAX_LENGTH}
            />
          </View>

          <View style={styles.fieldSpacing}>
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
          </View>

          {errorMessage !== '' &&
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          }

          <View style={styles.buttonContainer}>
            <Button
              text={isUpdating === true ? 'Update Post' : 'Post Now'}
              onPress={handlePostNow}
              disabled={isButtonDisabled}
              loading={loading}
            />
          </View>
        </ScrollView>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  scrollContent: {
    flexGrow: 1,
    padding: 18,
    backgroundColor: theme.colors.white
  },
  fieldSpacing: {
    marginTop: 5
  },
  reducedSpacing: {
    marginTop: 12,
    marginBottom: -6
  },
  extraBottomMargin: {
    marginBottom: 12
  },
  buttonContainer: {
    marginTop: 28,
    marginBottom: 16
  },
  errorMessage: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: theme.typography.fontSize
  }
})

export default CreateBloodRequest

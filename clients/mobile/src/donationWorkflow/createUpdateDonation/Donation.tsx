import React, { useState } from 'react'
import Constants from 'expo-constants'
import { ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import PhoneNumberInput from '../../components/inputElement/PhoneNumberInput'
import RadioButton from '../../components/inputElement/Radio'
import { TextArea } from '../../components/inputElement/TextArea'
import { Input } from '../../components/inputElement/Input'
import { Button } from '../../components/button/Button'
import MapView from '../../components/mapView'
import useMapView from '../../components/mapView/useMapView'
import { SHORT_DESCRIPTION_MAX_LENGTH } from '../../setup/constant/consts'
import { DONATION_DATE_TIME_INPUT_NAME, useBloodRequest } from './useBloodRequest'
import { bloodBagOptions, bloodGroupOptions, transportationOptions } from './donationOption'
import DateTimePickerComponent from '../../components/inputElement/DateTimePicker'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import SearchMultiSelect from '../../components/inputElement/SearchMultiSelect'
import { LocationService } from '../../LocationService/LocationService'
import Dropdown from '../../components/inputElement/Dropdown'

const { API_BASE_URL } = Constants.expoConfig?.extra ?? {}

const locationService = new LocationService(API_BASE_URL)

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
  const { centerCoordinate, mapMarkers, zoomLevel } = useMapView([bloodRequestData.location])

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
          extraInfo='Select "urgent" if the blood is needed within 24 hours.'
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
            fetchOptions={async(searchText) =>
              locationService.healthLocationAutocomplete(searchText)
            }
          />
          { bloodRequestData.location !== '' && (
            <MapView
              style={styles.mapViewContainer}
              centerCoordinate={centerCoordinate}
              zoomLevel={zoomLevel}
              markers={mapMarkers}
            />
          )}
        </View>

        <View style={styles.fieldSpacing}>
          <PhoneNumberInput
            value={bloodRequestData.contactNumber}
            onChange={handleInputChange}
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
            text={isUpdating === true ? 'Update Request' : 'Request Now'}
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
  },
  mapViewContainer: {
    borderRadius: 6,
    borderWidth: 1.5
  }
})

export default CreateBloodRequest

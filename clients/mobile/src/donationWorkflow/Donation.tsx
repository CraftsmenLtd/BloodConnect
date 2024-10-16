import React, { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import RadioButton from '../components/inputElement/Radio'
import { TextArea } from '../components/inputElement/TextArea'
import { Input } from '../components/inputElement/Input'
import { Button } from '../components/button/Button'
import { useBloodRequest } from './useBloodRequest'
import { CustomDropdown } from '../components/inputElement/CustomDropdown'
import { bloodGroupOptions, bloodBagOptions, transportationOptions } from './donationOption'

const CreateBloodRequest = () => {
  const [isVisible, setIsVisible] = useState<string>('')
  const [isPickingTime, setIsPickingTime] = useState<boolean>(false)
  const {
    errors,
    showDatePicker,
    setShowDatePicker,
    isButtonDisabled,
    bloodRequestData,
    handleInputChange,
    handlePostNow
  } = useBloodRequest()

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false)
      setIsPickingTime(false)
      return
    }

    if (selectedDate !== undefined) {
      if (!isPickingTime) {
        handleInputChange('donationDateTime', selectedDate)
        setShowDatePicker(false)
        setIsPickingTime(true)
        setTimeout(() => setShowDatePicker(true), 500)
      } else {
        const currentDate = bloodRequestData.donationDateTime ?? new Date()
        const selectedTime = selectedDate

        const combinedDateTime = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          selectedTime.getHours(),
          selectedTime.getMinutes()
        )

        handleInputChange('donationDateTime', combinedDateTime)
        setShowDatePicker(false)
        setIsPickingTime(false)
      }
    } else {
      setShowDatePicker(false)
      setIsPickingTime(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={() => { setIsVisible('') }}>
      <View>
        <ScrollView contentContainerStyle={styles.container}>
          <RadioButton
            name='urgencyLevel'
            options={['regular', 'urgent']}
            value={bloodRequestData.urgencyLevel}
            onPress={handleInputChange}
            label="Urgency"
            isRequired={true}
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
          <View style={{ marginVertical: 4 }}>
            <Text style={styles.label}>Time and Date <Text style={styles.asterisk}> *</Text></Text>
            <TouchableOpacity onPress={() => { setShowDatePicker(true) }} style={styles.datePicker}>
              <Text>{bloodRequestData.donationDateTime !== null ? bloodRequestData.donationDateTime.toLocaleString() : 'Select Date & Time'}</Text>
            </TouchableOpacity>
            {showDatePicker === true && (
              <DateTimePicker
                value={bloodRequestData.donationDateTime ?? new Date()}
                mode={isPickingTime ? 'time' : 'date'}
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
          <Input
            name="location"
            label="Location"
            value={bloodRequestData.location}
            onChangeText={handleInputChange}
            placeholder="Search Location"
            keyboardType='default'
            error={errors.location}
            isRequired={true}
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

          <Button text='Post Now' onPress={handlePostNow} disabled={isButtonDisabled} />
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  label: {
    fontSize: 16
  },
  datePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 4
  },
  asterisk: {
    color: 'red'
  }
})

export default CreateBloodRequest

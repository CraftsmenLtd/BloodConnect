import React, { useState } from 'react'
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { formatteDate } from '../../utility/formatte'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'

interface DateTimePickerComponentProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  error?: string | null;
  isRequired?: boolean;
}

const DateTimePickerComponent: React.FC<DateTimePickerComponentProps> = ({ label, value, onChange, showDatePicker, setShowDatePicker, error, isRequired = false }) => {
  const styles = createStyles(useTheme())
  const [isPickingTime, setIsPickingTime] = useState<boolean>(false)
  console.log('value', value)
  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false)
      setIsPickingTime(false)
      return
    }

    if (selectedDate !== undefined) {
      if (!isPickingTime) {
        setShowDatePicker(false)
        setIsPickingTime(prevState => !prevState)
        setTimeout(() => { setShowDatePicker(true) }, 20)
        onChange(new Date(selectedDate.toISOString()))
      } else {
        const currentDate = value ?? new Date()
        const selectedTime = selectedDate

        const combinedDateTime = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          selectedTime.getHours(),
          selectedTime.getMinutes()
        )

        setShowDatePicker(false)
        setIsPickingTime(false)
        onChange(new Date(combinedDateTime.toISOString()))
      }
    } else {
      setShowDatePicker(false)
      setIsPickingTime(false)
    }
  }

  return (
    <View style={{ marginVertical: 4 }}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={styles.asterisk}>*</Text>}
      </Text>
      <TouchableOpacity onPress={() => { setShowDatePicker(true) }} style={styles.datePicker}>
        <Text>{value !== null ? formatteDate(value) : 'Select Date & Time'}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={isPickingTime ? 'time' : 'date'}
          display="default"
          onChange={handleDateChange}
          timeZoneName=''
        />
      )}
      {error !== null && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  datePicker: {
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    padding: 12,
    borderRadius: 4
  }
})

export default DateTimePickerComponent

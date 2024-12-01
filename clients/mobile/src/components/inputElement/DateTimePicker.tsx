import React, { useState } from 'react'
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { formattedDate } from '../../utility/formatting'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'

interface DateTimePickerComponentProps {
  name: string;
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string | null;
  isRequired?: boolean;
  isOnlyDate: boolean;
}

const DateTimePickerComponent: React.FC<DateTimePickerComponentProps> = ({
  name, label, value, onChange, error, isOnlyDate, isRequired = false
}) => {
  const styles = createStyles(useTheme())
  const [isPickingTime, setIsPickingTime] = useState<boolean>(false)
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false)
      setIsPickingTime(false)
      return
    }

    if (selectedDate !== undefined) {
      if (!isPickingTime) {
        setShowDatePicker(false)
        if (!isOnlyDate) {
          setIsPickingTime(prevState => !prevState)
          setTimeout(() => { setShowDatePicker(true) }, 20)
        }
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
        <Text>{value !== null ? formattedDate(value) : 'Select Date & Time'}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={!isOnlyDate && isPickingTime ? 'time' : 'date'}
          display="default"
          onChange={handleDateChange}
          timeZoneName=''
        />
      )}
      {error !== null && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

export default DateTimePickerComponent

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  datePicker: {
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    padding: 12,
    borderRadius: 4
  }
})

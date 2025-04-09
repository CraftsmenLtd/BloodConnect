import React, { useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { formattedDate } from '../../utility/formatting'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'
import { MaterialCommunityIcons } from '@expo/vector-icons'

type DateTimePickerComponentProps = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string | null;
  isRequired?: boolean;
  isOnlyDate: boolean;
  inputStyle?: StyleProp<ViewStyle>;
}

const DateTimePickerComponent: React.FC<DateTimePickerComponentProps> = ({
  label, value, onChange, error, isOnlyDate, isRequired = false, inputStyle
}) => {
  const styles = createStyles(useTheme())
  const [isPickingTime, setIsPickingTime] = useState<boolean>(false)
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)

  const handleDateChange = (event: unknown, selectedDate: Date | undefined) => {
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
      <TouchableOpacity onPress={() => { setShowDatePicker(true) }} style={[styles.datePicker, inputStyle]}>
      <Text>
        {value !== null
          ? formattedDate(value, isOnlyDate)
          : isOnlyDate
            ? 'Select Date'
            : 'Select Date & Time'}
      </Text>
      <MaterialCommunityIcons
          name="calendar-range"
          size={24}
          style={styles.iconStyle}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    padding: 12,
    borderRadius: 4
  },
  iconStyle: {
    color: theme.colors.primary
  }
})

import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Keyboard, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { Option } from './types'
import { commonStyles } from './commonStyles'

interface MultiSelectProps {
  name: string;
  label: string;
  isVisible: string;
  setIsVisible: (name: string) => void;
  error?: string | null;
  isRequired?: boolean;
  editable?: boolean;
  options?: Array<{ label: string; value: string }>;
  onChange: (name: string | undefined, text: string[] | string) => void;
  fetchOptions?: (searchText: string) => Promise<Array<{ label: string; value: string }>>;
  multiSelect?: boolean;
  extraInfo?: string;
  initialValue?: string;
}

const SearchMultiSelect = ({ name, label, isVisible, setIsVisible, error, onChange, editable = true, isRequired = false, options: initialOptions = [], fetchOptions, multiSelect = false, extraInfo = '', initialValue = '' }: MultiSelectProps) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const [value, setValue] = useState(initialValue)
  const [selectedValues, setSelectedValues] = useState<Option[]>([])
  const [options, setOptions] = useState<Option[]>(initialOptions)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (initialOptions.length > 0) {
      setOptions(initialOptions)
    }
  }, [initialOptions])

  const handleInputChange = (text: string) => {
    setValue(text)
    if (!multiSelect) {
      onChange(name, text)
    }
    setIsVisible(name)
    if (fetchOptions !== null && fetchOptions !== undefined) {
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        fetchOptions(text).then((newOptions) => { setOptions(newOptions) }).catch(error => {
          setOptions([])
          console.error(error)
        })
      }, 500)
    } else {
      const filteredOptions = initialOptions.filter((option) =>
        option.value.toLowerCase().includes(text.toLowerCase())
      )
      setOptions(filteredOptions)
    }
  }

  const handleSelect = (item: Option) => {
    if (!multiSelect) {
      setIsVisible('')
      setValue(item.label)
      onChange(name, item.label)
      return
    }
    const itemExists = selectedValues.some(
      (selectedItem) => selectedItem.label === item.label && selectedItem.value === item.value
    )

    if (itemExists) {
      const updatedValues = selectedValues.filter((val) => val.label !== item.label || val.value !== item.value)
      setSelectedValues(updatedValues)
      onChange(name, updatedValues.map((selectedItem) => selectedItem.value))
    } else {
      const updatedValues = [...selectedValues, item]
      setSelectedValues(updatedValues)
      onChange(name, updatedValues.map((selectedItem) => selectedItem.value))
    }

    Keyboard.dismiss()
  }

  const removeSelectedValue = (value: string) => {
    const updatedValues = selectedValues.filter((selected) => selected.value !== value)
    setSelectedValues(updatedValues)
    onChange(name, updatedValues.map((selectedItem) => selectedItem.value))
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label} onPress={() => { setIsVisible('') }}>
        {label}
        {isRequired && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <View style={{ position: 'relative' }}>
        <View style={styles.dropdown}>
          <TextInput
            placeholder='Search Preferred Hospital/Health care CentreSearch Preferred Hospital/Health care'
            value={value}
            editable={editable}
            onChangeText={handleInputChange}
            onFocus={() => { setIsVisible(name) }}
            style={[styles.input, !editable && styles.inputDisabled]}
            pointerEvents={editable ? 'auto' : 'none'}
          />
        </View>
        {isVisible === name && options.length > 0 && (
          <View style={styles.dropdownOptionsContainer}>
            <ScrollView nestedScrollEnabled={true} bounces={false}>
              {options.map((item, index) => (
                <TouchableOpacity key={`${item.value}-${index}`} style={styles.option} onPress={() => { handleSelect(item) }}>
                  <Text style={styles.optionText}>{item.label}</Text>
                  {selectedValues.some((selected) => selected.value === item.value) && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      {extraInfo.trim().length > 0 && <Text style={styles.extraInfo}>{extraInfo}</Text>}
      {error !== null && <Text style={styles.error}>{error}</Text>}
      {multiSelect &&
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {selectedValues.map((item, index) => (
            <View key={`${index}-${item.value}`} style={styles.selectedItem}>
              <Text>{item.label}</Text>
              <TouchableOpacity onPress={() => { removeSelectedValue(item.value) }}>
                <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>}

    </View>
  )
}

export default SearchMultiSelect

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    width: '100%',
    marginVertical: 4
  },
  dropdown: {
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 8,
    backgroundColor: theme.colors.white
  },
  input: {
    fontSize: 16,
    color: theme.colors.textPrimary
  },
  inputDisabled: {
    color: theme.colors.textSecondary,
    opacity: 0.5
  },
  dropdownOptionsContainer: {
    position: 'absolute',
    left: 0,
    top: '100%',
    width: '100%',
    zIndex: 9999,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 8,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGrey
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.textPrimary
  },
  selectedItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 100,
    marginRight: 4,
    marginTop: 4
  },
  extraInfo: {
    fontSize: 12,
    color: theme.colors.darkGrey
  }
})

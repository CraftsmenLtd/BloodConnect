import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Keyboard,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native'
import { Text } from '../text/AppText'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import type { Option } from './types'
import { commonStyles } from './commonStyles'
import { spacing, radius } from '../../setup/theme/tokens'

type MultiSelectProps = {
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
  placeholder?: string;
}

const SearchMultiSelect = ({
  name,
  label,
  isVisible,
  setIsVisible,
  error,
  onChange,
  editable = true,
  isRequired = false,
  options: initialOptions = [],
  fetchOptions,
  multiSelect = false,
  extraInfo = '',
  initialValue = '',
  placeholder = 'Search Preferred Hospital/Health Care'
}: MultiSelectProps) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const [value, setValue] = useState(initialValue)
  const [searchText, setSearchText] = useState('')
  const [selectedValues, setSelectedValues] = useState<Option[]>([])
  const [options, setOptions] = useState<Option[]>(initialOptions)
  const [isLoading, setIsLoading] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<TextInput>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (initialOptions.length > 0) {
      setOptions(initialOptions)
    }
  }, [initialOptions])

  useEffect(() => () => {
    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const handleInputChange = (text: string) => {
    setSearchText(text)
    if (fetchOptions !== null && fetchOptions !== undefined) {
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current)
      }
      setIsLoading(true)
      typingTimeoutRef.current = setTimeout(() => {
        requestIdRef.current += 1
        const currentId = requestIdRef.current
        fetchOptions(text)
          .then((newOptions) => { if (currentId === requestIdRef.current) setOptions(newOptions) })
          .catch(() => { if (currentId === requestIdRef.current) setOptions([]) })
          .finally(() => { if (currentId === requestIdRef.current) setIsLoading(false) })
      }, 500)
    } else {
      const filteredOptions = initialOptions.filter((option) =>
        option.value.toLowerCase().includes(text.toLowerCase())
      )
      setOptions(filteredOptions)
    }
  }

  const openDropdown = () => {
    if (!editable) return
    setIsVisible(name)
    if (value !== '') {
      handleInputChange(value)
    } else {
      setSearchText('')
      setOptions(initialOptions)
    }
  }

  const closeDropdown = () => {
    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsLoading(false)
    setIsVisible('')
    Keyboard.dismiss()
  }

  const handleSelect = (item: Option) => {
    if (!multiSelect) {
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current)
      }
      setIsLoading(false)
      setValue(item.label)
      onChange(name, item.label)
      setIsVisible('')
      Keyboard.dismiss()

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
  }

  const removeSelectedValue = (selectedValue: string) => {
    const updatedValues = selectedValues.filter((selected) => selected.value !== selectedValue)
    setSelectedValues(updatedValues)
    onChange(name, updatedValues.map((selectedItem) => selectedItem.value))
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={styles.asterisk}> *</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.dropdown, !editable && styles.inputDisabled]}
        onPress={openDropdown}
        activeOpacity={1}
        disabled={!editable}
      >
        <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
        <Text
          style={[styles.fieldText, value === '' && styles.placeholderText]}
          numberOfLines={1}
        >
          {value === '' ? placeholder : value}
        </Text>
      </TouchableOpacity>

      {extraInfo.trim().length > 0 && <Text style={styles.extraInfo}>{extraInfo}</Text>}
      {error !== null && error !== undefined && <Text style={styles.error}>{error}</Text>}

      {multiSelect
        && <View style={styles.chipContainer}>
          {selectedValues.map((item, index) => (
            <View key={`${index}-${item.value}`} style={styles.selectedItem}>
              <Text>{item.label}</Text>
              <TouchableOpacity onPress={() => { removeSelectedValue(item.value) }}>
                <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>}

      <Modal
        transparent
        visible={isVisible === name}
        onRequestClose={closeDropdown}
        onShow={() => { searchInputRef.current?.focus() }}
        statusBarTranslucent
      >
        <TouchableOpacity style={styles.backdrop} onPress={closeDropdown} activeOpacity={1}>
          <View style={styles.dropdownContainer}>
            <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchInputRef}
                  placeholder={placeholder}
                  placeholderTextColor={theme.colors.textTertiary}
                  value={searchText}
                  onChangeText={handleInputChange}
                  style={styles.searchInput}
                />
                <TouchableOpacity onPress={() => {
                  if (typingTimeoutRef.current !== null) {
                    clearTimeout(typingTimeoutRef.current)
                  }
                  setIsLoading(false)
                  setSearchText('')
                  setOptions([])
                }}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
              <ScrollView keyboardShouldPersistTaps="handled">
                {options.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.value}-${index}`}
                    style={styles.option}
                    onPress={() => { handleSelect(item) }}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                    {selectedValues.some((selected) => selected.value === item.value) && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

export default SearchMultiSelect

const { height } = Dimensions.get('window')

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    width: '100%',
    marginVertical: spacing.xs
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radius.md,
    backgroundColor: theme.colors.surface
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary
  },
  placeholderText: {
    color: theme.colors.textTertiary
  },
  inputDisabled: {
    opacity: 0.5
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm
  },
  selectedItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
    marginTop: spacing.xs
  },
  extraInfo: {
    fontSize: 12,
    color: theme.colors.textSecondary
  },
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    paddingTop: spacing.xxxxl,
    paddingHorizontal: spacing.lg
  },
  dropdownContainer: {
    width: '100%'
  },
  modalSheet: {
    width: '100%',
    maxHeight: height * 0.45,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...theme.elevation.md
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md
  },
  searchIcon: {
    marginRight: spacing.sm
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: spacing.sm
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderStrong
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.textPrimary
  }
})

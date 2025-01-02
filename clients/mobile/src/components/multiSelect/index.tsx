import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Theme } from '../../setup/theme'
import { commonStyles } from '../inputElement/commonStyles'
import { useTheme } from '../../setup/theme/hooks/useTheme'

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: Option[];
  onSelect: (selected: Option[]) => void;
  placeholder?: string;
  label?: string;
  isRequired?: boolean;
  minRequiredLabel?: string;
  enableSearch?: boolean;
  fetchOptions?: (searchText: string) => Promise<Option[]>;
  editable?: boolean;
}

/**
 * MultiSelect Component
 *
 * A customizable multi-select dropdown component.
 *
 * @param {Option[]} options - Array of options available for selection. Each option has `label` and `value` properties.
 * @param {Option[]} selectedValues - Array of currently selected options.
 * @param {(selected: Option[]) => void} onSelect - Callback triggered when the selected options are updated.
 * @param {string} [placeholder='Select options'] - Placeholder text shown when no options are selected.
 * @param {string} [label] - Label displayed above the dropdown.
 * @param {boolean} [isRequired=false] - Whether the field is required.
 * @param {string} [minRequiredLabel] - Optional text indicating a minimum required condition.
 * @param {boolean} [enableSearch=false] - Whether to enable the search feature in the dropdown.
 * @param {(searchText: string) => Promise<Option[]>} [fetchOptions] - Function to fetch options dynamically based on search text.
 * @param {boolean} [editable=true] - Whether the input is editable.
 *
 * @example
 * // Example Usage:
 * const options = [
 *   { label: 'Option 1', value: '1' },
 *   { label: 'Option 2', value: '2' },
 *   { label: 'Option 3', value: '3' },
 * ];
 * const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
 *
 * const handleSelect = (selected: Option[]) => {
 *   setSelectedOptions(selected);
 * };
 *
 * <MultiSelect
 *   options={options}
 *   selectedValues={selectedOptions}
 *   onSelect={handleSelect}
 *   placeholder="Select options"
 *   label="Choose Options"
 *   isRequired={true}
 *   minRequiredLabel="Please select at least one option."
 *   enableSearch={true}
 *   fetchOptions={async (searchText) => {
 *     // Fetch dynamic options based on `searchText`
 *     return [
 *       { label: `Dynamic ${searchText}`, value: `dynamic_${searchText}` },
 *     ];
 *   }}
 *   editable={true}
 * />
 *
 * @returns {React.FC} A multi-select dropdown component.
 */
const MultiSelect: React.FC<MultiSelectProps> = React.memo(({
  options,
  selectedValues,
  onSelect,
  placeholder = 'Select options',
  label,
  isRequired = false,
  minRequiredLabel,
  enableSearch = false,
  fetchOptions,
  editable = true
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const [isVisible, setIsVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [dropdownTop, setDropdownTop] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<View>(null)

  // Fetch dynamic options when search text changes
  useEffect(() => {
    if (enableSearch && (fetchOptions != null) && (searchText.trim() !== '')) {
      const fetchData = () => {
        setIsLoading(true)
        fetchOptions(searchText)
          .then((dynamicOptions) => {
            setFilteredOptions(dynamicOptions)
          })
          .catch((_) => {
            setFilteredOptions([])
          })
          .finally(() => {
            setIsLoading(false)
          })
      }

      const timeoutId = setTimeout(fetchData, 500) // 500ms debounce

      return () => { clearTimeout(timeoutId) }
    } else {
      setFilteredOptions(options)
    }
  }, [searchText])

  // Measure input position and set dropdown top dynamically
  const measureInputPosition = useCallback(() => {
    inputRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownTop(y + height)
    })
  }, [])

  const toggleDropdown = useCallback(() => {
    if (!isVisible) {
      measureInputPosition()
    }
    setIsVisible(!isVisible)
    setSearchText('')
    setFilteredOptions(options)
  }, [isVisible, options, measureInputPosition])

  const handleSearch = useCallback((text: string) => {
    setSearchText(text)
  }, [])

  const handleSelect = useCallback((item: Option) => {
    const isSelected = selectedValues.some((selected) => selected.value === item.value)

    if (isSelected) {
      const updatedValues = selectedValues.filter((selected) => selected.value !== item.value)
      onSelect(updatedValues)
    } else {
      const updatedValues = [...selectedValues, item]
      onSelect(updatedValues)
    }
  }, [selectedValues, onSelect])

  const removeSelectedValue = useCallback((value: string) => {
    const updatedValues = selectedValues.filter((selected) => selected.value !== value)
    onSelect(updatedValues)
  }, [selectedValues, onSelect])

  const formatLabel = (label: string) => {
    const parts = label.split(',')
    if (parts.length > 2) {
      return `${parts[0]},${parts[1]}`
    }
    return label
  }

  // Adjust dropdown position when keyboard is shown or hidden
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      measureInputPosition
    )
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      measureInputPosition
    )

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [measureInputPosition])

  const dropdownContent = useMemo(() => {
    return (
      <View style={styles.dropdown}>
        {enableSearch && (
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchText}
            onChangeText={handleSearch}
            editable={editable}
          />
        )}
        {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
        <ScrollView>
          {filteredOptions.map((item) => (
            <TouchableOpacity
              key={item.value}
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
    )
  }, [enableSearch, searchText, isLoading, filteredOptions, selectedValues, handleSelect, handleSearch])

  return (
    <View style={styles.container}>
      {/* Label and Input Field */}
      {(label != null) && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        ref={inputRef}
        onPress={toggleDropdown}
        style={styles.inputContainer}
      >
        <View style={styles.selectedValuesContainer}>
          {selectedValues.length === 0
            ? (
              <Text style={styles.placeholder}>{placeholder}</Text>
              )
            : (
                selectedValues.map((item) => (
                <View key={item.value} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{formatLabel(item.label)}</Text>
                  <TouchableOpacity onPress={() => { removeSelectedValue(item.value) }}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                ))
              )}
        </View>
        <Ionicons name={isVisible ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Optional Minimum Required Label */}
      {(minRequiredLabel != null) && <Text style={styles.minRequiredLabel}>{minRequiredLabel}</Text>}

      {/* Modal */}
      <Modal transparent={true} visible={isVisible} onRequestClose={toggleDropdown}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={toggleDropdown}
          activeOpacity={1}
        >
          <View style={[styles.dropdownContainer, { top: dropdownTop }]}>
            {dropdownContent}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
})

const { width } = Dimensions.get('window')

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    width: '100%',
    marginVertical: 10
  },
  requiredStar: {
    color: theme.colors.primary
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.colors.white
  },
  placeholder: {
    fontSize: 16,
    color: theme.colors.grey
  },
  selectedValuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 5
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.greyBG,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5
  },
  selectedItemText: {
    marginRight: 5
  },
  minRequiredLabel: {
    fontSize: 12,
    color: theme.colors.darkGrey,
    marginTop: 4
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  dropdownContainer: {
    position: 'absolute',
    width,
    paddingHorizontal: 16
  },
  dropdown: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 10,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.extraLightGray
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.textPrimary
  }
})

export default MultiSelect

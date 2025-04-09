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
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Theme } from '../../setup/theme'
import { commonStyles } from '../inputElement/commonStyles'
import { useTheme } from '../../setup/theme/hooks/useTheme'

type Option = {
  label: string;
  value: string;
}

type MultiSelectProps = {
  name: string;
  label?: string;
  options: Option[];
  selectedValues: string[];
  onSelect: (name: string, selected: string[]) => void;
  placeholder?: string;
  isRequired?: boolean;
  minRequiredLabel?: string;
  enableSearch?: boolean;
  fetchOptions?: (searchText: string) => Promise<Option[]>;
  editable?: boolean;
  error?: string | null;
}

/**
 * MultiSelect Component
 *
 * A customizable multi-select dropdown component.
 *
 * @example
 * // Example Usage:
 * const options = [
 *   { label: 'Option 1', value: '1' },
 *   { label: 'Option 2', value: '2' },
 *   { label: 'Option 3', value: '3' },
 * ];
 * const [selectedValues, setSelectedValues] = useState<string[]>([]);
 *
 * const handleSelect = (name: string, selected: string[]) => {
 *   setSelectedValues(selected);
 * };
 *
 * <MultiSelect
 *   name="example"
 *   options={options}
 *   selectedValues={selectedValues}
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
  name,
  options,
  selectedValues,
  onSelect,
  placeholder = 'Select options',
  label,
  isRequired = false,
  minRequiredLabel,
  enableSearch = false,
  fetchOptions,
  editable = true,
  error
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const [isVisible, setIsVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<View>(null)
  const searchInputRef = useRef<TextInput>(null)

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

      const timeoutId = setTimeout(fetchData, 500)

      return () => { clearTimeout(timeoutId) }
    } else {
      setFilteredOptions(options)
    }
  }, [searchText])

  const toggleDropdown = () => {
    setIsVisible((prev) => !prev)
    setTimeout(() => { searchInputRef.current?.focus() }, 200)
    setSearchText('')
    setFilteredOptions(options)
  }

  const handleSearch = (text: string) => { setSearchText(text) }

  const handleSelect = useCallback((item: Option) => {
    const isSelected = selectedValues.includes(item.value)

    if (isSelected) {
      const updatedValues = selectedValues.filter((value) => value !== item.value)
      onSelect(name, updatedValues)
    } else {
      const updatedValues = [...selectedValues, item.value]
      onSelect(name, updatedValues)
    }
  }, [selectedValues, onSelect, name])

  const removeSelectedValue = useCallback((value: string) => {
    const updatedValues = selectedValues.filter((selected) => selected !== value)
    onSelect(name, updatedValues)
  }, [selectedValues, onSelect, name])

  const dropdownContent = useMemo(() => {
    return (
      <View style={styles.dropdown}>
        {enableSearch && (
            <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={handleSearch}
              editable={editable}
            />
            <TouchableOpacity onPress={() => { setSearchText('') }}>
            <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
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
              {selectedValues.includes(item.value) && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }, [enableSearch, searchText, isLoading, filteredOptions, selectedValues, handleSelect, handleSearch, isVisible])

  return (
    <View style={styles.container}>
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
        activeOpacity={1}
      >
        <View style={styles.input}>
          <Text style={styles.placeholder}>{placeholder}</Text>
        </View>
        <Ionicons name={isVisible ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {(minRequiredLabel != null) && <Text style={styles.minRequiredLabel}>{minRequiredLabel}</Text>}
      {error !== null && <Text style={styles.error}>{error}</Text>}
      <View style={styles.selectedItemContainer}>
          {
            selectedValues.map((value) =>
              <View key={value} style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>
                  {value}
                </Text>
                <TouchableOpacity onPress={() => { removeSelectedValue(value) }}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>)
          }
        </View>

      <Modal transparent visible={isVisible} onRequestClose={toggleDropdown}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={toggleDropdown}
          activeOpacity={1}
        >
          <View style={[styles.dropdownContainer, { top: 10 }]}>
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
    marginVertical: 3
  },
  requiredStar: {
    color: theme.colors.primary
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.colors.white
  },
  placeholder: {
    fontSize: 16,
    color: theme.colors.grey
  },
  input: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 5,
    paddingVertical: 3
  },
  selectedItemContainer: {
    gap: 4,
    flexDirection: 'row',
    flexWrap: 'wrap'
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
    backgroundColor: theme.colors.blackFaded,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dropdownContainer: {
    position: 'absolute',
    width,
    paddingHorizontal: 16
  },
  dropdown: {
    width: '100%',
    maxHeight: 400,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 10,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: 8
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

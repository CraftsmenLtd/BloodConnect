import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { MaterialIcons } from '@expo/vector-icons'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { commonStyles } from './commonStyles'

interface Option {
  label: string;
  value: string;
}

interface MultiSelectDropdownComponentProps {
  label: string;
  options: Option[];
  name: string;
  placeholder: string;
  onChange: (name: string | undefined, value: string[]) => void;
  isRequired: boolean;
  selectedValue: string;
  error?: string | null;
  extraInfo?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownComponentProps> = ({ label, options, name, selectedValue, placeholder, isRequired, onChange, error, extraInfo = '' }) => {
  const styles = createStyles(useTheme())
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  const handleSelect = (item: Option) => {
    if (selectedValues.includes(item.value)) {
      setSelectedValues(selectedValues.filter((val) => val !== item.value))
      onChange(name, selectedValues.filter((val) => val !== item.value))
    } else {
      setSelectedValues([...selectedValues, item.value])
      onChange(name, [...selectedValues, item.value])
    }
  }

  const removeSelectedItem = (value: string) => {
    setSelectedValues(selectedValues.filter((item) => item !== value))
    onChange(name, selectedValues.filter((item) => item !== value))
  }

  const renderItem = (item: Option) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => { handleSelect(item) }}>
      <Text style={styles.itemText}>{item.label}</Text>
      {selectedValues.includes(item.value) && (
        <MaterialIcons name="check" size={20} color="red" style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  )

  return (
    <View>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        selectedStyle={styles.selectedTextStyle}
        maxHeight={300}
        data={options}
        labelField='label'
        valueField='value'
        placeholder={placeholder}
        value={selectedValue}
        renderItem={(item) => renderItem(item as Option)}
        multiSelect
      />
      {extraInfo.trim().length > 0 && <Text style={styles.extraInfo}>{extraInfo}</Text>}
      <View style={styles.selectedContainer}>
        {selectedValues.map((value) => (
          <TouchableOpacity key={value} onPress={() => { removeSelectedItem(value) }}>
            <View style={styles.selectedTag}>
              <Text style={styles.selectedText}>{value}</Text>
              <TouchableOpacity>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {error !== null && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  dropdown: {
    height: 50,
    borderColor: theme.colors.extraLightGray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8
  },
  placeholderStyle: {
    fontSize: 16,
    color: theme.colors.grey
  },
  selectedTextStyle: {
    fontSize: 16,
    color: theme.colors.charcoalGray
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.extraLightGray
  },
  itemText: {
    fontSize: 16,
    color: theme.colors.charcoalGray,
    flex: 1
  },
  checkIcon: {
    marginLeft: 10
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.extraLightGray,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 4,
    borderColor: theme.colors.primary,
    borderWidth: 1
  },
  selectedText: {
    fontSize: 14,
    color: theme.colors.charcoalGray,
    marginRight: 8
  },
  removeIcon: {
    fontSize: 14,
    color: theme.colors.primary
  },
  extraInfo: {
    fontSize: 12,
    color: theme.colors.darkGrey
  }
})

export default MultiSelectDropdown

import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from '../text/AppText'
import { Dropdown } from 'react-native-element-dropdown'
import { MaterialIcons } from '@expo/vector-icons'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { commonStyles } from './commonStyles'
import { spacing, radius } from '../../setup/theme/tokens'

type Option = {
  label: string;
  value: string;
}

type MultiSelectDropdownComponentProps = {
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

const MultiSelectDropdown: React.FC<MultiSelectDropdownComponentProps> = ({
  label,
  options,
  name,
  selectedValue,
  placeholder,
  isRequired,
  onChange,
  error,
  extraInfo = ''
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)
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
      <Text variant="body" style={styles.itemText}>{item.label}</Text>
      {selectedValues.includes(item.value) && (
        <MaterialIcons name="check" size={20} color={theme.colors.primary} style={styles.checkIcon} />
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
        containerStyle={styles.dropdownList}
        itemContainerStyle={styles.dropdownItemContainer}
        activeColor={theme.colors.surfaceVariant}
        maxHeight={300}
        data={options}
        labelField='label'
        valueField='value'
        placeholder={placeholder}
        value={selectedValue}
        renderItem={(item) => renderItem(item as Option)}
        multiSelect
      />
      {extraInfo.trim().length > 0 && <Text variant="caption" style={styles.extraInfo}>{extraInfo}</Text>}
      <View style={styles.selectedContainer}>
        {selectedValues.map((value) => (
          <TouchableOpacity key={value} onPress={() => { removeSelectedItem(value) }}>
            <View style={styles.selectedTag}>
              <Text variant="bodySmall" style={styles.selectedText}>{value}</Text>
              <TouchableOpacity>
                <Text variant="bodySmall" style={styles.removeIcon}>✕</Text>
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
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: theme.colors.surface
  },
  dropdownList: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: radius.md
  },
  dropdownItemContainer: {
    backgroundColor: theme.colors.surface
  },
  placeholderStyle: {
    fontSize: 16,
    color: theme.colors.textTertiary
  },
  selectedTextStyle: {
    fontSize: 16,
    color: theme.colors.textPrimary
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  itemText: {
    color: theme.colors.textPrimary,
    flex: 1
  },
  checkIcon: {
    marginLeft: spacing.md
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    margin: spacing.xs,
    borderColor: theme.colors.primary,
    borderWidth: 1
  },
  selectedText: {
    color: theme.colors.textPrimary,
    marginRight: spacing.sm
  },
  removeIcon: {
    color: theme.colors.primary
  },
  extraInfo: {
    color: theme.colors.textSecondary
  }
})

export default MultiSelectDropdown

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Dropdown as CustomDropdown } from 'react-native-element-dropdown'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'

interface Option {
  label: string;
  value: string;
}

interface DropdownComponentProps {
  label: string;
  options: Option[];
  name: string;
  placeholder: string;
  onChange: (name: string | undefined, value: string) => void;
  isRequired: boolean;
  selectedValue: string;
  error?: string | null;
}

const Dropdown: React.FC<DropdownComponentProps> = ({ label, options, name, selectedValue, placeholder, isRequired, onChange, error = '' }) => {
  const styles = createStyles(useTheme())

  const renderItem = (item: Option) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.label}</Text>
      {selectedValue === item.value && (
        <MaterialIcons name="check" size={20} color="red" style={styles.checkIcon} />
      )}
    </View>
  )

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <CustomDropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        data={options}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={selectedValue}
        onChange={(item: Option) => { onChange(name, item.value) }}
        renderItem={(item: Option) => renderItem(item)}
      />
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
    color: theme.colors.textPrimary
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
    color: theme.colors.textPrimary,
    flex: 1
  },
  checkIcon: {
    marginLeft: 10,
    color: theme.colors.primary
  }
})

export default Dropdown

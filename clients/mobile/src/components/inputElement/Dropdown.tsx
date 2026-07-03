import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { Dropdown as CustomDropdown } from 'react-native-element-dropdown'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'

type Option = {
  label: string;
  value: string;
}

type DropdownComponentProps = {
  label?: string;
  options: Option[];
  name: string;
  placeholder: string;
  onChange: (name: string | undefined, value: string) => void;
  isRequired: boolean;
  selectedValue: string;
  error?: string | null;
  readonly?: boolean;
  allowSearch?: boolean;
}

const Dropdown: React.FC<DropdownComponentProps> = ({
  label,
  options,
  name,
  selectedValue,
  placeholder,
  isRequired,
  onChange,
  error = '',
  readonly = false,
  allowSearch = false
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  const renderItem = (item: Option) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.label}</Text>
      {selectedValue === item.value && (
        <MaterialIcons name="check" size={20} color={theme.colors.primary} style={styles.checkIcon} />
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
        placeholderStyle={[styles.placeholderStyle, readonly && styles.textReadonly]}
        selectedTextStyle={[styles.selectedTextStyle, readonly && styles.textReadonly]}
        data={options}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={selectedValue}
        onChange={(item: Option) => { onChange(name, item.value) }}
        renderItem={(item: Option) => renderItem(item)}
        disable={readonly}
        activeColor={readonly ? 'transparent' : theme.colors.surfaceVariant}
        containerStyle={styles.dropdownList}
        itemContainerStyle={styles.dropdownItemContainer}
        inputSearchStyle={styles.inputSearch}
        search={allowSearch}
        searchPlaceholder='Type to Search...'
      />
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
    borderRadius: 8,
    paddingHorizontal: 10,
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
  textReadonly: {
    color: theme.colors.textSecondary,
    opacity: 0.7
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  itemText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    flex: 1
  },
  checkIcon: {
    marginLeft: 10,
    color: theme.colors.primary
  },
  dropdownList: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8
  },
  dropdownItemContainer: {
    backgroundColor: theme.colors.surface
  },
  inputSearch: {
    color: theme.colors.textPrimary,
    borderColor: theme.colors.border,
    borderRadius: 6
  }
})

export default Dropdown

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../text/AppText'
import { Dropdown as CustomDropdown } from 'react-native-element-dropdown'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import type { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'
import useFieldFocus from './hooks/useFieldFocus'
import { spacing, radius } from '../../setup/theme/tokens'

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
  const { isFocused, handleFocus, handleBlur } = useFieldFocus()
  const hasError = error !== null && error !== undefined && error !== ''

  const renderItem = (item: Option) => (
    <View style={styles.itemContainer}>
      <Text variant="body" style={styles.itemText}>{item.label}</Text>
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
        style={[
          styles.dropdown,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          readonly && styles.inputDisabled
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
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
    marginLeft: spacing.md,
    color: theme.colors.primary
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
  inputSearch: {
    color: theme.colors.textPrimary,
    borderColor: theme.colors.border,
    borderRadius: radius.md
  }
})

export default Dropdown

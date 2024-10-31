import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard, Dimensions, ScrollView } from 'react-native'
import { InputProps } from './types'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'

interface DropdownProps extends InputProps {
  options: Array<{ label: string; value: string }>;
  isVisible: string;
  setIsVisible: (name: string) => void;
  readOnly?: boolean;
}

export const CustomDropdown = ({
  name,
  label,
  options,
  value,
  onChangeText,
  isVisible,
  setIsVisible,
  error,
  isRequired = false,
  readOnly = false
}: DropdownProps) => {
  const styles = createStyles(useTheme(), readOnly)
  const [showAbove, setShowAbove] = useState(false)
  const dropdownRef = useRef<View | null>(null)
  const windowHeight = Dimensions.get('window').height

  useEffect(() => {
    if (isVisible === name && dropdownRef.current !== null) {
      dropdownRef.current.measureInWindow((x, y, width, height) => {
        const dropdownHeight = options.length * 48
        const spaceBelow = windowHeight - y - height
        setShowAbove(dropdownHeight > spaceBelow)
      })
    }
  }, [isVisible])

  const handleSelect = (name: string | undefined, item: string) => {
    onChangeText(name, item)
    setIsVisible('')
    Keyboard.dismiss()
  }

  const handleOutsidePress = () => {
    setIsVisible('')
  }

  const handleDropdownToggle = () => {
    if (!readOnly) {
      setIsVisible(isVisible === name ? '' : name)
      Keyboard.dismiss()
    }
  }

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={[styles.container, { zIndex: isVisible === name ? 10 : 1 }]} ref={dropdownRef}>
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.asterisk}> *</Text>}
        </Text>
        {readOnly
          ? <Text style={[styles.selectedText, styles.dropdown]}>{value !== '' ? value : options[0].label}</Text>
          : <Text onPress={handleDropdownToggle} style={[styles.selectedText, styles.dropdown]}>{value !== '' ? value : options[0].label}</Text>
        }

        {isVisible === name && !readOnly && (
          <View
            style={[
              styles.dropdownOptionsContainer,
              showAbove ? { bottom: '65%' } : { top: '100%' },
              { zIndex: 9999 }
            ]}
          >
            <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
              {options.map(item => (
                <TouchableOpacity key={item.label} style={styles.option} onPress={() => { handleSelect(name, item.value) }}>
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {error !== null && <Text style={styles.error}>{error}</Text>}
      </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (theme: Theme, readOnly: boolean): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
    marginVertical: 4
  },
  scrollView: {
    maxHeight: 500
  },
  dropdown: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    backgroundColor: theme.colors.white
  },
  selectedText: {
    fontSize: theme.typography.fontSize,
    color: readOnly ? theme.colors.textSecondary : theme.colors.textPrimary,
    opacity: readOnly ? 0.5 : 1
  },
  dropdownOptionsContainer: {
    position: 'absolute',
    left: 0,
    width: '100%',
    zIndex: 9999,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 8,
    shadowColor: theme.colors.charcoalGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.extraLightGray
  },
  optionText: {
    fontSize: theme.typography.fontSize,
    color: theme.colors.textPrimary
  }
})

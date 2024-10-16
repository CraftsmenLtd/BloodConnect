import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native'
import { InputProps } from './types'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { commonStyles } from './commonStyles'

interface DropdownProps extends InputProps {
  options: Array<{ label: string; value: string }>;
  isVisible: string;
  setIsVisible: (name: string) => void;
}

export const CustomDropdown = ({ name, label, options, value, onChangeText, isVisible, setIsVisible, error, isRequired = false }: DropdownProps) => {
  const styles = createStyles(useTheme())
  const [showAbove, setShowAbove] = useState(false)
  const dropdownRef = useRef<View | null>(null)
  const windowHeight = Dimensions.get('window').height

  useEffect(() => {
    if (isVisible === name && dropdownRef.current) {
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
    setIsVisible((prevState: string) => (prevState === name ? '' : name))
    Keyboard.dismiss()
  }

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={[styles.container, { zIndex: isVisible === name ? 10 : 1 }]} ref={dropdownRef}>
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.asterisk}> *</Text>}
        </Text>
        <TouchableOpacity style={styles.dropdown} onPress={handleDropdownToggle}>
          <Text style={styles.selectedText}>{value !== '' ? value : options[0].label}</Text>
        </TouchableOpacity>

        {isVisible === name && (
          <View
            style={[
              styles.dropdownOptionsContainer,
              showAbove ? { bottom: '65%' } : { top: '100%' },
              { zIndex: 9999 }
            ]}
          >
            {options.map(item => (
              <TouchableOpacity key={item.label} style={styles.option} onPress={() => { handleSelect(name, item.value) }}>
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {error !== null && <Text style={styles.error}>{error}</Text>}
      </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
    marginVertical: 4
  },
  dropdown: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  selectedText: {
    fontSize: 16,
    color: '#333'
  },
  dropdownOptionsContainer: {
    position: 'absolute',
    left: 0,
    width: '100%',
    zIndex: 9999,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  optionText: {
    fontSize: 16
  }
})

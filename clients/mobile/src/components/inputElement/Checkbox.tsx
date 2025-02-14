import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'

interface CheckboxProps {
  isChecked: boolean;
  name: string;
  onCheckboxChange: (name: string, text: boolean) => void;
  checkboxColor?: string;
  children: React.ReactNode;
}

const Checkbox: React.FC<CheckboxProps> = ({ isChecked, onCheckboxChange, name, children, checkboxColor = 'red' }) => {
  const styles = createStyles(useTheme())
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => { onCheckboxChange(name, !isChecked) }} style={styles.checkboxContainer}>
        <MaterialIcons
          name={isChecked ? 'check-box' : 'check-box-outline-blank'}
          size={32}
          color={checkboxColor}
        />
      </TouchableOpacity>
      {children}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  checkboxContainer: {
    marginRight: 10
  },
  text: {
    fontSize: theme.typography.fontSize,
    flexWrap: 'wrap',
    flex: 1
  },
  link: {
    textDecorationLine: 'underline'
  }
})

export default Checkbox

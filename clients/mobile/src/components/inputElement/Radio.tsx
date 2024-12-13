import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { InputProps } from './types'
import { commonStyles } from './commonStyles'

interface RadioButtonProps extends Omit<InputProps, 'placeholder' | 'onChangeText'> {
  onPress: (name: string, value: string) => void;
  options: string[];
  extraInfo?: string;
}

const RadioButton: React.FC<RadioButtonProps> = ({ name, options, value, onPress, label, error, isRequired = false, extraInfo = '' }) => {
  const styles = createStyles(useTheme())
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {isRequired && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <View style={styles.wrapper}>
        {options.map(item => (
          <TouchableOpacity
            key={item}
            style={styles.option}
            onPress={() => { onPress(name, item) }}
          >
            <View style={[styles.outer, value === item && styles.selectedOptionColor]}>
              {value === item && <View style={styles.inner} />}
            </View>
            <Text style={styles.item}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {extraInfo.trim().length > 0 && <Text style={styles.extraInfo}>{extraInfo}</Text>}
      {error !== null && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    flex: 1
  },
  wrapper: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 16
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  item: {
    textTransform: 'capitalize'
  },
  outer: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedOptionColor: {
    borderColor: theme.colors.primary
  },
  inner: {
    width: 13,
    height: 13,
    backgroundColor: theme.colors.primary,
    borderRadius: 10
  },
  extraInfo: {
    color: theme.colors.darkGrey
  }
})

export default RadioButton

import React, { useEffect, useState } from 'react'
import { TouchableOpacity, Animated, StyleSheet, View, Text } from 'react-native'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { commonStyles } from '../inputElement/commonStyles'

type CustomToggleProps = {
  value?: boolean;
  onToggle?: (val: boolean) => void;
  isReadOnly?: boolean;
  label?: string;
  direction?: 'row' | 'column';
  isRequired?: boolean;
}

/**
 * CustomToggle Component
 *
 * A customizable toggle switch for boolean values with optional label and read-only state.
 * Use React Native's `Animated` API for smooth thumb transitions.
 *
 * Props:
 * -------
 * @param value - Optional. Current toggle state (`true` for ON, `false` for OFF).
 * Defaults to `false`.
 * @param onToggle - Optional. Callback function called with the new toggle value when toggled.
 * @param isReadOnly - Optional. If `true`, disables toggling interaction. Defaults to `false`.
 * @param label - Optional. A label displayed beside or above the toggle.
 * Defaults to `"Available For Donation"`.
 * @param direction - Optional. Layout direction of the label and toggle.
 * Can be `'row'` or `'column'`. Defaults to `'column'`.
 * @param isRequired - Optional. If required, value should be true, false otherwise.
 *
 * Returns:
 * --------
 * A toggle UI component with animated thumb and customizable label, direction, and styles.
 *
 * Example Usage:
 * ---------------
 * ```tsx
 * import CustomToggle from './components/CustomToggle'
 *
 * const [isEnabled, setIsEnabled] = useState(false)
 *
 * return (
 *   <CustomToggle
 *     value={isEnabled}
 *     onToggle={setIsEnabled}
 *     label="Enable Notifications"
 *     direction="row"
 *     isRequired={true}
 *   />
 * )
 * ```
 *
 * Dependencies:
 * @param isRequired
 */
const CustomToggle: React.FC<CustomToggleProps> = ({
  value = false,
  onToggle,
  isReadOnly = false,
  label = 'Available For Donation',
  direction = 'column',
  isRequired = false
}): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const translateX = useState(new Animated.Value(0))[0]

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 30 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [value])

  const handleToggle = (): void => {
    if (isReadOnly) return
    onToggle?.(!value)
  }

  return (
    <View style={[styles.wrapper, { flexDirection: direction }]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.asterisk}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.toggleContainer,
          { backgroundColor: value ? theme.colors.primary : theme.colors.grey },
        ]}
        activeOpacity={isReadOnly ? 1 : 0.8}
        onPress={handleToggle}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContainer: {
    width: 60,
    height: 30,
    borderRadius: 30,
    padding: 3,
    justifyContent: 'center',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
})

export default CustomToggle

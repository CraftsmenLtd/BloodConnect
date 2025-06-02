import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import PhoneInput from 'react-native-phone-number-input'
import { WARNINGS } from '../../setup/constant/consts'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import Loader from '../loaders/loader'
import Warning from '../warning'
import { commonStyles } from './commonStyles'
import usePhoneNumberInput from './hooks/usePhoneNumberInput'

/**
 * PhoneNumberInput Component
 *
 * A reusable phone number input field using `react-native-phone-number-input`.
 * Supports validation, formatting, and optional warnings for data visibility.
 *
 * Props:
 * -------
 * @param value - The current phone number value.
 * @param onChange -{(name: string, text: string) => void}  -
 * Callback triggered when the formatted phone number changes.
 * @param placeholder - Placeholder text for the phone input.
 * @param name - Field identifier used for form tracking.
 * @param label - Label displayed above the input field.
 * @param isRequired - Indicates if the field is required.
 * If true, an asterisk is shown beside the label.
 * @param showWarning - If true, displays a warning message about phone number visibility.
 * @returns A styled phone number input field with label, validation, and warning support.
 *
 * Example Usage:
 * ---------------
 * ```tsx
 *   <PhoneNumberInput
 *      value={phone}
 *      onChange={setPhone}
 *      placeholder="Enter phone number"
 *      name="userPhone"
 *      label="Phone"
 *      isRequired
 *      showWarning
 *   />
 * ```
 *
 * Dependencies:
 * - react-native-phone-number-input
 * - libphonenumber-js
 */
const PhoneNumberInput = ({
  value,
  onChange,
  placeholder = 'Enter your contact number',
  name = 'contactNumber',
  label = 'Contact Number',
  isRequired = true,
  showWarning = false
}: {
  value: string;
  onChange: (name: string, text: string) => void;
  placeholder?: string;
  name?: string;
  label?: string;
  isRequired?: boolean;
  showWarning?: boolean;
}): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const {
    phoneInputRef,
    isValid,
    handleChangeFormattedText,
    parsedValue,
    defaultCode,
    countryLoading
  } = usePhoneNumberInput(
    value,
    name,
    onChange
  )

  if (countryLoading) {
    return (
      <View style={styles.loader}>
        <Loader size="small" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.asterisk}> *</Text>}
        </Text>
      )}
      <PhoneInput
        key={`${defaultCode}-${parsedValue}`}
        ref={phoneInputRef}
        defaultValue={parsedValue}
        value={parsedValue}
        defaultCode={defaultCode as never}
        layout="first"
        onChangeFormattedText={handleChangeFormattedText}
        containerStyle={[
          styles.phoneContainer,
          !isValid ? styles.errorBorder : null
        ]}
        textContainerStyle={styles.textInput}
        textInputStyle={styles.text}
        codeTextStyle={styles.codeText}
        flagButtonStyle={styles.flagButton}
        placeholder={placeholder}
      />
      {!isValid && <Text style={styles.error}>Please enter a valid phone number</Text>}
      {showWarning &&
        <Warning
          text={WARNINGS.PHONE_NUMBER_VISIBLE}
          showWarning={value !== ''}
        />
      }
    </View>
  )
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    marginVertical: 8
  },
  phoneContainer: {
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: theme.colors.white,
    height: 50,
    width: '100%',
    borderColor: theme.colors.extraLightGray
  },
  textInput: {
    backgroundColor: 'transparent',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 0
  },
  text: {
    height: 48,
    fontSize: 16,
    color: theme.colors.textSecondary
  },
  codeText: {
    fontSize: 16,
    color: theme.colors.textSecondary
  },
  flagButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8
  },
  errorText: {
    color: theme.colors.bloodRed,
    fontSize: 12,
    marginTop: 4
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60
  }
})

export default PhoneNumberInput

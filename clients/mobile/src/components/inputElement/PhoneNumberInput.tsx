import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import PhoneInput from 'react-native-phone-number-input'
import { WARNINGS } from '../../setup/constant/consts'
import type { Theme } from '../../setup/theme'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import Warning from '../warning'
import { commonStyles } from './commonStyles'
import usePhoneNumberInput from './hooks/usePhoneNumberInput'

const PhoneNumberInput = ({
  value,
  onChange,
  placeholder = 'Enter your contact number',
  name = 'contactNumber',
  label = 'Contact Number',
  isRequired = true,
  showWarning = false
}): React.ReactElement => {
  const theme = useTheme()
  const styles = createStyles(theme)
    const {
    phoneInputRef,
      isValid,
      handleChangeFormattedText,
      parsedValue,
      defaultCode
    } = usePhoneNumberInput(
    value,
    name,
    onChange
  )

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={styles.asterisk}> *</Text>}
        </Text>
      ) : null}
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
  }
})

export default PhoneNumberInput

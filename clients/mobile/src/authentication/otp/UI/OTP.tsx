import { View, StyleSheet, Text, TextInput } from 'react-native'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Theme } from '../../../setup/theme'
import { Button } from '../../../components/button/Button'
import { useOtp } from '../hooks/useOtp'
import LinkWithText from '../../../components/button/LinkWithText'
import { useTranslation } from 'react-i18next'

const OTP = () => {
  const { t } = useTranslation()
  const styles = createStyles(useTheme())
  const { otp, error, inputRefs, handleOtpChange, handleSubmit, email, loading, isButtonDisabled, resendOtpHandler, isDisabled, countdown } = useOtp()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('otp.enterAuthenticationCode')}</Text>
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>{t('otp.enter6DigitCodeSent')}</Text>
        <Text style={[styles.subtitle, styles.subtitleEmail]}> {t('common.email')} ({email})</Text>
      </View>
      <View style={styles.otpContainer}>
        {otp.map((digit: string, index: number) => (
          <TextInput
            key={index}
            style={styles.otpBox}
            value={digit}
            onChangeText={(text) => { handleOtpChange(text, index) }}
            keyboardType="numeric"
            maxLength={1}
            ref={(ref) => {
              if (ref !== null) {
                (inputRefs.current[index] = ref)
              }
            }}
          />
        ))}
      </View>
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      <LinkWithText
        staticText={t('otp.didntGetCode')}
        linkText={isDisabled === true ? ` Resend OTP in ${countdown}s` : ` ${t('otp.resendOtp')}`}
        onPress={resendOtpHandler}
        isDisabled={isDisabled}
        countdown={countdown}
      />
      <Button text={t('common.submit')} onPress={handleSubmit} disabled={isButtonDisabled} loading={loading} />
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: '15%',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.white
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.textPrimary
  },
  subtitleContainer: {
    marginBottom: 20
  },
  subtitle: {
    fontSize: theme.typography.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center'
  },
  subtitleEmail: {
    fontWeight: 'bold'
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  otpBox: {
    borderWidth: 1,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 5,
    padding: 10,
    fontSize: 20,
    textAlign: 'center',
    width: 50,
    height: 50
  },
  error: {
    textAlign: 'center',
    color: theme.colors.primary,
    fontSize: theme.typography.errorFontSize
  }
})

export default OTP

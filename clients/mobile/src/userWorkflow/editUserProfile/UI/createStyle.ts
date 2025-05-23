import { StyleSheet } from 'react-native'
import type { Theme } from '../../../setup/theme'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  gradientTop: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  gradientBottom: {
    flex: 1,
    backgroundColor: theme.colors.gradientBackground,
    opacity: 0.8
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.greyBG
  },
  infoContainer: {
    padding: 16
  },
  inputStyle: {
    backgroundColor: theme.colors.white
  },
  nidSection: {
    marginTop: 16
  },
  nidLabel: {
    marginBottom: 8
  },
  nidImages: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  nidImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginRight: 8
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGrey,
    backgroundColor: theme.colors.white
  },
  mapViewContainer: {
    borderRadius: 6,
    borderWidth: 1.5
  },
  dividerContainer: {
    marginBottom: 15
  },
  dividerLine: {
    backgroundColor: theme.colors.primary
  },
  inputFieldStyle: {
    padding: 1
  }
})

export default createStyles

import { StyleSheet } from 'react-native'
import type { Theme } from '../../../setup/theme'
import { spacing, radius } from '../../../setup/theme/tokens'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface
  },
  gradientTop: {
    flex: 1,
    backgroundColor: theme.colors.surface
  },
  gradientBottom: {
    flex: 1,
    backgroundColor: theme.colors.gradientBackground,
    opacity: 0.8
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.surface
  },
  infoContainer: {
    padding: spacing.lg
  },
  inputStyle: {
    backgroundColor: theme.colors.surface
  },
  nidSection: {
    marginTop: spacing.lg
  },
  nidLabel: {
    marginBottom: spacing.sm
  },
  nidImages: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  nidImage: {
    width: 150,
    height: 100,
    borderRadius: radius.md,
    marginRight: spacing.sm
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface
  },
  mapViewContainer: {
    borderRadius: radius.md,
    borderWidth: 1.5
  },
  dividerContainer: {
    marginBottom: spacing.lg
  },
  dividerLine: {
    backgroundColor: theme.colors.primary
  },
  inputFieldStyle: {
    padding: 1
  }
})

export default createStyles

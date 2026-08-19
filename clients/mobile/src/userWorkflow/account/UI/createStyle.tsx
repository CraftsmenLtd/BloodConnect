import { StyleSheet } from 'react-native'
import type { Theme } from '../../../setup/theme'
import { spacing, radius } from '../../../setup/theme/tokens'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: spacing.xl
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.border
  },
  imageOuterBorder: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageInnerBorder: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: radius.xl
  },
  profileInfo: {
    marginLeft: spacing.lg
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  profileLocationSection: {
    flexDirection: 'row'
  },
  profileLocation: {
    fontSize: 14,
    color: theme.colors.textSecondary
  },
  optionsSection: {
    borderColor: theme.colors.border
  },
  moreSection: {
    borderTopWidth: 4,
    borderColor: theme.colors.border
  },
  headingStyle: {
    alignItems: 'center',
    padding: spacing.lg
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg
  },
  optionText: {
    marginLeft: spacing.md,
    color: theme.colors.textSecondary,
    flex: 1
  },
  iconStyle: {
    color: theme.colors.textSecondary
  },
  optionIcon: {
    alignSelf: 'flex-end',
    color: theme.colors.textSecondary,
    verticalAlign: 'middle'
  },
  moreText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    marginLeft: spacing.lg,
    marginTop: spacing.lg
  },
  loadingIndicator: {
    marginTop: spacing.xl,
    color: theme.colors.primary
  }

})

export default createStyles

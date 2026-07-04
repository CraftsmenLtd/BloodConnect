import { StyleSheet } from 'react-native'
import type { Theme } from '../../../../setup/theme'
import { spacing, radius } from '../../../../setup/theme/tokens'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
    paddingTop: spacing.xs
  },
  scrollViewContent: {
    paddingBottom: spacing.xl
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingTop: spacing.lg,
    ...theme.elevation.sm,
    position: 'relative'
  },
  header: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold'
  },
  name: {
    fontWeight: 'bold',
    color: theme.colors.textPrimary
  },
  subText: {
    color: theme.colors.textSecondary
  },
  emptyPadding: {
    padding: spacing.sm
  },
  seekerDetails: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: radius.md
  },
  frameBloodType: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md
  },
  requestSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  requestUrgency: {
    backgroundColor: theme.colors.goldenYellow,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center'
  },
  emoji: {
    fontSize: 22
  },
  primaryCaption: {
    color: theme.colors.textSecondary
  },
  labelRow: {
    flexDirection: 'row',
    verticalAlign: 'bottom'
  },
  icons: {
    verticalAlign: 'middle',
    paddingRight: spacing.xs
  },
  bloodtypeImage: {
    marginRight: spacing.sm,
    color: theme.colors.bloodRed
  },
  requestText: {
    fontSize: 16,
    flexDirection: 'column'
  },
  highlightedText: {
    fontWeight: 'bold'
  },
  urgentText: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderColor: theme.colors.border
  },
  contactNumber: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderColor: theme.colors.border,
    borderTopWidth: 1
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  phoneNumber: {
    fontWeight: 'bold',
    color: theme.colors.textPrimary
  },
  infoRow: {
    flex: 1,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: spacing.md
  },
  label: {
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs
  },
  value: {
    color: theme.colors.textPrimary,
    flexWrap: 'wrap',
    flexShrink: 1
  },
  dividerHorizontal: {
    width: 1,
    backgroundColor: theme.colors.border,
    height: '100%'
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderColor: theme.colors.redFaded,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceVariant
  },
  callIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.sm,
    tintColor: theme.colors.primary,
    paddingHorizontal: spacing.md
  },
  callText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    lineHeight: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: theme.colors.surface
  },
  ignoreButton: {
    backgroundColor: theme.colors.surfaceVariant,
    flex: 1,
    marginRight: spacing.md,
    color: theme.colors.textPrimary
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    flex: 1,
    fontWeight: 'bold',
    borderRadius: radius.pill
  },
  acceptButtonText: {
    fontSize: theme.typography.fontSize,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.15
  },
  link: {
    textDecorationLine: 'underline'
  },
  error: {
    color: theme.colors.primary,
    textAlign: 'center'
  }
})

export default createStyles

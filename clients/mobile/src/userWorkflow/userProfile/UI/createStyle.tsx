import { commonStyles } from '../../../components/inputElement/commonStyles'
import type { Theme } from '../../../setup/theme'
import { StyleSheet } from 'react-native'
import { spacing, radius } from '../../../setup/theme/tokens'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface
  },
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong
  },
  row: {
    borderBottomWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: spacing.md
  },
  lastRow: {
    borderBottomWidth: 0
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.borderStrong,
    borderTopWidth: 1
  },
  editButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.pill,
    alignItems: 'center'
  },
  editButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  selectedItemContainer: {
    gap: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: radius.xl,
    paddingHorizontal: 1,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    justifyContent: 'space-between',
  },
  selectedItemText: {
    marginRight: spacing.xs
  },
  mapViewContainer: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg
  },
  dividerContainer: {
    marginBottom: 2
  },
  dividerLine: {
    backgroundColor: theme.colors.primary
  }
})

export default createStyles

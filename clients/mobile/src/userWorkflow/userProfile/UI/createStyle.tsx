import { commonStyles } from '../../../components/inputElement/commonStyles'
import type { Theme } from '../../../setup/theme'
import { StyleSheet } from 'react-native'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  ...commonStyles(theme),
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong
  },
  row: {
    borderBottomWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: 10
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
    padding: 16,
    paddingTop: 12,
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.borderStrong,
    borderTopWidth: 1
  },
  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 48,
    alignItems: 'center'
  },
  editButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  selectedItemContainer: {
    gap: 4,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: 1,
    paddingVertical: 3,
    marginBottom: 5,
    justifyContent: 'space-between',
  },
  selectedItemText: {
    marginRight: 5
  },
  mapViewContainer: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10
  },
  dividerContainer: {
    marginBottom: 2
  },
  dividerLine: {
    backgroundColor: theme.colors.primary
  }
})

export default createStyles

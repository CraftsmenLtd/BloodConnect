import type { Theme } from '../../../setup/theme'
import { StyleSheet } from 'react-native'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey
  },
  row: {
    borderBottomWidth: 1,
    borderColor: theme.colors.lightGrey,
    padding: 10
  },
  lastRow: {
    borderBottomWidth: 0
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 4
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.black
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: theme.colors.white,
    borderTopColor: theme.colors.lightGrey,
    borderTopWidth: 1
  },
  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 48,
    alignItems: 'center'
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.greyBG,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
    marginBottom: 6
  },
  selectedItemText: {
    marginRight: 5
  }
})

export default createStyles

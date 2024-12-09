import { Theme } from '../../../setup/theme'
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
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey
  },
  row: {
    borderBottomWidth: 1,
    borderColor: theme.colors.lightGrey,
    padding: 10
  },
  label: {
    fontSize: 14,
    color: '#757575',
    textTransform: 'capitalize',
    marginBottom: 4
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000'
  },
  input: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9f9f9'
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
  }
})

export default createStyles

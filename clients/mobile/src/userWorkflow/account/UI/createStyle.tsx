import { StyleSheet } from 'react-native'
import { Theme } from '../../../setup/theme'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: theme.colors.extraLightGray
  },
  imageOuterBorder: {
    width: 60,
    height: 60,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageInnerBorder: {
    width: 58,
    height: 58,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: theme.colors.extraLightGray,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 30
  },
  profileInfo: {
    marginLeft: 15
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
    color: 'gray'
  },
  optionsSection: {
    borderColor: theme.colors.extraLightGray
  },
  moreSection: {
    borderTopWidth: 4,
    borderColor: theme.colors.extraLightGray
  },
  headingStyle: {
    alignItems: 'center',
    padding: 15
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
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
    marginLeft: 15,
    marginTop: 16
  },
  loadingIndicator: {
    marginTop: 20,
    color: theme.colors.primary
  }

})

export default createStyles

import { StyleSheet } from 'react-native'
import { Theme } from '../../../setup/theme'

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.greyBG,
    paddingTop: 4
  },
  scrollViewContent: {
    // paddingHorizontal: 20,
    paddingBottom: 20
  },
  card: {
    backgroundColor: theme.colors.white,
    // backgroundColor: 'red',
    borderRadius: 10,
    padding: 16,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // elevation: 3,
    position: 'relative'
  },
  header: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary
  },
  subText: {
    fontSize: 14,
    color: theme.colors.textSecondary
  },
  emptyPadding: {
    padding: 8
  },
  seekerDetails: {
    borderBlockColor: '#f0f0f0',
    // backgroundColor: 'red'
    borderWidth: 2,
    borderColor: theme.colors.extraLightGray,
    borderRadius: 8
  },
  frameBloodType: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // padding: 8,
    // borderColor: theme.colors.extraLightGray,
    // borderWidth: 2,
    borderRadius: 6,
    borderTopEndRadius: 4,
    marginVertical: 8
    // backgroundColor: 'red'
  },
  requestSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15
  },
  requestUrgency: {
    backgroundColor: '#ffd700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20
  },
  alertImage: {
    height: 10,
    width: 10
  },
  emoji: {
    fontSize: 22
  },
  primaryCaption: {
    color: '#616161',
    fontSize: 12
  },
  bloodtypeImage: {
    width: 32,
    height: 32,
    marginRight: 8
  },
  requestText: {
    fontSize: 16,
    // color: theme.colors.textPrimary,
    // marginLeft: 8,
    // flex: 1,
    // flexWrap: 'wrap'
    flexDirection: 'column'
  },
  highlightedText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  urgentText: {
    color: theme.colors.black,
    fontWeight: 'bold',
    fontSize: 12
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 10,
    // paddingHorizontal: 5,
    borderColor: theme.colors.extraLightGray
    // borderTopWidth: 1,
    // marginVertical: 8,
    // backgroundColor: 'red'
  },
  contactNumber: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: '#e0e0e0',
    // borderWidth: 1,
    // borderTopWidth: 1,
    borderTopWidth: 1
    // borderRadius: 8,
    // backgroundColor: '#ffffff',
    // marginVertical: 8
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
    // paddingEnd: 12
  },
  infoRow: {
    flex: 1,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: theme.colors.extraLightGray,
    paddingHorizontal: 12
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  divider: {
    // height: 1,
    // backgroundColor: theme.colors.extraLightGray,
    // marginVertical: 8
  },
  dividerHorizontal: {
    width: 1,
    backgroundColor: theme.colors.extraLightGray,
    // marginHorizontal: 10,
    height: '100%'
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    textAlign: 'center',
    paddingHorizontal: 12,
    borderRadius: 48,
    borderColor: '#FFA6A6',
    borderWidth: 1,
    backgroundColor: '#FFEDED'
    // width: 97,
    // height: 36,
  },
  callIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
    tintColor: '#ff6347',
    paddingHorizontal: 10
  },
  callText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
    backgroundColor: theme.colors.white
  },
  ignoreButton: {
    backgroundColor: theme.colors.greyBG,
    flex: 1,
    marginRight: 10,
    color: 'black'

  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    flex: 1
  }
})

export default createStyles

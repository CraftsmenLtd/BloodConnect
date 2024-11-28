import { Text, View, Image, SafeAreaView, ScrollView, TouchableOpacity, Linking, StyleProp, ImageStyle } from 'react-native'
import { useTheme } from '../../../../setup/theme/hooks/useTheme'
import { Button } from '../../../../components/button/Button'
import { Ionicons } from '@expo/vector-icons'
import createStyles from './createStyles'
import { useResponseDonationRequest } from '../hooks/useResponseDonationRequest'
import React from 'react'

const ResponseDonationRequest = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const {
    bloodRequest,
    handleAcceptRequest,
    handleIgnore,
    formatDateTime,
    isRequestAccepted
  } = useResponseDonationRequest()

  if (bloodRequest === null) return null

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.header}>Blood Request</Text>
          <Text style={styles.name}>{bloodRequest.seekerName ?? 'Patient Name'}</Text>
          <Text style={styles.subText}>  Posted on {bloodRequest?.donationDateTime !== null && bloodRequest?.donationDateTime !== undefined
            ? new Date(bloodRequest.donationDateTime).toLocaleString()
            : 'N/A'}</Text>
          <View style={styles.emptyPadding}></View>
          <View style={styles.seekerDetails}>
            <View style={styles.frameBloodType}>
              <View style={styles.requestSection}>
                <Image source={require('../../../../../assets/images/bloodtype.png')} style={styles.bloodtypeImage as StyleProp<ImageStyle>} />
                <View style={styles.requestText}>
                  <Text style={styles.primaryCaption}>Looking for</Text>
                  <Text style={styles.highlightedText}>{bloodRequest.bloodQuantity ?? 0} bags {bloodRequest.neededBloodGroup}(ve) blood</Text>
                </View>
              </View>
              {bloodRequest.urgencyLevel === 'urgent' && (
                <View style={styles.requestUrgency}>
                  <Image source={require('../../../../../assets/images/alert.png')} style={styles.alertImage as StyleProp<ImageStyle>} />
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.labelRow}>
                  <Ionicons name="location-outline" size={14} color="gray" style={styles.icons} />
                  <Text style={styles.label}>Donation point</Text>
                </View>
                <Text style={styles.value}>{bloodRequest.location ?? 'Location not provided'}</Text>
              </View>
              <View style={styles.dividerHorizontal}></View>
              <View style={styles.infoRow}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-outline" size={14} color="gray" style={styles.icons} />
                  <Text style={styles.label}>Time & Date</Text>
                </View>
                <Text style={styles.value}>
                  {formatDateTime(bloodRequest.donationDateTime)}
                </Text>
              </View>
            </View>

            <View style={styles.contactNumber}>
              <View style={styles.contactRow}>
                <View>
                  <Text style={styles.label}>Contact Number</Text>
                  <Text style={styles.phoneNumber}>{bloodRequest.contactNumber ?? 'Contact Not Shared'}</Text>
                </View>
                <TouchableOpacity style={styles.callButton} onPress={() => { void (async() => { await Linking.openURL(`tel:${bloodRequest.contactNumber}`) })() }} >
                  <Image
                    source={require('../../../../../assets/images/call.png')}
                    style={styles.callIcon as StyleProp<ImageStyle>}
                  />
                  <Text style={styles.callText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Name of the Patient</Text>
              <Text style={styles.value}>{bloodRequest.patientName ?? 'Patient Name not provided'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Short Description of the Problem</Text>
              <Text style={styles.value}>
                {bloodRequest.shortDescription ?? 'No description provided'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Transportation Facility for the Donor</Text>
              <Text style={styles.value}>{bloodRequest.transportationInfo ?? 'No transportation info'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {!isRequestAccepted && <Button text="Ignore" buttonStyle={styles.ignoreButton} textStyle={{ color: theme.colors.black }} onPress={handleIgnore} />}
        <Button text={isRequestAccepted ? 'Request Accepted' : 'Accept Request'} disabled={isRequestAccepted} buttonStyle={styles.acceptButton} textStyle={styles.acceptButtonText} onPress={() => { void handleAcceptRequest() }} />
      </View>
    </SafeAreaView>
  )
}

export default ResponseDonationRequest

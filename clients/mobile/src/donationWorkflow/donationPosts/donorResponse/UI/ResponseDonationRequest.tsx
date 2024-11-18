import { Text, View, Image, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native'
import { useTheme } from '../../../../setup/theme/hooks/useTheme'
import { Button } from '../../../../components/button/Button'
import { Ionicons } from '@expo/vector-icons'
import createStyles from './createStyles'
import { DonationScreenParams } from '../../../types'
import { useResponseDonationRequest } from '../hooks/useResponseDonationRequest'

interface DonationDetailsProps {
  request: DonationScreenParams;
};

const ResponseDonationRequest: React.FC<DonationDetailsProps> = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const {
    bloodRequest,
    handleAcceptRequest,
    handleIgnore,
    formatDateTime
  } = useResponseDonationRequest()

  if (bloodRequest === null) return null

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.header}>Blood Request</Text>
          <Text style={styles.name}>{bloodRequest.seekerName || 'Patient Name'}</Text>
          <Text style={styles.subText}>Posted on {bloodRequest.donationDateTime ? new Date(bloodRequest.donationDateTime).toLocaleString() : 'N/A'}</Text>
          <View style={styles.emptyPadding}></View>
          <View style={styles.seekerDetails}>
            <View style={styles.frameBloodType}>
              <View style={styles.requestSection}>
                <Image source={require('../../../../../assets/images/bloodtype.png')} style={styles.bloodtypeImage} />
                <View style={styles.requestText}>
                  <Text style={styles.primaryCaption}>Looking for</Text>
                  <Text style={styles.highlightedText}>{bloodRequest.bloodQuantity || 0} bags {bloodRequest.neededBloodGroup}(ve) blood</Text>
                </View>
              </View>
              {bloodRequest.urgencyLevel === 'urgent' && (
                <View style={styles.requestUrgency}>
                  <Image source={require('../../../../../assets/images/alert.png')} style={styles.alertImage} />
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
                <Text style={styles.value}>{bloodRequest.location || 'Location not provided'}</Text>
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
                  <Text style={styles.phoneNumber}>{bloodRequest.contactNumber || 'Contact Not Shared'}</Text>
                </View>
                <TouchableOpacity style={styles.callButton} onPress={async() => Linking.openURL(`tel:${bloodRequest.contactNumber}`)}>
                  <Image
                    source={require('../../../../../assets/images/call.png')}
                    style={styles.callIcon}
                  />
                  <Text style={styles.callText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Name of the Patient</Text>
              <Text style={styles.value}>{bloodRequest.patientName || 'Patient Name not provided'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Short Description of the Problem</Text>
              <Text style={styles.value}>
                {bloodRequest.shortDescription || 'No description provided'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Transportation Facility for the Donor</Text>
              <Text style={styles.value}>{bloodRequest.transportationInfo || 'No transportation info'}</Text>
            </View>
          </View>
          {/* <Text>Notification Data: {notificationData}</Text> */}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button text="Ignore" buttonStyle={styles.ignoreButton} textStyle={{ color: theme.colors.black }} onPress={handleIgnore} />
        <Button text="Accept Request" buttonStyle={styles.acceptButton} onPress={handleAcceptRequest} />
      </View>
      <Button text='Request Accepted'>Request Accepted</Button>
    </SafeAreaView>
  )
}

export default ResponseDonationRequest

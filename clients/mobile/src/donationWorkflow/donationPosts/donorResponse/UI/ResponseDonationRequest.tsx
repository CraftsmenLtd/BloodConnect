import type {
  StyleProp,
  ImageStyle
} from 'react-native';
import {
  Text,
  View,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking
} from 'react-native'
import { useTheme } from '../../../../setup/theme/hooks/useTheme'
import { Button } from '../../../../components/button/Button'
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { formatBloodQuantity } from '../../../donationHelpers'
import createStyles from './createStyles'
import { useResponseDonationRequest } from '../hooks/useResponseDonationRequest'
import React from 'react'
import { openMapLocation } from '../../../../utility/mapUtils'
import { useMyActivityContext } from '../../../../myActivity/context/useMyActivityContext'
import { STATUS } from '../../../types'

const ResponseDonationRequest = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { myResponses } = useMyActivityContext()
  const {
    bloodRequest,
    userProfile,
    error,
    isLoading,
    handleAcceptRequest,
    handleIgnore,
    formatDateTime,
    isRequestAccepted
  } = useResponseDonationRequest()

  if (bloodRequest === null) return null

  const isRequestAlreadyAccepted = myResponses.some(
    (response) =>
      response.requestPostId === bloodRequest.requestPostId &&
      response.status === STATUS.ACCEPTED
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.header}>Blood Request</Text>
          <Text style={styles.name}>{bloodRequest.seekerName ?? 'Seeker Name'}</Text>
          <Text style={styles.subText}>Posted on {
            bloodRequest?.donationDateTime !== null &&
            bloodRequest?.donationDateTime !== undefined
              ? new Date(bloodRequest.donationDateTime).toLocaleString()
              : 'N/A'
          }
          </Text>
          <View style={styles.emptyPadding}></View>
          <View style={styles.seekerDetails}>
            <View style={styles.frameBloodType}>
              <View style={styles.requestSection}>
                <MaterialIcons
                name='bloodtype'
                style={styles.bloodtypeImage as StyleProp<ImageStyle>}
                size={32}
                />
                <View style={styles.requestText}>
                  <Text style={styles.primaryCaption}>Looking for</Text>
                  <Text style={styles.highlightedText}>
                    {formatBloodQuantity(bloodRequest.bloodQuantity) ?? 0} {bloodRequest.requestedBloodGroup}(ve) blood
                  </Text>
                </View>
              </View>
              {bloodRequest.urgencyLevel === 'urgent' && (
                <View style={styles.requestUrgency}>
                  <MaterialCommunityIcons
                    name='alert'
                  />
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
                {bloodRequest.location !== ''
                  ? <TouchableOpacity onPress={() => { openMapLocation({ location: bloodRequest.location }) }}>
                      <Text style={[styles.value, styles.link]}>{bloodRequest.location}</Text>
                    </TouchableOpacity>
                  : <Text style={styles.value}>Location not provided</Text>}

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
                  {isRequestAlreadyAccepted
                    ? <Text style={styles.phoneNumber}>
                      {bloodRequest.contactNumber ?? 'Contact Not Shared'}
                    </Text>
                    : <Text style={styles.hiddenNumber}>
                      {`${bloodRequest.contactNumber.slice(0, 4)}********${bloodRequest.contactNumber.slice(-2)}`}
                      </Text>
                  }
                </View>
                {isRequestAlreadyAccepted && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => {
                      void (async() => {
                        await Linking.openURL(`tel:${bloodRequest.contactNumber}`)
                      })()
                    }}
                  >
                    <Image
                      source={require('../../../../../assets/images/call.png')}
                      style={styles.callIcon as StyleProp<ImageStyle>}
                    />
                    <Text style={styles.callText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {bloodRequest.patientName !== '' &&
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name of the Patient</Text>
                <Text style={styles.value}>{bloodRequest.patientName ?? 'Patient Name not provided'}</Text>
              </View>
            }
            {bloodRequest.shortDescription !== '' &&
              <View style={styles.infoRow}>
                <Text style={styles.label}>Short Description of the Problem</Text>
                <Text style={styles.value}>
                  {bloodRequest.shortDescription ?? 'No description provided'}
                </Text>
              </View>
            }
            {bloodRequest.transportationInfo !== '' &&
              <View style={styles.infoRow}>
                <Text style={styles.label}>Transportation Facility for the Donor</Text>
                <Text style={styles.value}>{bloodRequest.transportationInfo ?? 'No transportation info'}</Text>
              </View>
            }
          </View>
        </View>
      </ScrollView>

      {error !== null && <Text style={styles.error}>{error}</Text>}
      {userProfile.userId !== bloodRequest.seekerId && userProfile.bloodGroup === bloodRequest.requestedBloodGroup &&
        <View style={styles.buttonContainer}>
          {!isLoading && !(isRequestAccepted || isRequestAlreadyAccepted) &&
            <Button
              text="Ignore"
              buttonStyle={styles.ignoreButton}
              textStyle={{ color: theme.colors.black }}
              onPress={() => {
                void handleIgnore()
              }} />}
          <Button
            text={isRequestAccepted || isRequestAlreadyAccepted ? 'Request Accepted' : 'Accept Request'}
            loading={isLoading}
            disabled={isRequestAccepted || isRequestAlreadyAccepted}
            buttonStyle={styles.acceptButton}
            textStyle={styles.acceptButtonText}
            onPress={() => {
              void handleAcceptRequest()
            }} />
        </View>
      }
    </SafeAreaView>
  )
}

export default ResponseDonationRequest

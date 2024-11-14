import React, { useState, useEffect } from 'react'
import { Text, View, Image, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native'
import { useTheme } from '../../../../setup/theme/hooks/useTheme'
import { Button } from '../../../../components/button/Button'
import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import createStyles from './createStyles'
import { DonationScreenParams } from '../../../types'
import * as Notifications from 'expo-notifications'
import { setupNotificationListeners } from '../../../../setup/notification/NotificationHandler'
import { registerForPushNotificationsAsync, saveDeviceTokenToSNS } from '../../../../setup/notification/Notification'
import { useFetchClient } from '../../../../setup/clients/useFetchClient'
import { useNotificationContext } from '../../../../setup/notification/NotificationContext'
import { formatDateTime } from '../../../../utility/formatTimeAndDate'
import { useResponseDonationRequest } from '../hooks/useResponseDonationRequest'
import { SCREENS } from '../../../../setup/constant/screens'

interface DonationDetailsProps {
  request: DonationScreenParams;
};

const ResponseDonationRequest: React.FC<DonationDetailsProps> = () => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const { notificationData } = useNotificationContext()
  const { isLoading, error, acceptRequest } = useResponseDonationRequest()
  const navigation = useNavigation<NavigationProp<any>>()

  const bloodRequest = typeof notificationData === 'string' ? JSON.parse(notificationData) : notificationData

  useEffect(() => {
    if (notificationData !== null) {
      console.log('Notification Data:', notificationData)
    }
  }, [notificationData])

  const handleAcceptRequest = async() => {
    try {
      await acceptRequest({
        requestPostId: bloodRequest.requestPostId,
        seekerId: bloodRequest.seekerId,
        createdAt: bloodRequest.createdAt,
        acceptanceTime: new Date().toISOString()
      })
    } catch (err) {
      console.error('Failed to accept request:', err)
    }
  }

  const handleIgnore = () => {
    navigation.navigate(SCREENS.POSTS)
  }

  if (notificationData === null || notificationData === undefined) {
    console.log('returning to posts page as notificatio data is null')
    navigation.navigate(SCREENS.POSTS)
  }

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
    </SafeAreaView>
  )
}

export default ResponseDonationRequest
// add another name (request poster)

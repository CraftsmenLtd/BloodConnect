import React from 'react'
import { Text, View, Image, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { useTheme } from '../../../../setup/theme/hooks/useTheme'
import { Button } from '../../../../components/button/Button'
import { Ionicons } from '@expo/vector-icons'
import createStyles from './createStyles'
import { DonationScreenParams } from '../../../types'

interface DonationDetailsProps {
  request: DonationScreenParams;
};

const ResponseDonationRequest: React.FC<DonationDetailsProps> = (request) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.header}>Blood Request</Text>
          <Text style={styles.name}>Patient Name</Text>
          <Text style={styles.subText}>Posted on {new Date(request.donationDateTime).toLocaleString()}</Text>
          <View style={styles.emptyPadding}></View>
          <View style={styles.seekerDetails}>
            <View style={styles.frameBloodType}>
              <View style={styles.requestSection}>
                <Image source={require('../../../../../assets/images/bloodtype.png')} style={styles.bloodtypeImage} />
                <View style={styles.requestText}>
                  <Text style={styles.primaryCaption}>Looking for</Text>
                  <Text style={styles.highlightedText}>2 bags A+(ve) blood</Text>
                </View>
              </View>
              <View style={styles.requestUrgency}>
                <Image source={require('../../../../../assets/images/alert.png')} style={styles.alertImage} />
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.labelRow}>
                  <Ionicons name="location-outline" size={14} color="gray" style={styles.icons} />
                  <Text style={styles.label}>Donation point</Text>
                </View>
                <Text style={styles.value}>Science Lab, Dhaka</Text>
              </View>
              <View style={styles.dividerHorizontal}></View>
              <View style={styles.infoRow}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-outline" size={14} color="gray" style={styles.icons} />
                  <Text style={styles.label}>Time & Date</Text>
                </View>
                <Text style={styles.value}>05:00 PM, Today</Text>
              </View>
            </View>

            <View style={styles.contactNumber}>
              <View style={styles.contactRow}>
                <View>
                  <Text style={styles.label}>Contact Number</Text>
                  <Text style={styles.phoneNumber}>+880 1733 658734</Text>
                </View>
                <TouchableOpacity style={styles.callButton} onPress={async() => Linking.openURL('tel:+8801733658734')}>
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
              <Text style={styles.value}>Azhar Uddin</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Short Description of the Problem</Text>
              <Text style={styles.value}>
                Accident patient, need to cut his legs. Anaemia issue. Age 45
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Transportation Facility for the Donor</Text>
              <Text style={styles.value}>Will provide fare after reaching</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button text="Ignore" buttonStyle={styles.ignoreButton} textStyle={{ color: theme.colors.black }} onPress={() => { console.log('ignore button') }} />
        <Button text="Accept Request" buttonStyle={styles.acceptButton} onPress={() => { console.log('accept request') }} />
      </View>
    </SafeAreaView>
  )
}

export default ResponseDonationRequest

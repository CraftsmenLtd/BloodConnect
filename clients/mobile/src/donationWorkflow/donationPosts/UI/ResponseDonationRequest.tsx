import React from 'react'
import { Text, View, Image, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { useTheme } from '../../../setup/theme/hooks/useTheme'
import { Button } from '../../../components/button/Button'
import { useResponseDonationRequest } from '../hooks/useResponseDonationRequest'
import AuthLayout from '../../../authentication/AuthLayout'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import createStyles from './createStyles'

interface DonationDetailsInterface {
  
};

const ResponseDonationRequest = () => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.card}>
            <Text style={styles.header}>Blood Request</Text>
            <Text style={styles.name}>Seeker Name</Text>
            <Text style={styles.subText}>Posted on 12:09 PM, 10 Sep 2024</Text>
            <View style={styles.emptyPadding}></View>
            <View style={styles.seekerDetails}>
              <View style={styles.frameBloodType}>
                <View style={styles.requestSection}>
                    <Image source={require('../../../../assets/images/bloodtype.png')} style={styles.bloodtypeImage}/>
                    <View style={styles.requestText}>
                        <Text style={styles.primaryCaption}>Looking for</Text>
                        <Text style={styles.highlightedText}>2 bags A+(ve) blood</Text>
                    </View>
                </View>
                <View style={styles.requestUrgency}>
                  <Text style={styles.urgentText}>
                    <Image source={require('../../../../assets/images/alert.png')} style={styles.alertImage}/>
                    URGENT
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Donation point</Text>
                  <Text style={styles.value}>Science Lab, Dhaka</Text>
                </View>

                <View style={styles.dividerHorizontal} />

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Time & Date</Text>
                  <Text style={styles.value}>05:00 PM, Today</Text>
                </View>
              </View>

              <View style={styles.contactNumber}>
                <View style={styles.contactRow}>
                  <View>
                    <Text style={styles.label}>Contact Number</Text>
                    <Text style={styles.phoneNumber}>+880 1733 658734</Text>
                  </View>
                  <TouchableOpacity style={styles.callButton}>
                    <Image
                      source={require('../../../../assets/images/call.png')}
                      style={styles.callIcon}
                    />
                    <Text style={styles.callText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                  <Text style={styles.label}>Name of the Patient</Text>
                  <Text style={styles.value}>Azhar Uddin</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                  <Text style={styles.label}>Short Description of the Problem</Text>
                  <Text style={styles.value}>
                  Accident patient, need to cut his legs. Anaemia issue. Age 45
                  </Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                  <Text style={styles.label}>Transportation Facility for the Donor</Text>
                  <Text style={styles.value}>Will provide fare after reaching</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button text="Ignore" buttonStyle={styles.ignoreButton} textStyle={{ color: theme.colors.black }} onPress={() => { console.log('ignore button') }} />
          <Button text="Accept Request" buttonStyle={styles.acceptButton} onPress={() => {}} />
        </View>
      </SafeAreaView>
  )
}

export default ResponseDonationRequest

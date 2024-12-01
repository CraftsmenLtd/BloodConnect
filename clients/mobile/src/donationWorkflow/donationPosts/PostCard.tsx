import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../setup/theme/hooks/useTheme'
import { Theme } from '../../setup/theme'
import { Button } from '../../components/button/Button'
import { DonationData } from './DonationPosts'

interface PostCardProps {
  post: DonationData;
  updateHandler: (donationData: DonationData) => void;
};

export const PostCard: React.FC<PostCardProps> = ({ post, updateHandler }) => {
  const styles = createStyles(useTheme())
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{post.patientName}</Text>
          <Text style={styles.postTime}>Posted on {new Date(post.donationDateTime).toLocaleString()}</Text>
        </View>

        <TouchableOpacity onPress={() => { setShowDropdown(!showDropdown) }}>
          <Ionicons name="ellipsis-vertical" size={20} color="gray" />
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdown}>
            <TouchableOpacity onPress={() => { updateHandler(post) }}>
              <Text style={styles.dropdownText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity >
              <Text style={styles.dropdownText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.bloodInfoWrapper}>
        <View style={styles.bloodInfo}>
          <View style={styles.bloodRow}>
            <Ionicons name="water" size={20} color="red" />
            <View style={styles.bloodText}>
              <Text>Looking for</Text>
              <Text>{post.bloodQuantity} {post.requestedBloodGroup} blood</Text>
            </View>
          </View>
          {post.urgencyLevel === 'urgent' && <Text style={styles.urgentText}>URGENT</Text>}
        </View>

        <View style={styles.locationTimeContainer}>
          <View style={styles.locationTimeWrapper}>
            <View style={{ paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={16} color="gray" />
                <Text style={styles.donationInfoPlaceholder}>Donation point</Text>
              </View>
              <Text>{post.location}</Text>
            </View>
          </View>
          <View style={styles.locationTimeWrapper}>
            <View style={{ paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={16} color="gray" />
                <Text style={styles.donationInfoPlaceholder}>Time & Date</Text>
              </View>
              <Text>{new Date(post.donationDateTime).toLocaleTimeString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.donationInfoPlaceholder}>Short Description of the Problem</Text>
          <Text style={styles.description}>{post.shortDescription}</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button text='View details' buttonStyle={styles.buttonStyle} textStyle={styles.textStyle} onPress={() => { console.log('Not Implemented') }} />
      </View>
    </View>
  )
}
const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    padding: 15,
    marginBottom: 10,
    position: 'relative'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16
  },
  postTime: {
    color: 'gray'
  },
  dropdown: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 1
  },
  dropdownText: {
    paddingVertical: 5,
    color: 'black'
  },
  locationTimeContainer: {
    borderBottomColor: theme.colors.extraLightGray,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  locationTimeWrapper: {
    borderRightColor: theme.colors.extraLightGray,
    borderRightWidth: 1,
    width: '50%',
    paddingHorizontal: 8
  },
  bloodInfoWrapper: {
    borderRadius: 5,
    borderColor: theme.colors.extraLightGray,
    borderWidth: 1,
    marginBottom: 8
  },
  bloodInfo: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: theme.colors.extraLightGray,
    borderBottomWidth: 1
  },
  bloodRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  descriptionContainer: {
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  donationInfoPlaceholder: {
    fontSize: 12,
    marginBottom: 4,
    color: theme.colors.grey
  },
  bloodText: {
    marginLeft: 5,
    fontSize: 15
  },
  urgentText: {
    color: 'red',
    fontWeight: 'bold'
  },
  buttonContainer: {
    width: '100%'
  },
  buttonStyle: {
    backgroundColor: theme.colors.extraLightGray
  },
  textStyle: {
    color: theme.colors.textPrimary
  }
})

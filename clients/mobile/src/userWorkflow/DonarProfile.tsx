import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useDonarProfile from './useDonarProfile'

const DonarProfile = () => {
  const { donarProfile, loading, error, handleCall } = useDonarProfile()

  if (loading === true) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF5252" />
      </View>
    )
  }

  if (error !== null) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={{
            uri: 'https://avatar.iran.liara.run/public/boy?username=Ash'
          }}
          style={styles.profileImage}
        />
        <View style={styles.bloodGroupBadge}>
          <Text style={styles.bloodGroupText}>
            {donarProfile.bloodGroup}(ve)
          </Text>
        </View>
      </View>

      <Text style={styles.name}>{donarProfile.name}</Text>
      <View>
        {Array.isArray(donarProfile.preferredDonationLocations) &&
          donarProfile.preferredDonationLocations.length > 0 &&
          donarProfile.preferredDonationLocations.map((location, index) => (
            <View style={styles.locationRow} key={index}>
              <Ionicons name="location-sharp" size={16} color="#FF5252" />
              <Text style={styles.locationText}>
                {location.area}, {location.city}
              </Text>
            </View>
          ))}
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.detailsText}>Age: {donarProfile.age}</Text>
        <Text style={styles.detailsSeparator}>•</Text>
        <Text style={styles.detailsText}>Weight: {donarProfile.weight}</Text>
        <Text style={styles.detailsSeparator}>•</Text>
        <Text style={styles.detailsText}>Height: {donarProfile.height}"</Text>
      </View>

      <View style={{ width: '100%' }}>
        <TouchableOpacity style={styles.callButton} onPress={() => handleCall(donarProfile.phoneNumbers)}>
          <Text style={styles.callButtonText}>Call now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff'
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center'
  },
  container: {
    borderTopColor: 'black',
    borderTopWidth: 1,
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  profileContainer: {
    position: 'relative',
    alignItems: 'center'
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FF5252'
  },
  bloodGroupBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FF5252'
  },
  bloodGroupText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333'
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  detailsText: {
    fontSize: 14,
    color: '#666'
  },
  detailsSeparator: {
    fontSize: 20,
    color: '#FF5252',
    marginHorizontal: 4
  },
  callButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF5252',
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 16
  },
  callButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold'
  }
})

export default DonarProfile

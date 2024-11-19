import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const DonarProfile = () => {
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
          <Text style={styles.bloodGroupText}>A+(ve)</Text>
        </View>
      </View>

      <Text style={styles.name}>Sufi Ahmed</Text>
      <Text style={styles.location}>Mohakhali DOHS, Dhaka</Text>

      <View style={styles.detailsRow}>
        <Text style={styles.detailsText}>Age: 29</Text>
        <Text style={styles.detailsSeparator}>•</Text>
        <Text style={styles.detailsText}>Weight: 82</Text>
        <Text style={styles.detailsSeparator}>•</Text>
        <Text style={styles.detailsText}>Height: 5'6"</Text>
      </View>

      <View style={{ width: '100%' }}>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="phone-call" size={20} color="white" />
          <Text style={styles.callButtonText}>Call now</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopColor: 'black',
    borderTopWidth: 1,
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 16,
    // flex: 1,
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
